import mongoose from 'mongoose';

let isConnected = false;
let connectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 5;

export const connectDB = async () => {
  if (isConnected) {
    console.log('MongoDB is already connected');
    return;
  }

  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection attempts:', connectionAttempts + 1);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority',
      // Enhanced connection options
      bufferCommands: false,
      bufferMaxEntries: 0,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    isConnected = true;
    connectionAttempts = 0;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log('Database connection established successfully');
    
    // Set up connection event listeners
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnected = true;
    });
    
  } catch (error) {
    connectionAttempts++;
    console.error('Error connecting to MongoDB:', error);
    
    if (connectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
      console.log(`Retrying connection in 5 seconds... (attempt ${connectionAttempts}/${MAX_RECONNECTION_ATTEMPTS})`);
      setTimeout(() => connectDB(), 5000);
    } else {
      console.error('Max reconnection attempts reached. Continuing without database connection...');
      console.log('The application will continue to run, but sessions may not persist properly.');
    }
  }
};

export const disconnectDB = async () => {
  if (!isConnected) {
    console.log('MongoDB is not connected');
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};

export const getConnectionStatus = () => {
  return {
    isConnected,
    connectionAttempts,
    readyState: mongoose.connection.readyState
  };
};
