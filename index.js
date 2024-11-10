const express = require("express");
const { MongoClient } = require("mongodb");
const eventRoutes = require("./routes/event");
const nudgeRoutes = require("./routes/nudge");

const app = express();
const port = 3000;

const url = "mongodb://localhost:27017";
const dbName = "eventDB";

app.use(express.json());
app.use("/uploads", express.static("uploads"));

async function connectToDb() {
  const client = new MongoClient(url);
  await client.connect();
  return client.db(dbName);
}

app.use(async (req, res, next) => {
  try {
    const db = await connectToDb();
    req.db = db;
    next();
  } catch (error) {
    next(error);
  }
});

//Event APIs
app.use("/api/v3/app", eventRoutes);
//Nudge APIs
app.use("/api/v3/app", nudgeRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

module.exports = app;
