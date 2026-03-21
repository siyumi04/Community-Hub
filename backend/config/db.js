import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // We still connect the same way
        await mongoose.connect(process.env.MONGO_URI);
        
        // Change this line to show a cleaner message
        console.log("Database Connected Successfully! ✅"); 
        
    } catch (error) {
        console.error(`Error: ${error.message} ❌`);
        process.exit(1);
    }
};

export default connectDB;