const express = require('express');
const bodyParser = require("body-parser");
const cors = require("cors");
require('dotenv').config()
 

const port = 5000;


const app = express();
app.use(cors());
app.use(bodyParser.json());

//From firebase Generate Key
const admin = require("firebase-admin");
var serviceAccount = require("./configs/burj-al-arab-a5909-firebase-adminsdk-fqwi0-c10248730c.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
//End
 
app.get('/', (req, res) => {
  res.send('Hello World!')
})

const { MongoClient } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lygbk.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db("burjAlArab").collection("booking");

  app.post("/addBooking", (req, res) => {
    const newBooking = res.body;
    bookings.insertOne(newBooking)
      .then(result => {
        res.send(result.insertedCount > 0)
      })   
  })

  app.get("/Bookings", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {

      const idToken = bearer.split(" ")[1];      
      // idToken comes from the client app
      admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail== queryEmail) {
          bookings.find({email: queryEmail})
          .toArray((err, documents)  =>{
            res.status(200).send(documents)
          })
         }
         else{
          res.status(401).send("Unauthorized Access")
         }
        })
        .catch((error) => {
          res.status(401).send("Unauthorized Access")
        });
    }     
      else{
        res.status(401).send("Unauthorized Access")
       

     }
  })

});
app.listen(port)