import { Server } from 'socket.io'
import express from 'express'
import cors from 'cors'
const app = express()
app.use(cors())
app.use(express.json())

const io = new Server({
    cors: {
      origin: "*", 
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    },
});

io.on('connection', (socket) => {
    console.log('Connected')
    socket.on('joinContest', () => {
        
    })
})