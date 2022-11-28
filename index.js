const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    return res.status(401).send('Unauthorized access');
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
    


    const verifyAdmin = async(req, res,next) =>{
      const decodedEmail= req.decoded.email;
      const query = {email:decodedEmail};
      const user = await usersCollection.findOne(query);
      if(user?.role !== 'Admin'){
        return res.status(403).send({message: 'forbidden access'})
      }
      next();
    }


    const verifySeller = async(req, res,next) =>{
      const decodedEmail= req.decoded.email;
      const query = {email:decodedEmail};
      const user = await usersCollection.findOne(query);
      if(user?.status !== 'Seller'){
        return res.status(403).send({message: 'forbidden access'})
      }
      next();
    }

    

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
    app.get('/orderedBooks',verifyJWT, async (req,res) =>{
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if(email != decodedEmail){
        return res.status(403)
.send({message:"Access forbidden"})      
}

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
    

    app.get("/users", async (req, res) => {
      const query = {};
      const allusers = await usersCollection.find(query).toArray(); 
      res.send(allusers)
    })



    app.put('/users/admin/:id',verifyJWT,verifyAdmin, async (req,res) =>{     
      const id =req.params.id;
      const filter = { _id: ObjectId(id)};
      const options={upsert: true};
      const updatedDoc ={
        $set: {
          role: 'Admin'
        }
      }
      const result =await usersCollection.updateOne(filter,updatedDoc,options)
      res.send(result);
    })


   
    // checking if user is admin or not
    app.get('/users/admin/:email', async (req,res) =>{
      const email = req.params.email;
      const query ={ email }
      const user= await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === 'Admin'})
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


    app.get("/books", async (req, res) => {
      const id = req.query.id;
      const query = { category_name: id };
      const books = await bookCollection.find(query).toArray();
      res.send(books);
    });


    app.get('/categoryNames' ,async (req, res) => {
      const query = {};
      const result = await categoriesCollection.find(query).project({name: 1}).toArray();

      res.send(result);
    })

    // category wise book loading
    app.get('/category2/:id',async(req,res)=>{
      console.log(req.params.id)
      res.send(await categoriesCollection.findOne({name: req.params.id}))
    })

    app.get("/category/:name", async (req, res) => {
      const id = req.params.name;
      const category_books =await bookCollection.find({}).toArray();
      res.send(category_books);
    });


    // api for addedBooks
    app.post('/books', async(req,res) =>{
      const book =req.body;
      const result = await bookCollection.insertOne(book);
      res.send(result);
    })

    
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
