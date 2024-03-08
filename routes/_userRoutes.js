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

const UserDB = "UserDB"
const UserCollection = "users"

router.post('/users/sign-up', async (req, res) => {
    try {
        //Requires email, password, name
        const isValidUser = await checkValidUser(req.body);
        if (!isValidUser) {
            res.status(400).send({ message: 'User already exist', error: error.message });
            return;
        }

        const user = req.body;
        if(!user.gender) user.gender = "Unknown";
        if(!user.birthday) user.birthday = "Unknown";

        await mongoClient.db(UserDB).collection(UserCollection).insertOne(user);

        res.status(201).send({ message: 'Account created successfully'});

    } catch (error) {
        console.log('Error creating user:', error);
        res.status(500).send({ message: 'Error creating the account', error: error.message });
    }
});

router.post('/users/login', async (req, res) => {
    try {
        const { name, password } = req.body;
      
        const user = await mongoClient.db(UserDB).collection(UserCollection).findOne({ name });
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
        const existingName = await mongoClient.db(UserDB).collection(UserCollection).findOne({ name: user.name });
        const existingEmail = await mongoClient.db(UserDB).collection(UserCollection).findOne({ email: user.email});
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
    
module.exports = {
    router,
}