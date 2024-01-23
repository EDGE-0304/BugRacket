const express = require('express');
const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());

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

    
module.exports = {
    router,
}

router.post('/arduino/test', async (req, res) => {
    try {
        const message = req.body;

        console.log(message);

        await mongoClient.db("BugRacket").collection("arduinoTest").insertOne(message);

        res.status(200).send("Received Message: " + message);

    } catch (error) {
        console.log("Did not receive message");
        res.status(500).send("Did not receive message");
    }
});