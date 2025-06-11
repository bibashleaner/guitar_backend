
import { Server } from 'socket.io';
import express from 'express';
import { createServer, METHODS } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import cors from 'cors';
import mongoose, { mongo } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpserver = createServer(app);
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DATABASE = process.env.MONGO_DATABASE;
const PORT = process.env.PORT || 3000;

console.log("MONGO_URL:", MONGO_URI);
console.log("MONGO_DATABASE:", MONGO_DATABASE);

app.use(cors());
app.use(express.json());

const connectionString = `${MONGO_URI}/${MONGO_DATABASE}`;
if(connectionString){
    console.log("Connecting to:", connectionString);
}else{
    console.log('Error');
}


// connect to mongodb
mongoose.connect(connectionString)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

const io = new Server(httpserver, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    }
});

// const __dirname = dirname(fileURLToPath(import.meta.url));
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// app.use(express.static(join(__dirname, '..', 'client')));

// app.get('/', async(req, res) =>{
//     res.sendFile(join(__dirname, '..', 'client' ,'index.html'));
// });

app.get('/api/songs', async (req, res) => {  // methods(EndPoint, token, callback function) 
    const connection = mongoose.connection.db;

    if(connection === undefined) {
        console.log("connection is undefined");
        return;
    }
    
    try {
        const songs = await connection
            .collection('songs')
            .find()
            .toArray();
        console.log(songs);
        res.status(200).json(songs);  // sends JSON data back to client
    } catch (err) {
        console.error("Error fetching songs:", err);
        res.status(500).json({ error: 'Failed to fetch songs' });
    }
});

// when client connects to socket.io
io.on("connection", (socket) =>{
    console.log(`User connected: ${socket.id}`);

    socket.on("disconnect", () =>{
        console.log("user disconnected")
    })
});


mongoose.connection.once('open', () => {
    console.log('MongoDB connection opened');

    const db = mongoose.connection.db;
    if(db === undefined) return;

    const collection = db.collection('songs');

    const changeStream = collection.watch([], { fullDocument: 'updateLookup' });

    changeStream.on('change', next => {
        console.log("Change detected in 'songs' collection:", next);
        io.emit('songUpdated', next);
    });

    changeStream.on('error', err => {
        console.error("Error in change stream:", err);
    });
});

httpserver.listen(PORT, () =>{
    console.log(`server running at http://localhost: ${PORT}`);
});