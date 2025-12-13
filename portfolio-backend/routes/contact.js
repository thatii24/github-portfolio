const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const validator = require('validator');
const nodemailer = require('nodemailer');

// POST - Submit contact form
router.post('/submit', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        if (message.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Message must be at least 10 characters long'
            });
        }

        // Save to database
        const newContact = new Contact({
            name,
            email,
            subject,
            message,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        await newContact.save();

        // Send notification email (optional)
        if (process.env.SEND_EMAILS === 'true') {
            await sendNotificationEmail(name, email, subject, message);
        }

        // Send confirmation email to user
        await sendConfirmationEmail(name, email);

        res.status(201).json({
            success: true,
            message: 'Thank you for your message! I will get back to you soon.',
            data: {
                id: newContact._id,
                name: newContact.name,
                email: newContact.email
            }
        });

    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing your message. Please try again later.'
        });
    }
});

// GET - Get all messages (for admin dashboard - add authentication in production)
router.get('/messages', async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query = {};

        if (status && ['new', 'read', 'replied', 'archived'].includes(status)) {
            query.status = status;
        }

        const messages = await Contact.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select('-__v');

        const total = await Contact.countDocuments(query);

        res.json({
            success: true,
            data: messages,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch messages'
        });
    }
});

// PATCH - Update message status
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['new', 'read', 'replied', 'archived'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const updateData = { status };
        if (status === 'replied') {
            updateData.repliedAt = new Date();
        }

        const message = await Contact.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).select('-__v');

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        res.json({
            success: true,
            message: 'Status updated successfully',
            data: message
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status'
        });
    }
});

// Email functions
async function sendNotificationEmail(name, email, subject, message) {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: process.env.NOTIFICATION_EMAIL || 'thatilawijayathunga@gmail.com',
            subject: `New Contact Form Submission: ${subject}`,
            html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p>This message was received from your portfolio website contact form.</p>
      `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending notification email:', error);
    }
}

async function sendConfirmationEmail(name, email) {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: email,
            subject: 'Thank you for contacting Thatila Wijayathunga',
            html: `
        <h2>Thank You for Your Message!</h2>
        <p>Dear ${name},</p>
        <p>Thank you for reaching out to me through my portfolio website. I have received your message and will get back to you as soon as possible.</p>
        <p>In the meantime, feel free to check out my portfolio for more examples of my work.</p>
        <br>
        <p>Best regards,</p>
        <p><strong>Thatila Wijayathunga</strong></p>
        <p>Full Stack Developer</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated confirmation message. Please do not reply to this email.
        </p>
      `
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending confirmation email:', error);
    }
}

module.exports = router;