const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
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

async function run() {
  try {
    const categoriesCollection = client
      .db("resaleDatabase")
      .collection("categories");

    const bookCollection = client.db("resaleDatabase").collection("books");

    app.get("/categories", async (req, res) => {
      const query = {};
      const options = await categoriesCollection.find(query).toArray();

      res.send(options);
    });

    // app.get("/categories/:id", async (req, res) => {
    //   const id = req.query.id;
    //   const category_books = books.filter((b) => b.category_id === id);
    //   const query = { category_books };
    //   const options = await categoriesCollection.find(query).toArray();

    //   res.send(options);
    // });

    app.get("/books", async (req, res) => {
      const query = {};
      const books = await bookCollection.find(query).toArray();
      res.send(books);
    });

    app.get("/books/:id", async (req, res) => {
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
