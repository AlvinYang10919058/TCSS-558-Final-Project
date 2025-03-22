require('dotenv').config();
const express = require('express');
const connectDB = require('./configs/db');
const redisClient = require('./configs/redis');
const User = require('./models/User');

const app = express();
app.use(express.json());

connectDB(); // Connect to MongoDB

app.post('/users', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/users', async (req, res) => {
    try {
        const cachedData = await redisClient.get('users');

        if (cachedData) {
            console.log('Cache hit');
            return res.json(JSON.parse(cachedData));
        }

        console.log('Cache miss');
        const [rows] = await User.find();

        await redisClient.setEx('users', 3600, JSON.stringify(rows)); // Cache for 1 hour

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
