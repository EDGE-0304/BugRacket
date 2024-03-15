const express = require('express');
const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());
router.use(express.text());

const PORT = process.env.PORT || 8081;
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://EDGEBugRacket:4kqSP0Md2OlEps9k@bugracket.kc2nsam.mongodb.net/?retryWrites=true&w=majority";
const mongoClient = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const UserDB = "UserDB"
const UserCollection = "users"

const DeviceDB = "DeviceDB"
//Possible device BugRacket, SmartSwitch
const bugracketCollection = "bug-racket"

router.post('/device/new-device', async (req, res) => {
    try {
        const name = req.body.name;
        const macAddress = req.body.macAddress;
        const deviceType = req.body.deviceType;

        if(!macAddress || !deviceType) {
            console.log("Missing device information")
            res.status(400).send("Missing device information");
        }

        const user = await mongoClient.db(UserDB).collection(UserCollection).findOne({ name });
        
        if(user) {

            console.log("found user, adding device");

            //user exists in our database
            //Add new device into database
            //Ex: macAddress=12345, deviceType=bug-racket, name=FARDREAM
            let status = await handleMacAddress(macAddress, deviceType, name);

            console.log(status);

            if(status == 1) {
                console.log("New MAC address added");
                res.status(200).send({ message: "New MAC address added"});
            } else if (status == 2) {
                console.log("Device already exists");
                res.status(200).send({ message: "Device already exists"});
            } else {
                console.log("Unable to handle mac address");
                res.status(500).send({ message: "Unable to handle mac address"});
            }
            
        } else {
            //user does not exist
            console.log("User does not exist");
            res.status(400).send({ message: "User does not exist"});
        }

    } catch (error){
        console.log("Unknown error uploading device");
        res.status(500).send({ message: "Unknown error uploading device"});
    }
});

async function handleMacAddress(macAddress, deviceType, name) {
    try {
        // Check if the MAC address already exists in the database

        console.log("attempting to handle mac address");

        const existingEntry = await mongoClient.db(DeviceDB).collection(deviceType).findOne({ macAddress });

        if (existingEntry) {
            // MAC address exists, return it
            console.log("MAC address exists, returning existing entry.");
            return 2;
        } else {
            // MAC address doesn't exist, insert new entry
            const entry = {
                owner: name,
                macAddress,
                deviceType,
                deviceName: deviceType
            };

            console.log(entry);

            // Insert the new entry into the database
            await mongoClient.db(DeviceDB).collection(deviceType).insertOne(entry);

            console.log("MAC address is handled");
            return 1;
        }
    } catch (error) {
        console.error("Error occurred:", error);
        return -1;
    }
}

//Give back Bug-Racket kill count
router.post('/device/bugracket/count', async (req, res) => {
    try {
        let match = req.body;

        const macAddress = match.replace(/\s+|\n+/g, '');
        console.log('macAddress: ', macAddress);

        const existingmacAddress = await mongoClient.db(DeviceDB).collection(bugracketCollection).findOne({ macAddress});

        if(existingmacAddress){

            let count =  existingmacAddress.kills.length;
            console.log("Kill Count:", count);
            return res.status(200).send(`Successfully retrieved kill count: ${count}`);

        } else{
            console.log("Error finding device");
            return res.status(404).send("Error finding device");
        }

    } catch (error) {
        console.log("Error getting count");
        return res.status(500).send("Error getting count");
    }
});

//Give back Bug-Racket all timestamps
router.post('/device/bugracket/time', async (req, res) => {
    try {
        let match = req.body;

        const macAddress = match.replace(/\s+|\n+/g, '');
        console.log('macAddress: ', macAddress);

        const existingmacAddress = await mongoClient.db(DeviceDB).collection(bugracketCollection).findOne({ macAddress});

        if(existingmacAddress){

            if(Array.isArray(existingDevice.kills)){
                const timestamps = existingDevice.kills.filter(kill => kill !== null);
                return res.status(200).json(timestamps);
            } else {
                return res.status(404).send("No kill timestamps found for this device.");
            }

         
        } else{
            console.log("Error finding device");
            return res.status(404).send("Error finding device");
        }

    } catch (error) {
        console.log("Error getting time");
        return res.status(500).send("Error getting getting time");
    }
});


