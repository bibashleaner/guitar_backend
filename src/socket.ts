import { Server as SocketIOServer } from 'socket.io';
import { Db } from 'mongodb';

export function setupSocketIO(io: SocketIOServer, db: Db) {
  const changeStream = db.collection('artists').watch([], {
    fullDocument: 'updateLookup',
  });

  changeStream.on('change', (change) => {
    console.log('Artists collection changed:', change.operationType);
    io.emit('artistsChanged', change);
  });
}