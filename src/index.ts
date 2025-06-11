import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI!;
const MONGO_DATABASE = process.env.MONGO_DATABASE!;
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;

const app = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: 'https://deploy-backend.vercal.app', methods: ['GET', 'POST'], credentials: true },
});

app.use(cors());
app.use(express.json());

interface Song {
  _id: mongoose.Types.ObjectId;
  name: string;
  songs: Song[];
  title: string;
  artist: string;
  [key: string]: any;
}

app.get('/api/artists', async (_req: Request, res: Response): Promise<void> => {
    const db = mongoose.connection.db!;

    // Check if database connection is available
    if (!db) {
      console.error('Database connection not available');
      res.status(500).json({ error: 'Database connection not available' });
      return;
    }

    try {
      const artistsDoc = await db
        .collection('chordie_artists')
        .findOne({ _id: 'all_artists' } as any);  // see next section

      if (!artistsDoc?.artists) {
        res.status(404).json({ error: 'Artists not found' });
        return;
      }

      res.status(200).json(artistsDoc.artists);
    } catch (err) {
      console.error('Error fetching artists:', err);
      res.status(500).json({ error: 'Fetch failed' });
    }
  }
);

async function startServer() {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: MONGO_DATABASE,   // no useNewUrlParser / useUnifiedTopology here
    });
    console.log('MongoDB connected to', mongoose.connection.db!.databaseName);

    // setup change stream
    if (!mongoose.connection.db) {
    throw new Error('MongoDB connection not established');
    }

    const changeStream = mongoose.connection.db
        .collection('chordie_artists')
        .watch([], { fullDocument: 'updateLookup' });

    // Listen for any change in `songs`
    changeStream.on('change', (change) => {
        console.log('Songs collection changed:', change.operationType);
        io.emit('artistsChanged', change);
    });

    httpServer.listen(PORT, () => {
      console.log(`Server listening at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}

startServer();




// import { connectToDatabase } from './db';
// import artistRoutes from './routes/artistRoutes';
// import { setupSocketIO } from './socket';
// import dotenv from 'dotenv';
// import express from 'express';
// import http from 'http';
// import { Server as SocketIOServer} from 'socket.io';
// import cors from 'cors';

// dotenv.config();

// const app = express();
// const httpServer = http.createServer(app);
// const io = new SocketIOServer(httpServer, {
//   cors: { origin: '*', methods: ['GET', 'POST'] },
// });

// app.use(cors());
// app.use(express.json());
// app.use('/api', artistRoutes);

// async function startServer() {
//   const MONGO_URI = process.env.MONGO_URI!;
//   const MONGO_DATABASE = process.env.MONGO_DATABASE!;
//   const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

//   try {
//     const db = await connectToDatabase(MONGO_URI, MONGO_DATABASE);
//     setupSocketIO(io, db);

//     httpServer.listen(PORT, () => {
//       console.log(`Server listening at http://localhost:${PORT}`);
//     });
//   } catch (err) {
//     console.error('Startup failed:', err);
//     process.exit(1);
//   }
// }

// startServer();