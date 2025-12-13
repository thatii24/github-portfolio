const mongoose = require('mongoose');
const validator = require('validator');

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email address']
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
        minlength: [5, 'Subject must be at least 5 characters'],
        maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        minlength: [10, 'Message must be at least 10 characters'],
        maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    status: {
        type: String,
        enum: ['new', 'read', 'replied', 'archived'],
        default: 'new'
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    repliedAt: {
        type: Date
    }
});

// Create index for better query performance
contactSchema.index({ email: 1, createdAt: -1 });
contactSchema.index({ status: 1 });

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;