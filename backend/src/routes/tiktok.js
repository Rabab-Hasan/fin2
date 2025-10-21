const express = require('express');
const axios = require('axios');
const router = express.Router();

// TikTok API configuration
const TIKTOK_CONFIG = {
  APP_ID: '7522384605962469377',
  SECRET: '909b6467cb06a246db4ef2149ee5a0fd454fd019',
  REDIRECT_URI: process.env.TIKTOK_REDIRECT_URI || 'https://actionlabs.netlify.app/tiktok-auth-callback',
  API_BASE_URL: 'https://business-api.tiktok.com/open_api/v1.3'
};

// Exchange authorization code for access token
router.post('/exchange-token', async (req, res) => {
  try {
    const { auth_code, client_id } = req.body;

    if (!auth_code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange auth code for access token
    const tokenResponse = await axios.post(`${TIKTOK_CONFIG.API_BASE_URL}/oauth2/access_token/`, {
      app_id: TIKTOK_CONFIG.APP_ID,
      secret: TIKTOK_CONFIG.SECRET,
      auth_code: auth_code,
      grant_type: 'authorization_code'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (tokenResponse.data.code !== 0) {
      console.error('TikTok token exchange error:', tokenResponse.data);
      return res.status(400).json({ 
        error: 'Failed to exchange token',
        details: tokenResponse.data.message 
      });
    }

    const { access_token, refresh_token, advertiser_ids } = tokenResponse.data.data;

    // Store tokens in MongoDB
    try {
      const { getDb } = require('../database-mongo');
      const db = await getDb();
      
      const tokenData = {
        client_id: client_id,
        platform: 'tiktok',
        access_token: access_token,
        refresh_token: refresh_token,
        advertiser_ids: advertiser_ids,
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + (tokenResponse.data.data.expires_in * 1000))
      };

      // Upsert the token data
      await db.collection('social_media_tokens').replaceOne(
        { client_id: client_id, platform: 'tiktok' },
        tokenData,
        { upsert: true }
      );

      console.log('TikTok tokens stored successfully for client:', client_id);
    } catch (dbError) {
      console.error('Error storing TikTok tokens:', dbError);
      // Continue even if storage fails
    }

    res.json({
      success: true,
      message: 'TikTok account connected successfully',
      data: {
        advertiser_ids: advertiser_ids,
        connected_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('TikTok token exchange error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.response?.data?.message || error.message 
    });
  }
});

// Get connected TikTok accounts for a client
router.get('/accounts/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;

    // Fetch stored tokens from MongoDB
    try {
      const { getDb } = require('../database-mongo');
      const db = await getDb();
      
      const tokens = await db.collection('social_media_tokens').findOne({
        client_id: clientId,
        platform: 'tiktok'
      });
      
      if (!tokens) {
        return res.json({ connected: false, accounts: [] });
      }

      // Check if tokens are expired
      if (tokens.expires_at && new Date() > tokens.expires_at) {
        return res.json({ 
          connected: false, 
          accounts: [],
          error: 'Tokens expired, please reconnect'
        });
      }

      const accounts = tokens.advertiser_ids.map(advertiserId => ({
        advertiser_id: advertiserId,
        name: `TikTok Business Account ${advertiserId}`,
        connected_at: tokens.created_at,
        access_token: tokens.access_token
      }));

      res.json({
        connected: true,
        accounts: accounts
      });

    } catch (dbError) {
      console.error('Database error fetching TikTok accounts:', dbError);
      res.json({ connected: false, accounts: [] });
    }

  } catch (error) {
    console.error('Error fetching TikTok accounts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh access token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refresh_token, client_id } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const refreshResponse = await axios.post(`${TIKTOK_CONFIG.API_BASE_URL}/oauth2/refresh_token/`, {
      app_id: TIKTOK_CONFIG.APP_ID,
      secret: TIKTOK_CONFIG.SECRET,
      refresh_token: refresh_token,
      grant_type: 'refresh_token'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (refreshResponse.data.code !== 0) {
      console.error('TikTok token refresh error:', refreshResponse.data);
      return res.status(400).json({ 
        error: 'Failed to refresh token',
        details: refreshResponse.data.message 
      });
    }

    const { access_token, refresh_token: new_refresh_token } = refreshResponse.data.data;

    // Update tokens in database
    /*
    const { getDb } = require('../db');
    const db = getDb();
    
    await db.collection('social_media_tokens').updateOne(
      { client_id: client_id, platform: 'tiktok' },
      { 
        $set: {
          access_token: access_token,
          refresh_token: new_refresh_token,
          updated_at: new Date()
        }
      }
    );
    */

    res.json({
      success: true,
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('TikTok token refresh error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.response?.data?.message || error.message 
    });
  }
});

// Get TikTok videos/posts
router.get('/videos/:advertiserId', async (req, res) => {
  try {
    const { advertiserId } = req.params;
    const { access_token, page_size = 50, page = 1, since, until } = req.query;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    const requestData = {
      advertiser_id: advertiserId,
      page_size: parseInt(page_size),
      page: parseInt(page),
      filtering: {}
    };

    if (since) requestData.filtering.start_time = since;
    if (until) requestData.filtering.end_time = until;

    // Get ad videos (for TikTok Business accounts)
    const videosResponse = await axios.post(`${TIKTOK_CONFIG.API_BASE_URL}/creative/get/`, requestData, {
      headers: {
        'Access-Token': access_token,
        'Content-Type': 'application/json'
      }
    });

    if (videosResponse.data.code !== 0) {
      throw new Error(videosResponse.data.message || 'TikTok API error');
    }

    // Get analytics for each video
    const videosWithAnalytics = await Promise.all(
      videosResponse.data.data.list.map(async (video) => {
        try {
          const analyticsResponse = await axios.post(`${TIKTOK_CONFIG.API_BASE_URL}/reports/integrated/get/`, {
            advertiser_id: advertiserId,
            report_type: 'CREATIVE',
            data_level: 'CREATIVE',
            dimensions: ['creative_id'],
            metrics: ['spend', 'impressions', 'clicks', 'ctr', 'cpm', 'cpc', 'conversion'],
            filters: [
              {
                field_name: 'creative_id',
                filter_type: 'IN',
                filter_value: [video.creative_id]
              }
            ],
            start_date: since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end_date: until || new Date().toISOString().split('T')[0]
          }, {
            headers: {
              'Access-Token': access_token,
              'Content-Type': 'application/json'
            }
          });

          return {
            ...video,
            analytics: analyticsResponse.data.code === 0 ? analyticsResponse.data.data : null
          };
        } catch (analyticsError) {
          console.warn(`Failed to fetch analytics for video ${video.creative_id}:`, analyticsError.message);
          return video;
        }
      })
    );

    res.json({
      videos: videosWithAnalytics,
      page_info: videosResponse.data.data.page_info
    });

  } catch (error) {
    console.error('Error fetching TikTok videos:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch TikTok videos' });
  }
});

// Get TikTok campaign analytics
router.get('/analytics/:advertiserId', async (req, res) => {
  try {
    const { advertiserId } = req.params;
    const { access_token, since, until, metrics } = req.query;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    const startDate = since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = until || new Date().toISOString().split('T')[0];
    const reportMetrics = metrics ? metrics.split(',') : [
      'spend', 'impressions', 'clicks', 'ctr', 'cpm', 'cpc', 
      'conversion', 'conversion_rate', 'video_play_actions', 
      'video_watched_2s', 'video_watched_6s'
    ];

    const analyticsResponse = await axios.post(`${TIKTOK_CONFIG.API_BASE_URL}/reports/integrated/get/`, {
      advertiser_id: advertiserId,
      report_type: 'BASIC',
      data_level: 'ADVERTISER',
      dimensions: ['advertiser_id'],
      metrics: reportMetrics,
      start_date: startDate,
      end_date: endDate
    }, {
      headers: {
        'Access-Token': access_token,
        'Content-Type': 'application/json'
      }
    });

    if (analyticsResponse.data.code !== 0) {
      throw new Error(analyticsResponse.data.message || 'Failed to fetch TikTok analytics');
    }

    res.json({
      analytics: analyticsResponse.data.data,
      date_range: { since: startDate, until: endDate },
      metrics: reportMetrics
    });

  } catch (error) {
    console.error('Error fetching TikTok analytics:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch TikTok analytics' });
  }
});

// Get TikTok audience insights
router.get('/audience/:advertiserId', async (req, res) => {
  try {
    const { advertiserId } = req.params;
    const { access_token, since, until } = req.query;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    const startDate = since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = until || new Date().toISOString().split('T')[0];

    // Get audience demographics
    const audienceResponse = await axios.post(`${TIKTOK_CONFIG.API_BASE_URL}/reports/integrated/get/`, {
      advertiser_id: advertiserId,
      report_type: 'AUDIENCE',
      data_level: 'ADVERTISER',
      dimensions: ['age', 'gender', 'country'],
      metrics: ['impressions', 'clicks', 'spend'],
      start_date: startDate,
      end_date: endDate
    }, {
      headers: {
        'Access-Token': access_token,
        'Content-Type': 'application/json'
      }
    });

    if (audienceResponse.data.code !== 0) {
      throw new Error(audienceResponse.data.message || 'Failed to fetch audience insights');
    }

    res.json({
      audience: audienceResponse.data.data,
      date_range: { since: startDate, until: endDate }
    });

  } catch (error) {
    console.error('Error fetching TikTok audience insights:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch audience insights' });
  }
});

module.exports = router;