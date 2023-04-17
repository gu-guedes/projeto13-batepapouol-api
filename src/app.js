import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv"
import dayjs from "dayjs"
import joi from "joi"

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
setInterval(removerParticipantes, 15000)

app.post("/participants", async (req, res) => {
    const userSchema = joi.object({
        name: joi.string().required(),
    });
    const { name } = req.body

    try {
        // if (!isNaN(Number(name))) {
        //         return res.sendStatus(422)
        //      }

        // if(!name){
        //     return res.sendStatus(422)
        // }
        // const nomeExistente = await db.collection("participants").findOne({name})
        const validate = userSchema.validate(req.body);
        if (validate.error) return res.sendStatus(422);
        const nomeExistente = await db.collection('participants').findOne({ name });
        if (nomeExistente) {
            return res.sendStatus(409)
        }


        db.collection("participants").insertOne({ name, lastStatus: Date.now() })


        db.collection("messages").insertOne({ from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs().format('HH:mm:ss') })

        return res.sendStatus(201)

    } catch (error) {
        return res.status(500).send(error)

    }

})

app.get("/participants", (req, res) => {

    db.collection("participants").find().toArray()
        .then(participante => res.send(participante))
        .catch(err => res.status(500).send(err.message))
})

app.post("/messages", async (req, res) => {
    const user = req.headers.user


    const { to, text, type } = req.body

    if (!to || !text) {
        return res.sendStatus(422)
    }

    if (type !== "private_message" && type !== "message") {
        return res.sendStatus(422)

    }
    const participanteExistente = await db.collection("participants").findOne({ name: user })


    if (!participanteExistente) {
        return res.sendStatus(422)
    }
    if (!user) {
        return res.sendStatus(422)
    }

    db.collection("messages").insertOne({ from: user, to, text, type, time: dayjs().format('HH:mm:ss') })
    return res.sendStatus(201)



})
app.get("/messages", async (req, res) => {
    const user = req.headers.user

    const { limit } = req.query
    try{
        const mensagens = await db.collection("messages").find({ $or: [{ to: "Todos" }, { to: user }, { from: user }] }).toArray()
        if (limit) {
            if (isNaN(Number(limit)) || limit <= 0) {
              return res.sendStatus(422);
            }
            const mensagensFiltradas = mensagens.slice(-limit);
            return res.send(mensagensFiltradas);
          } else {
            return res.send(mensagens);
          }
    }catch(err){
        res.status(500).send(err.message)

    }
    // const mensagens = await db.collection("messages").find().toArray()

    // if (isNaN(Number(limit))) {
    //     return res.sendStatus(422)
    // }

    // if(limit === "0" || limit < "0"){
    //     return res.sendStatus(422)
    // }
    // if(limit){
    //     const mensagensFiltradas = mensagens.slice(-limit)
    //     return res.send(mensagensFiltradas)
    // }
    



})
app.post("/status", async (req, res) => {
    const user = req.headers.user
    console.log(user)

    if (!user) {
        return res.sendStatus(404)
    }
    const participanteExistente = await db.collection("participants").findOne({ name: user })


    if (!participanteExistente) {
        return res.sendStatus(404)
    }

    db.collection("participants").updateOne({ name: user }, { $set: { lastStatus: Date.now() } })

    res.sendStatus(200)


})

async function removerParticipantes() {

    const dezSegundosAtras = Date.now() - 10000
    const pessoas = await db.collection("participants").find({ lastStatus: { $lt: dezSegundosAtras } }).toArray()

    pessoas.forEach(pessoa => {
        db.collection("messages").insertOne({
            from: pessoa.name, to: 'Todos', text: 'sai da sala...', type: 'status', time: dayjs().format('HH:mm:ss')
        })
    })
    await db.collection("participants").deleteMany({ lastStatus: { $lt: dezSegundosAtras } })
}




const PORT = 5000
app.listen(PORT, () => console.log("rodando servidor na porta 5000"))