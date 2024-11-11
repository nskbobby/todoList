import express from "express";
import { dirname } from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";
import { constrainedMemory } from "process";
dotenv.config();

const app = express(); //express server
const port = process.env.PORT || 3000; //dynamic port allocation by server
const dircname = dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

//connect to database using pg client
const db = new pg.Client({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
});

//connect to database
db.connect()
  .then(() => console.log("connected to database"))
  .catch((err) => console.error("Database connection error", err));

//Insert data into a particualr column in the db
async function insertintodb(table, column1, column2, value1, value2) {
  const queryText = `INSERT INTO ${table} (${column1}, ${column2}) VALUES ($1, $2)`;

  const values = [value1, value2];

  try {
    const result = await db.query(queryText, values);
    console.log("Insertion successful", result);
  } catch (error) {
    console.error("Error inserting into database:", error);
  }
}

//get a particular row from the table
async function getdata(table, key, value) {
  const queryText = `select * from ${table} where ${key}=$1`;
  try {
    const data = await db.query(queryText, [value]);
    return data.rows;
  } catch (error) {
    console.log("error retriving data", error);
    return error;
  }
}

// get all table data
async function gettabledata(table) {
  const queryText = `select * from ${table}`;
  try {
    const data = await db.query(queryText);
    return data.rows;
  } catch (error) {
    console.log("error retriving data", error);
    return error;
  }
}

//delete a particular row in the table
async function deleterow(table, id) {
  const queryText = `DELETE FROM ${table} WHERE ID=${id} `;
  try {
    await db.query(queryText);
    console.log("Data deleted");
  } catch (error) {
    console.log("error deleting data", error);
  }
}

//update a particular row in the table
async function updatedata(table, column, value, key, val) {
  const queryText = `update ${table} set ${column}=$1 where ${key}=$2;`;
  const values = [value, val];

  try {
    const status = await db.query(queryText, values);
    console.log("successfully updated values", status);
  } catch (error) {
    console.log("error while updating value in db", error);
  }
}

//get home route
app.get("/", async (req, res) => {
  const data = await gettabledata("todos");
  res.render(dircname + "/views/home.ejs", { todos: data });
});

// Add a new task
app.post("/add", async (req, res) => {
  var task = req.body.task;
  await insertintodb("todos", "task", "completed", task, false);

  const data = await gettabledata("todos");
  res.render(dircname + "/views/home.ejs", { todos: data });
});

// Toggle task completion
app.post("/toggle/:index", async (req, res) => {
  const index = parseInt(req.params.index);

  const toggleddata = await getdata("todos", "id", index);
  const taskstatus = toggleddata[0].completed;

  let togglestatus = !taskstatus;
  await updatedata("todos", "completed", togglestatus, "id", index);

  const data = await gettabledata("todos");
  res.render(dircname + "/views/home.ejs", { todos: data });
});

// Delete a task
app.post("/delete/:index", async (req, res) => {
  const index = parseInt(req.params.index);
  await deleterow("todos", index);

  const data = await gettabledata("todos");
  res.render(dircname + "/views/home.ejs", { todos: data });
});

//server port listener
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
