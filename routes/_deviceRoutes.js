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

router.post('/device/new-device', async (req, res) => {
    try {
        const name = req.body.name;
        const macAddress = req.body.macAddress;
        const deviceType = req.body.deviceType;

        if(!macAddress || !deviceType) {
            console.log("Missing device information")
            res.status(400).send("Missing device information");
        }

        const device = {
            macAddress,
            deviceType,
        };

        const user = await mongoClient.db(UserDB).collection(UserCollection).findOne({ name });
        
        if(user) {
            //user exists in our database
            //Add new device into database
            //Ex: macAddress=12345, deviceType=bug-racket, name=FARDREAM
            let status = await handleMacAddress(macAddress, deviceType, name);

            if(status == 1) {
                console.log("New MAC address added");
                res.status(200).send({ message: "New MAC address added", data: device});
            } else if (status == 2) {
                console.log("Device already exists");
                res.status(200).send({ message: "Device already exists", data: device});
            } else {
                console.log("Unknown error uploading device");
                res.status(500).send({ message: "Unknown error uploading device"});
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
                deviceType
            };

            // Insert the new entry into the database
            await mongoClient.db(DeviceDB).collection(deviceType).insertOne(entry);

            console.log("New MAC address added");
            return 1;
        }
    } catch (error) {
        console.error("Error occurred:", error);
        return -1;
    }
}

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