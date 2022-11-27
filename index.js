const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require('jsonwebtoken')
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m9nbseb.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});


function verifyJWT(req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.send(401).send('Unauthorized access');
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN ,function(err,decoded){
    if(err){
      return res.status(403).send({message: 'Forbidden access'})
    }
    req.decoded= decoded;
    next();
  })
}


async function run() {
  try {
    const categoriesCollection = client
      .db("resaleDatabase")
      .collection("categories");

    const bookCollection = client.db("resaleDatabase").collection("books");
    const orderedBookCollection = client.db("resaleDatabase").collection("orderedBooks");
    const usersCollection = client.db("resaleDatabase").collection("users");

    app.get("/categories", async (req, res) => {
      const query = {};
      const options = await categoriesCollection.find(query).toArray();

      res.send(options);
    });

    
    // send ordered books on the server
    app.post("/orderedBooks", async (req, res) => {
      const booked = req.body;     
      const result = await orderedBookCollection.insertOne(booked);
      res.send(result);
    });

    // load email wise orders
    app.get('/orderedBooks', async (req,res) =>{
      const email = req.query.email;
      const query ={email :email};
      const ordered= await orderedBookCollection.find(query).toArray();
      res.send(ordered)
    })


// all users

    app.post('/users', async(req,res) =>{
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result)
    })
    

    // api for token generate
    app.get('/jwt', async(req, res) =>{
      const email = req.query.email;
      const query ={email: email};
      const user = await usersCollection.findOne(query);
      if(user){
        const token =jwt.sign({email},process.env.ACCESS_TOKEN,{expiresIn : '1h'})
        return res.send({accessToken: token})
      }
      res.status(403).send({accessToken: ''})  
    })


    // app.get("/categories/:id", async (req, res) => {
    //   const id = req.query.id;
    //   const category_books = books.filter((b) => b.category_id === id);
    //   const query = { category_books };
    //   const options = await categoriesCollection.find(query).toArray();

    //   res.send(options);
    // });


    // app.get("/books", async (req, res) => {
    //   const query = {};
    //   const books = await bookCollection.find(query).toArray();
    //   res.send(books);
    // });


    // category-wise book
    app.get("/books", async (req, res) => {
      const id = req.query.id;
      const query = { category_name: id };
      const books = await bookCollection.find(query).toArray();
      res.send(books);
    });

    
  } finally {
  }
}
run().catch(console.log);

app.get("/", (req, res) => {
  res.send("Resale server Running");
});

app.listen(port, () => {
  console.log(`Simple server running on port ${port}`);
});
