
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
];

const getRandomUserAgent = () => {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
};

const extractShortcode = (url) => {
  const regex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const extractUsername = (url) => {
  const regex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9_.-]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const url = \`https://www.instagram.com/\${username}/\`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent()
      }
    });

    const $ = cheerio.load(response.data);
    const scriptTags = $('script[type="text/javascript"]');

    let profileData = null;

    scriptTags.each((i, script) => {
      const content = $(script).html();
      if (content && content.includes('window._sharedData')) {
        const jsonStr = content.match(/window\._sharedData = ({.*?});/);
        if (jsonStr) {
          try {
            const sharedData = JSON.parse(jsonStr[1]);
            const user = sharedData.entry_data?.ProfilePage?.[0]?.graphql?.user;
            if (user) {
              profileData = user;
            }
          } catch (e) {
            // Continue searching
          }
        }
      }
    });

    if (!profileData) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found or is private'
      });
    }

    const result = {
      success: true,
      data: {
        username: profileData.username,
        full_name: profileData.full_name,
        biography: profileData.biography,
        followers: profileData.edge_followed_by?.count || 0,
        following: profileData.edge_follow?.count || 0,
        posts: profileData.edge_owner_to_timeline_media?.count || 0,
        profile_pic_url: profileData.profile_pic_url_hd,
        is_private: profileData.is_private,
        is_verified: profileData.is_verified,
        external_url: profileData.external_url
      }
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = app;
