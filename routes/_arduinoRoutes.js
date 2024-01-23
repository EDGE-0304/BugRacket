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

    
module.exports = {
    router,
}

router.post('/arduino/test', async (req, res) => {
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

router.get("/arduino/test", async (req, res) => {
    try{
        const allMessages = await mongoClient.db("BugRacket").collection("arduinoTest").find({}).toArray();
        res.send(allMessages);
        console.log("All messages provided");
    }catch(err){
        res.status(500).send("Internal Server Error");
        console.error("Internal Server Error");    
    }
});