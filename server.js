var express = require("express");
var app = express();
app.use(express.json()); 

// Define a port to listen to
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

let db;


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

app.post('/sign-up', async (req, res) => {
  try {
    const user = req.body;
    const result = await mongoClient.db("BugRacket").collection('users').insertOne(user);
    res.status(201).send({ message: 'Account created successfully', userId: result.insertedId });
  } catch (error) {
    res.status(500).send({ message: 'Error creating the account', error: error.message });
  }
});

app.post('/login', async (req, res) => {
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