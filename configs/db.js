import 'dotenv/config';
import mongoose from 'mongoose';

const connectDB = async () => {
    const mongoURL = process.env.MONGO_URI || 'mongodb://localhost:27017';
    try {
        await mongoose.connect(mongoURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

export default connectDB;
