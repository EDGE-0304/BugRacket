const express = require('express');
const router = express.Router();



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

router.post('/users/sign-up', async (req, res) => {
    try {
        //Requires email, password, name
        const isValidUser = await checkValidUser(req.body);
        if (!isValidUser) {
            res.status(400).send("Invalid user format or user already exists");
            return;
        }

        const user = req.body;
        if(!user.gender) user.gender = "Unknown";
        if(!user.birthday) user.birthday = "Unknown";

        await mongoClient.db("UserDB").collection("users").insertOne(user);

        res.status(201).send({ message: 'Account created successfully'});

    } catch (error) {
        console.log('Error creating user:', error);
        res.status(500).send({ message: 'Error creating the account', error: error.message });
    }
});

router.post('/users/login', async (req, res) => {
    try {
        const { name, password } = req.body;
      
        const user = await mongoClient.db("UserDB").collection('users').findOne({ name });
        if (user && user.password === password) {
            // Login successful
            res.status(200).send({ success: true, message: 'Login successful' });
        } else {
            // Login failed
            res.status(401).send({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        // Error during login process
        res.status(500).send({ success: false, message: 'Error during login', error: error.message });
    }
});

const checkValidUser = async (user) => {
    // Validate the required fields for the user
    if (!user.email || !user.password || !user.name) {
        return false;
    }
    // Check if the email already exists in the database
    try {
        const existingName = await mongoClient.db("UserDB").collection("users").findOne({ name: user.name });
        const existingEmail = await mongoClient.db("UserDB").collection("users").findOne({ email: user.email});
        if (existingName || existingEmail) {
            console.error('This user already exists.');
            return false;
        }
    } catch (err) {
        console.error('Error querying the database:', err);
        return false;
    }
    return true;
}

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

        const user = await mongoClient.db("UserDB").collection('users').findOne({ name });
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
        const existingEntry = await mongoClient.db("DeviceDB").collection(deviceType).findOne({ macAddress });

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
            await mongoClient.db("DeviceDB").collection(deviceType).insertOne(entry);

            console.log("New MAC address added");
            return 1;
        }
    } catch (error) {
        console.error("Error occurred:", error);
        return -1;
    }
}
    
module.exports = {
    router,
}