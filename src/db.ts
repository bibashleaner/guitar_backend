import mongoose from 'mongoose';

export async function connectToDatabase(uri: string, dbName: string) {
  await mongoose.connect(uri, { dbName });
  console.log('MongoDB connected to', mongoose.connection.db?.databaseName);
  return mongoose.connection.db!;
}