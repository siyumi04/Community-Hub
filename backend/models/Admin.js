import mongoose from 'mongoose';

// Define the schema for an Admin
const adminSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    itNumber: {
        type: String,
        required: true,
        unique: true,
        sparse: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        sparse: true
    },
    dashboardName: {
        type: String,
        required: true,
        unique: true,
        sparse: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
