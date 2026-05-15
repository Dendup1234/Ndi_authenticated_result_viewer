import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri =
  process.env.MONGO_URI ??
  process.env.MONGODB_URI ??
  'mongodb://127.0.0.1:27017/ndi_authentication';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
