import mongoose from 'mongoose';

// Define the schema for a Student
const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    itNumber: {
        type: String,
        required: true,
        unique: true // SLIIT IT Number should be unique
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    skills: {
        type: [String], // Array of strings (e.g., ['React', 'NodeJS'])
        default: []
    },
    profilePicture: {
        type: String, // URL of the profile image
        default: ""
    },
    favoriteCommunity: {
        type: String,
        default: ""
    },
    bio: {
        type: String,
        default: ""
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create the model from the schema
const Student = mongoose.model('Student', studentSchema);

export default Student;