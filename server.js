var express = require("express");
var app = express();
app.use(express.json()); 
const cors = require('cors');

app.use(cors());

const userRoutes = require('./routes/_userRoutes').router;
app.use(userRoutes);
const arduinoRoutes = require('./routes/_deviceRoutes').router;
app.use(arduinoRoutes);

// Define a port to listen to
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

// Add a basic route for testing the server
app.get('/', function(req, res){
    res.send('Hello World (First Update)!');
});


// Start the server
app.listen(PORT, function(){
    console.log(`Server is running on port ${PORT}.`);
    console.log('Navigate to http://localhost:' + PORT + ' in your browser to check it locally.');
    console.log('If deployed, check your Google App Engine URL.');
});