//Renaming Bug-Racket
router.put('/device/bugracket/update-name', async (req, res) => {
    try {
        let bugracket = req.body;

        if(!bugracket || !bugracket.macAddress) {
            console.log("Invalid input, missing bugracket macAddress or the whole object");
            res.status(400).send({ message: "Invalid input, missing bugracket macAddress or the whole object"});
        }

        let macAddress = bugracket.macAddress;
        let newName = bugracket.name;

        const device = await mongoClient.db(DeviceDB).collection(bugracketCollection).findOne({ macAddress });

        console.log(device);
        console.log(device.deviceType != bugracketCollection);
        console.log(device.deviceType);
        console.log(bugracketCollection);

        if(!device || device.deviceType != bugracketCollection) {
            console.log("Invalid input, bug racket does not exist or not a bug racket");
            res.status(400).send({ message: "Invalid input, bug racket does not exist or not a bug racket"});
        }

        const updateResult = await mongoClient.db(DeviceDB).collection(bugracketCollection).updateOne(
            { macAddress },
            { $set: { deviceName: newName } }
        );
    
        if (updateResult.modifiedCount === 0) {
            res.status(200).send({ message: "Nothing updated" });
        }
    
        res.status(200).send({ message: "Bug racket updated successfully" });

    } catch (error) {
        console.log("Internal Server Error");
        res.status(500).send("Internal Server Error");
    }
})

//Adding new-kill from the bug-racket
router.post('/device/bugracket/new-kill', async (req, res) => {
    try {
        let match;

        console.log("received new kill request");

        if (req.is('text/plain')) {
            match = req.body;
        } else {
            return res.status(400).send("Unsupported content type");
        }

        console.log(match);
    
        //const macAddress = match.replace(/\s+|\n+/g, '');

        // Assuming the format is "MAC_ADDRESS,TIMESTAMP"
        const parts = match.split(',');
        if(parts.length < 2) {
            return res.status(400).send("Invalid request format. Expected format: MAC_ADDRESS,TIMESTAMP[,TIMESTAMP...]");
        }

        const macAddress = parts[0].trim();
        const timestamps = parts.slice(1).map(timestamp => timestamp.trim());

        // // Validate timestamps
        // const areValidTimestamps = timestamps.every(timestamp => !isNaN(new Date(timestamp).getTime()));
        // if (!areValidTimestamps) {
        //     return res.status(400).send("One or more timestamps are invalid");
        // }

        console.log(macAddress);
       
        const device = await mongoClient.db(DeviceDB).collection(bugracketCollection).findOne({ macAddress });

        console.log(device);
        console.log(device.deviceType != bugracketCollection);
        console.log(device.deviceType);
        console.log(bugracketCollection);

        if(!device || device.deviceType != bugracketCollection) {
            console.log("Invalid input, bug racket does not exist or not a bug racket");
            res.status(400).send({ message: "Invalid input, bug racket does not exist or not a bug racket"});
        }
    
        const updateResult = await mongoClient.db(DeviceDB).collection(bugracketCollection).updateOne(
            { macAddress },
            { $push: { kills: { $each: timestamps } } }
            // { $push: { kills: (new Date()).toString()} }
        );
    
        if (updateResult.modifiedCount === 0) {
            return res.status(200).send({ message: "Nothing updated" });
        }
    
        return res.status(200).send({ message: "Bug racket updated successfully" });
        
    } catch (error) {
        console.log("Internal Server Error");
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
})

//Testing Mac 
router.post('/arduino/mac', async (req, res) => {
    try {
        let message;

        if (req.is('application/json')) {
            message = req.body;
        } else if (req.is('text/plain')) {
            message = req.body;
        } else {
            return res.status(400).send("Unsupported content type");
        }

        console.log(message);

        await mongoClient.db("BugRacket").collection("arduinoTest").insertOne({ message: message });

        if (typeof message === 'object') {
            res.status(200).send("Received JSON Message: " + JSON.stringify(message));
        } else {
            res.status(200).send("Received Text Message: " + message);
        }

    } catch (error) {
        console.log("Did not receive message");
        res.status(500).send("Did not receive message");
    }
});

module.exports = {
    router,
}