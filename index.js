const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const helmet = require('helmet');
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Sample route for Instagram Reel, Post, Story, Photo and Profile Downloader
app.get('/api/download', async (req, res) => {
    const { url } = req.query;
    if (!url || !url.includes('instagram.com')) {
        return res.status(400).json({ error: 'Invalid URL' });
    }
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const scriptTag = $('script[type="application/ld+json"]').html();
        if (scriptTag) {
            const jsonData = JSON.parse(scriptTag);
            return res.json({ media: jsonData });
        }
        res.status(404).json({ error: 'Media not found' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch media' });
    }
});

app.get('/', (req, res) => {
    res.send('Instagram Downloader API is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});