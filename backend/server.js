
// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const uri=require('dotenv').config();
// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
const MONGODB_URI =process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI,{dbName:'instagram_clone'}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Schema for user sessions
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema, 'namesdata');

// Dynamic schema for posts/stories
const contentSchema = new mongoose.Schema({
    imageId: { type: String, required: true },
    image: { type: String, required: true },
    type: { type: String, enum: ['post', 'story'], required: true },
    timestamp: { type: Number, required: true },
    sessionId: { type: String, required: true }
}, { strict: false });

// Helper function to get or create user collection model
function getUserModel(username) {
    const collectionName = username.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    if (mongoose.models[collectionName]) {
        return mongoose.models[collectionName];
    }
    
    return mongoose.model(collectionName, contentSchema, collectionName);
}

// Helper function to delete old content (24 hours)
async function deleteOldContent() {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    try {
        const users = await User.find();
        
        for (const user of users) {
            const UserModel = getUserModel(user.username);
            await UserModel.deleteMany({ timestamp: { $lt: twentyFourHoursAgo } });
        }
    } catch (error) {
        console.error('Error deleting old content:', error);
    }
}

// Run cleanup every hour
setInterval(deleteOldContent, 60 * 60 * 1000);

// API Routes

// Register username
app.post('/api/register', async (req, res) => {
    try {
        const { username, sessionId } = req.body;

        if (!username || !sessionId) {
            return res.json({ success: false, message: 'Username and session ID required' });
        }

        // Check if username already exists
        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.json({ success: false, message: 'Username already taken' });
        }

        // Create new user
        const newUser = new User({
            username: username.toLowerCase(),
            sessionId
        });

        await newUser.save();

        // Create collection for user (will be created on first insert)
        getUserModel(username);

        res.json({ success: true, message: 'Username registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.json({ success: false, message: 'Registration failed' });
    }
});
// Upload post or story
app.post('/api/upload', async (req, res) => {
    try {
        const { sessionId, imageId, image, type, timestamp } = req.body;

        if (!sessionId || !imageId || !image || !type || !timestamp) {
            return res.json({ success: false, message: 'Missing required fields' });
        }

        // Find user by session ID
        const user = await User.findOne({ sessionId });
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        // Get user's collection model
        const UserModel = getUserModel(user.username);

        // Create new content
        const newContent = new UserModel({
            imageId,
            image,
            type,
            timestamp,
            sessionId,
            username: user.username
        });

        await newContent.save();

        res.json({ success: true, message: 'Content uploaded successfully' });
    } catch (error) {
        console.error('Upload error:', error);
        res.json({ success: false, message: 'Upload failed' });
    }
});

// Get all content (posts and stories)
app.get('/api/content', async (req, res) => {
    try {
        // Delete old content first
        await deleteOldContent();

        const users = await User.find();
        let allPosts = [];
        let allStories = [];

        for (const user of users) {
            try {
                const UserModel = getUserModel(user.username);
                const contents = await UserModel.find();

                contents.forEach(content => {
                    const contentObj = {
                        imageId: content.imageId,
                        image: content.image,
                        type: content.type,
                        timestamp: content.timestamp,
                        username: user.username
                    };

                    if (content.type === 'post') {
                        allPosts.push(contentObj);
                    } else if (content.type === 'story') {
                        allStories.push(contentObj);
                    }
                });
            } catch (error) {
                console.error(`Error fetching content for ${user.username}:`, error);
            }
        }

        // Sort by timestamp (newest first)
        allPosts.sort((a, b) => b.timestamp - a.timestamp);
        allStories.sort((a, b) => b.timestamp - a.timestamp);

        res.json({
            success: true,
            posts: allPosts,
            stories: allStories
        });
    } catch (error) {
        console.error('Error fetching content:', error);
        res.json({ success: false, message: 'Failed to fetch content' });
    }
});

// Get user's posts for deletion
app.get('/api/user-posts', async (req, res) => {
    try {
        const { sessionId } = req.query;

        if (!sessionId) {
            return res.json({ success: false, message: 'Session ID required' });
        }

        // Find user by session ID
        const user = await User.findOne({ sessionId });
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        // Get user's content
        const UserModel = getUserModel(user.username);
        const contents = await UserModel.find();

        const posts = contents.map(content => ({
            imageId: content.imageId,
            image: content.image,
            type: content.type,
            timestamp: content.timestamp
        }));

        res.json({ success: true, posts });
    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.json({ success: false, message: 'Failed to fetch posts' });
    }
});

// Delete post or story
app.post('/api/delete', async (req, res) => {
    try {
        const { sessionId, imageId } = req.body;

        if (!sessionId || !imageId) {
            return res.json({ success: false, message: 'Session ID and image ID required' });
        }

        // Find user by session ID
        const user = await User.findOne({ sessionId });
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        // Delete content from user's collection
        const UserModel = getUserModel(user.username);
        await UserModel.deleteOne({ imageId });

        res.json({ success: true, message: 'Content deleted successfully' });
    } catch (error) {
        console.error('Error deleting content:', error);
        res.json({ success: false, message: 'Failed to delete content' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`MongoDB URI: ${MONGODB_URI}`);
});


module.exports = app;
