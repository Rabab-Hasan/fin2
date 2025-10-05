const express = require('express');
const router = express.Router();
const axios = require('axios');

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_REDIRECT_URI = process.env.META_REDIRECT_URI;

// Meta OAuth URLs
const META_AUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth';
const META_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token';
const META_API_BASE = 'https://graph.facebook.com/v18.0';

// Get Meta OAuth URL
router.get('/auth-url', (req, res) => {
  try {
    const state = Math.random().toString(36).substring(2, 15);
    const scope = 'pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,business_management';
    
    const authUrl = `${META_AUTH_URL}?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}&scope=${encodeURIComponent(scope)}&response_type=code&state=${state}`;
    
    res.json({ 
      authUrl,
      state 
    });
  } catch (error) {
    console.error('Error generating Meta auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// Exchange authorization code for access token
router.post('/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange code for access token
    const tokenResponse = await axios.get(META_TOKEN_URL, {
      params: {
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        redirect_uri: META_REDIRECT_URI,
        code: code
      }
    });

    const { access_token } = tokenResponse.data;

    // Get user information
    const userResponse = await axios.get(`${META_API_BASE}/me`, {
      params: {
        access_token: access_token,
        fields: 'id,name,email'
      }
    });

    // Get user's pages (Facebook pages)
    const pagesResponse = await axios.get(`${META_API_BASE}/me/accounts`, {
      params: {
        access_token: access_token,
        fields: 'id,name,access_token,instagram_business_account'
      }
    });

    // Store tokens in MongoDB
    try {
      const { getDb } = require('../database-mongo');
      const db = await getDb();
      
      const tokenData = {
        client_id: state || 'default',
        platform: 'meta',
        user_id: userResponse.data.id,
        access_token: access_token,
        user_data: userResponse.data,
        pages_data: pagesResponse.data.data,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Upsert the token data
      await db.collection('social_media_tokens').replaceOne(
        { client_id: state || 'default', platform: 'meta', user_id: userResponse.data.id },
        tokenData,
        { upsert: true }
      );

      console.log('Meta tokens stored successfully for client:', state);
    } catch (dbError) {
      console.error('Error storing Meta tokens:', dbError);
      // Continue even if storage fails
    }

    res.json({
      success: true,
      user: userResponse.data,
      pages: pagesResponse.data.data,
      access_token: access_token
    });

  } catch (error) {
    console.error('Meta callback error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to complete Meta authentication',
      details: error.response?.data || error.message 
    });
  }
});

// Get Meta connection status for a client
router.get('/connection-status/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;

    // Fetch stored tokens from MongoDB
    try {
      const { getDb } = require('../database-mongo');
      const db = await getDb();
      
      const tokens = await db.collection('social_media_tokens').findOne({
        client_id: clientId,
        platform: 'meta'
      });
      
      if (!tokens) {
        return res.json({ connected: false, pages: [] });
      }

      res.json({
        connected: true,
        user: tokens.user_data,
        pages: tokens.pages_data,
        connected_at: tokens.created_at
      });

    } catch (dbError) {
      console.error('Database error fetching Meta connection:', dbError);
      res.json({ connected: false, pages: [] });
    }

  } catch (error) {
    console.error('Error fetching Meta connection status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Facebook pages
router.get('/pages', async (req, res) => {
  try {
    const { access_token } = req.query;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    const response = await axios.get(`${META_API_BASE}/me/accounts`, {
      params: {
        access_token: access_token,
        fields: 'id,name,access_token,instagram_business_account,category,picture'
      }
    });

    res.json({ pages: response.data.data });
  } catch (error) {
    console.error('Error fetching pages:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

// Get Instagram accounts
router.get('/instagram-accounts', async (req, res) => {
  try {
    const { page_access_token, page_id } = req.query;
    
    if (!page_access_token || !page_id) {
      return res.status(400).json({ error: 'Page access token and page ID are required' });
    }

    const response = await axios.get(`${META_API_BASE}/${page_id}`, {
      params: {
        access_token: page_access_token,
        fields: 'instagram_business_account'
      }
    });

    if (response.data.instagram_business_account) {
      const igResponse = await axios.get(`${META_API_BASE}/${response.data.instagram_business_account.id}`, {
        params: {
          access_token: page_access_token,
          fields: 'id,username,name,profile_picture_url,followers_count'
        }
      });

      res.json({ instagram_account: igResponse.data });
    } else {
      res.json({ instagram_account: null });
    }
  } catch (error) {
    console.error('Error fetching Instagram accounts:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch Instagram accounts' });
  }
});

// Post to Facebook page
router.post('/post-facebook', async (req, res) => {
  try {
    const { page_id, page_access_token, message, link } = req.body;
    
    if (!page_id || !page_access_token || !message) {
      return res.status(400).json({ error: 'Page ID, access token, and message are required' });
    }

    const postData = {
      message: message,
      access_token: page_access_token
    };

    if (link) {
      postData.link = link;
    }

    const response = await axios.post(`${META_API_BASE}/${page_id}/feed`, postData);

    res.json({ 
      success: true, 
      post_id: response.data.id 
    });
  } catch (error) {
    console.error('Error posting to Facebook:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to post to Facebook' });
  }
});

// Post to Instagram
router.post('/post-instagram', async (req, res) => {
  try {
    const { instagram_account_id, page_access_token, image_url, caption } = req.body;
    
    if (!instagram_account_id || !page_access_token || !image_url) {
      return res.status(400).json({ error: 'Instagram account ID, access token, and image URL are required' });
    }

    // Create media object
    const mediaResponse = await axios.post(`${META_API_BASE}/${instagram_account_id}/media`, {
      image_url: image_url,
      caption: caption || '',
      access_token: page_access_token
    });

    // Publish media
    const publishResponse = await axios.post(`${META_API_BASE}/${instagram_account_id}/media_publish`, {
      creation_id: mediaResponse.data.id,
      access_token: page_access_token
    });

    res.json({ 
      success: true, 
      post_id: publishResponse.data.id 
    });
  } catch (error) {
    console.error('Error posting to Instagram:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to post to Instagram' });
  }
});

// Get page insights
router.get('/insights/:page_id', async (req, res) => {
  try {
    const { page_id } = req.params;
    const { page_access_token, metric, period } = req.query;
    
    if (!page_access_token) {
      return res.status(400).json({ error: 'Page access token is required' });
    }

    const metrics = metric || 'page_fans,page_impressions,page_engaged_users';
    const timePeriod = period || 'day';

    const response = await axios.get(`${META_API_BASE}/${page_id}/insights`, {
      params: {
        metric: metrics,
        period: timePeriod,
        access_token: page_access_token
      }
    });

    res.json({ insights: response.data.data });
  } catch (error) {
    console.error('Error fetching insights:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Get Facebook page posts
router.get('/posts/:page_id', async (req, res) => {
  try {
    const { page_id } = req.params;
    const { page_access_token, limit = 25, since, until } = req.query;
    
    if (!page_access_token) {
      return res.status(400).json({ error: 'Page access token is required' });
    }

    const params = {
      access_token: page_access_token,
      fields: 'id,message,story,created_time,updated_time,permalink_url,full_picture,likes.summary(true),comments.summary(true),shares,reactions.summary(true)',
      limit: parseInt(limit)
    };

    if (since) params.since = since;
    if (until) params.until = until;

    const response = await axios.get(`${META_API_BASE}/${page_id}/posts`, { params });

    // Get detailed insights for each post
    const postsWithInsights = await Promise.all(
      response.data.data.map(async (post) => {
        try {
          const insightsResponse = await axios.get(`${META_API_BASE}/${post.id}/insights`, {
            params: {
              access_token: page_access_token,
              metric: 'post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total'
            }
          });
          
          return {
            ...post,
            insights: insightsResponse.data.data
          };
        } catch (insightError) {
          console.warn(`Failed to fetch insights for post ${post.id}:`, insightError.message);
          return post;
        }
      })
    );

    res.json({ 
      posts: postsWithInsights,
      paging: response.data.paging 
    });
  } catch (error) {
    console.error('Error fetching Facebook posts:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch Facebook posts' });
  }
});

// Get Instagram posts
router.get('/instagram-posts/:instagram_account_id', async (req, res) => {
  try {
    const { instagram_account_id } = req.params;
    const { access_token, limit = 25, since, until } = req.query;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    const params = {
      access_token: access_token,
      fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,like_count,comments_count,owner',
      limit: parseInt(limit)
    };

    if (since) params.since = since;
    if (until) params.until = until;

    const response = await axios.get(`${META_API_BASE}/${instagram_account_id}/media`, { params });

    // Get detailed insights for each post
    const postsWithInsights = await Promise.all(
      response.data.data.map(async (post) => {
        try {
          const insightsResponse = await axios.get(`${META_API_BASE}/${post.id}/insights`, {
            params: {
              access_token: access_token,
              metric: 'engagement,impressions,reach,saved'
            }
          });
          
          return {
            ...post,
            insights: insightsResponse.data.data
          };
        } catch (insightError) {
          console.warn(`Failed to fetch insights for Instagram post ${post.id}:`, insightError.message);
          return post;
        }
      })
    );

    res.json({ 
      posts: postsWithInsights,
      paging: response.data.paging 
    });
  } catch (error) {
    console.error('Error fetching Instagram posts:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch Instagram posts' });
  }
});

// Get aggregated Meta analytics
router.get('/analytics/:page_id', async (req, res) => {
  try {
    const { page_id } = req.params;
    const { page_access_token, instagram_account_id, since, until } = req.query;
    
    if (!page_access_token) {
      return res.status(400).json({ error: 'Page access token is required' });
    }

    const startDate = since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = until || new Date().toISOString().split('T')[0];

    // Get Facebook page insights
    const fbInsightsResponse = await axios.get(`${META_API_BASE}/${page_id}/insights`, {
      params: {
        access_token: page_access_token,
        metric: 'page_fans,page_impressions,page_engaged_users,page_post_engagements,page_reactions_logged_in_total',
        period: 'day',
        since: startDate,
        until: endDate
      }
    });

    let instagramInsights = null;
    if (instagram_account_id) {
      try {
        const igInsightsResponse = await axios.get(`${META_API_BASE}/${instagram_account_id}/insights`, {
          params: {
            access_token: page_access_token,
            metric: 'follower_count,impressions,reach,profile_views',
            period: 'day',
            since: startDate,
            until: endDate
          }
        });
        instagramInsights = igInsightsResponse.data.data;
      } catch (igError) {
        console.warn('Failed to fetch Instagram insights:', igError.message);
      }
    }

    res.json({
      facebook: fbInsightsResponse.data.data,
      instagram: instagramInsights,
      date_range: { since: startDate, until: endDate }
    });
  } catch (error) {
    console.error('Error fetching Meta analytics:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch Meta analytics' });
  }
});

// Verify webhook (for future use)
router.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = 'meta_webhook_verify_token';
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

module.exports = router;