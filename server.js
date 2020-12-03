import dotenv from 'dotenv';
import express from 'express'
import mongoose from 'mongoose'
import Message from './dbMessages.js'
import Pusher from 'pusher'
import cors from 'cors'
const app= express();
const port = process.env.PORT || 5000;
dotenv.config();
const pusher = new Pusher({
    appId: "1117481",
    key: "9dee0a36c822e6f109b8",
    secret: "901d211c4a4a79c6ef96",
    cluster: "eu",
    useTLS: true
  });

app.use(express.json())
app.use(cors())
// app.use((req,res,next)=>{
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Headers', '*');
//   next();
// })


const connection_url=`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.n9ozl.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
mongoose.connect(connection_url, {
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology:true,
})


 
  const db= mongoose.connection;
  db.once("open", ()=>{
      console.log("db connected");
      const msgCollection = db.collection
      ("messagecontents")
      const changeStream = msgCollection.watch();

      changeStream.on("change", (change)=>{
          console.log(change);
          if(change.operationType === 'insert'){
              const messageDetails=change.fullDocument;
              pusher.trigger('messages', 'inserted',{
                  name:messageDetails.name,
                  message:messageDetails.message,
                  timestamp:messageDetails.timestamp,
                  received:messageDetails.received,
                
              })
          }else{
              console.log("Error triggering Pusher");
          }
      })
  })

app.get('/', (req,res)=> res.status(200).send('Hello World'))

app.post('/messages/new', (req,res)=>{
    const dbMessages=req.body;
    Message.create(dbMessages, (err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(201).send(data)
            console.log(data);
        }
    })
})

app.get('/messages/sync', (req,res)=>{
    Message.find((err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(200).send(data)
        }
    })
})

app.delete('/delete', (req,res)=>{
    Message.deleteMany({})
    .then(data=>{
        res.status(200).send(data)
    })
})

app.listen(port, ()=> console.log(`Listening on localhost: ${port}`))