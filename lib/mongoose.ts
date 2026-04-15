import mongoose from 'mongoose';

const MONGO_URL = process.env.MONGO_URL;

if(!MONGO_URL){
    throw new Error('MONGO_URL is not defined');
}
export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(MONGO_URL as string, {
    dbName: "chat-app",
  });
}