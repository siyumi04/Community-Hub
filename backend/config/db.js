import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const dbName = process.env.MONGO_DB_NAME || 'community_hub';
        await mongoose.connect(process.env.MONGO_URI, { dbName });
        console.log("Database Connected Successfully! ✅"); 
    } catch (error) {
        console.error(`Error: ${error.message} ❌`);
        process.exit(1);
    }
};

export default connectDB;
