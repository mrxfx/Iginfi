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
    return res.status(400).json({ error: 'Invalid Instagram URL' });
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const meta = {};

    $('meta').each((_, el) => {
      const property = $(el).attr('property') || $(el).attr('name');
      const content = $(el).attr('content');
      if (property && content && property.startsWith('og:')) {
        meta[property] = content;
      }
    });

    if (!meta['og:image'] && !meta['og:video']) {
      return res.status(404).json({ error: 'Media not found' });
    }

    return res.json({
      type: meta['og:type'],
      title: meta['og:title'],
      image: meta['og:image'],
      video: meta['og:video'],
      url: meta['og:url']
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch Instagram content' });
  }
});
