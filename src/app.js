import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv"
import dayjs from "dayjs"

const app = express()
app.use(cors())
app.use(express.json())
dotenv.config()
console.log(dayjs().format('HH:mm:ss'))


let db
const mongoClient = new MongoClient(process.env.DATABASE_URL)
mongoClient.connect()
.then(() => db = mongoClient.db())
.catch((err) => console.log(err.message))


app.post("/participants", async (req, res) => {
    const { name } = req.body
    try {
        //tem que conter um "name" no body 
        if(!name){
            return res.sendStatus(422)
        }
        const nomeExistente = await db.collection("participants").findOne({name})
        
        if(nomeExistente){
            return res.sendStatus(409)
        }
        
        db.collection("participants").insertOne({name, lastStatus: Date.now()})
        
        
        db.collection("messages").insertOne({ from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs().format('HH:mm:ss') })

        return res.sendStatus(201)
        
    } catch(error){
        return res.status(500).send(error)

    }
    
})

app.get("/participants", (req, res) => {

  db.collection("participants").find().toArray()
 .then(participante => res.send(participante))
.catch(err => res.status(500).send(err.message))
})

app.post("/messages", async (req, res) => {
     const user  =  req.headers.user
     
    
    const {to, text, type} =  req.body
    
        if(!to || !text){
            return res.sendStatus(422)
        }
        
        if(type !== "private_message" && type !== "message"){
            return res.sendStatus(422)

        }
         const participanteExistente = await db.collection("participants").findOne({name: user})
        
    
        if(!participanteExistente){
             return res.sendStatus(422)
         }   
         if(!user){
            return res.sendStatus(422)
         }   
       
        db.collection("messages").insertOne({from: user, to, text, type, time: dayjs().format('HH:mm:ss')})
        return res.sendStatus(201)
        
        
    
})
app.get("/messages", async (req, res) => {
    const user  =  req.headers.user
    
    const { limit } = req.query
    const mensagens = await db.collection("messages").find().toArray()
    
    if (isNaN(Number(limit))) {
        return res.sendStatus(422)
    }
   
    if(limit === "0" || limit < "0"){
        return res.sendStatus(422)
    }
    if(limit){
        const mensagensFiltradas = mensagens.slice(-limit)
        return res.send(mensagensFiltradas)
    }
    const mensagensTodos = await db.collection("messages").find({$or: [{to: "Todos"}, {to: user}, {from: user}]}).toArray()
    .then(mensagensTodos=> res.send(mensagensTodos))
    .catch(err => res.status(500).send(err.message))

    
    
})
app.post("/status", async (req, res) => {
    const user = req.headers.user
    console.log(user)

    if(!user){
        return res.sendStatus(404)
    }
    const participanteExistente = await db.collection("participants").findOne({name: user})
         

     if(!participanteExistente){
        return res.sendStatus(404)
    }

    db.collection("participants").updateOne({name: user}, {$set:{lastStatus: Date.now()}})

    res.sendStatus(200)


})


const PORT = 5000
app.listen(PORT, () => console.log("rodando servidor na porta 5000"))