const express = require('express');
const router = express.Router();

const PORT = process.env.PORT || 8080;
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://EDGEBugRacket:4kqSP0Md2OlEps9k@bugracket.kc2nsam.mongodb.net/?retryWrites=true&w=majority";
const mongoClient = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const path = require('path');

router.post('/users/sign-up', /*upload.single('image'),*/ async (req, res) => {
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

        // var avatar = {
        //     contentType: "",
        //     image: ""
        // }
        // req.body.userAvatar = avatar;
        // if (req.file) {
        //     const fullPath = path.join(__dirname, 'uploads', path.basename(req.file.path));
        //     const img = fs.readFileSync(fullPath);
        //     const encode_image = img.toString('base64');
        
        //     req.body.userAvatar = {
        //         contentType: req.file.mimetype,
        //         image: Buffer.from(encode_image, 'base64')
        //     };
        // }

        await mongoClient.db("BugRacket").collection("users").insertOne(user);

        const rackets = {
            userName: user.name,
            rackets: [],
            score: 0,
        }
        await mongoClient.db("BugRacket").collection("bugRackets").insertOne(rackets);

        res.status(201).send({ message: 'Account created successfully'});

    } catch (error) {
        console.log('Error creating user:', error);
        res.status(500).send({ message: 'Error creating the account', error: error.message });
    }
});

router.post('/users/login', async (req, res) => {
    try {
        const { name, password } = req.body;
      
        const user = await mongoClient.db("BugRacket").collection('users').findOne({ name });
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

//Cannot use this avatar upload method
// router.put("/users/update-avatar", upload.single('image'), async (req, res) => {
//     //Update user avatar if the user exists and the image file is provided
//     try {
//         const userName = req.body.name;

//         if (!userName) {  // Ensure the userId is provided for updates
//             res.status(400).send("User name must be provided.");
//             return;
//         }

//         if (!(await userExists(userName))) {
//             res.status(400).send("User does not exist.");
//             return;
//         }

//         if (!req.file) {
//             console.log("User avatar was not provided.");
//             res.status(400).send("User avatar was not provided.");
//             return;
//         } 
        
//         const fullPath = path.join(__dirname, 'uploads', path.basename(req.file.path));
//         const img = fs.readFileSync(fullPath);
//         const encode_image = img.toString('base64');
//         var finalAvatar = {
//             contentType: req.file.mimetype,
//             image: Buffer.from(encode_image, 'base64')
//         };


//         const updateFields = {};
//         updateFields.userAvatar = finalAvatar;

//         console.log("User Avatar received");

//         const result = await mongoClient.db("BugRacket").collection("users").updateOne(
//             { userName }, 
//             { $set: updateFields }
//         );

//         if (result.modifiedCount === 0) {  // If no changes were made
//             res.status(200).send("No changes made to user avatar.");
//             return;
//         }

//         res.status(200).send("User avatar updated successfully.");
//         console.log("User avatar updated successfully.");

//     } catch (err) {
//         console.log('Internal server error');
//         res.status(500).send("Internal server error");
//     }
// });

const checkValidUser = async (user) => {
    // Validate the required fields for the user
    if (!user.email || !user.password || !user.name) {
        return false;
    }
    // Check if the email already exists in the database
    try {
        const existingName = await mongoClient.db("BugRacket").collection("users").findOne({ name: user.name });
        const existingEmail = await mongoClient.db("BugRacket").collection("users").findOne({ email: user.email});
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

async function userExists(userName) {
    console.log("Checking if user exists:", userName);
    const user = await mongoClient.db(MappostDB).collection("users").findOne({ userName });
    const exists = user !== null;
    console.log(`User ${userName} exists: ${exists}`);
    return exists;
}
    
module.exports = {
    router,
}