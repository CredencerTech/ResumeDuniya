// models/Resume.js
const mongoose = require('mongoose');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/resduniya', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

const ResumeSchema = new mongoose.Schema({
    resumePath: { type: String, required: true },
    imagePath: { type: String, required: true },
    paymentScreenshotPath: { type: String, required: true },
    resumeType: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resume', ResumeSchema);
