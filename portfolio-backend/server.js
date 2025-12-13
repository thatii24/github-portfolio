const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Allow your GitHub Pages site to connect
app.use(cors({
    origin: ['https://yourusername.github.io', 'http://localhost:3000'],
    credentials: true
}));

// Parse JSON
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err));

// Contact Schema
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);

// Routes
app.post('/api/contact/submit', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Simple validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Save to database
        const newContact = new Contact({ name, email, subject, message });
        await newContact.save();

        res.status(201).json({
            success: true,
            message: 'Thank you! Your message has been sent.',
            data: { name, email }
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// Health check
app.get('/', (req, res) => {
    res.send('✅ Portfolio Backend is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});