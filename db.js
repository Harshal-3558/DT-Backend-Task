const { MongoClient } = require("mongodb");

const url = "mongodb://localhost:27017";
const dbName = "eventDB";

async function connectToDb() {
  const client = new MongoClient(url);
  await client.connect();
  return client.db(dbName);
}

module.exports = connectToDb;