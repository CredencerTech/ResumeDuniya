const mongoose = require('mongoose');

// Connect to MongoDB
const connect = mongoose.connect("mongodb://localhost:27017/resduniya", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Check database connection
connect.then(() => {
    console.log("Database Connected Successfully");
})
.catch((err) => {
    console.log("Database connection error:", err);
});

// Create Schema
const Loginschema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true // Ensure unique email addresses
    },
    password: {
        type: String,
        required: true
    },
    socialLogin: {
        facebookId: { type: String, default: null },
        instagramId: { type: String, default: null },
        googleId: { type: String, default: null },
        githubId: { type: String, default: null }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create Model
const User = mongoose.model("User", Loginschema);

module.exports = User;
