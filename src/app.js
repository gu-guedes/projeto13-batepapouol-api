import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv"

const app = express()
app.use(cors())
app.use(express.json())
dotenv.config()

let db
const mongoClient = new MongoClient(process.env.DATABASE_URL)
mongoClient.connect()
.then(() => db = mongoClient.db())
.catch((err) => console.log(err.message))


//app.get("/participants", (req, res) => {
//   db.collection("participante").find().toArray()
//  .then(participante => res.send(participante))
//.catch(err => res.status(500).send(err.message))
//})


const PORT = 5000
app.listen(PORT, () => console.log("rodando servidor na porta 5000"))