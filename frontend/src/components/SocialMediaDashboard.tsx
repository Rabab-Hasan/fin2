import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, BarChart3, Users, TrendingUp, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import { metaApi } from '../api/meta';
import { tiktokApi } from '../api/tiktok';
import Card from './Card';

interface SocialMediaDashboardProps {
  clientId: string;
}

interface SocialMediaPost {
  id: string;
  platform: 'facebook' | 'instagram' | 'tiktok';
  message?: string;
  caption?: string;
  media_url?: string;
  full_picture?: string;
  thumbnail_url?: string;
  permalink_url?: string;
  permalink?: string;
  created_time?: string;
  timestamp?: string;
  likes?: { summary?: { total_count: number } };
  like_count?: number;
  comments?: { summary?: { total_count: number } };
  comments_count?: number;
  shares?: { count: number };
  reactions?: { summary?: { total_count: number } };
  insights?: any[];
  analytics?: any;
}

const SocialMediaDashboard: React.FC<SocialMediaDashboardProps> = ({ clientId }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'facebook' | 'instagram' | 'tiktok'>('all');
  const [dateRange, setDateRange] = useState({
    since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    until: new Date().toISOString().split('T')[0]
  });

  // Check if platforms are connected
  const { data: metaConnection } = useQuery({
    queryKey: ['meta-connection', clientId],
    queryFn: () => metaApi.getConnectionStatus(clientId),
    enabled: !!clientId
  });

  const { data: tiktokAccounts } = useQuery({
    queryKey: ['tiktok-accounts', clientId],
    queryFn: () => tiktokApi.getAccounts(clientId),
    enabled: !!clientId
  });

  const metaConnected = metaConnection?.connected || false;
  const metaPages = metaConnection?.pages || [];

  // Fetch Meta posts
  const { data: metaPosts, isLoading: metaLoading } = useQuery({
    queryKey: ['meta-posts', dateRange.since, dateRange.until],
    queryFn: async () => {
      if (!metaConnected || metaPages.length === 0) return [];
      
      const allPosts: SocialMediaPost[] = [];
      
      for (const page of metaPages) {
        try {
          // Fetch Facebook posts
          const fbPosts = await metaApi.getFacebookPosts(
            page.id, 
            page.access_token, 
            25, 
            dateRange.since, 
            dateRange.until
          );
          
          const formattedFbPosts = fbPosts.posts.map((post: any) => ({
            ...post,
            platform: 'facebook' as const
          }));
          
          allPosts.push(...formattedFbPosts);

          // Fetch Instagram posts if available
          if (page.instagram_business_account) {
            const igPosts = await metaApi.getInstagramPosts(
              page.instagram_business_account.id,
              page.access_token,
              25,
              dateRange.since,
              dateRange.until
            );
            
            const formattedIgPosts = igPosts.posts.map((post: any) => ({
              ...post,
              platform: 'instagram' as const
            }));
            
            allPosts.push(...formattedIgPosts);
          }
        } catch (error) {
          console.error(`Error fetching posts for page ${page.id}:`, error);
        }
      }
      
      return allPosts;
    },
    enabled: metaConnected && metaPages.length > 0
  });

  // Fetch TikTok posts
  const { data: tiktokPosts, isLoading: tiktokLoading } = useQuery({
    queryKey: ['tiktok-posts', dateRange.since, dateRange.until],
    queryFn: async () => {
      if (!tiktokAccounts?.connected || !tiktokAccounts.accounts.length) return [];
      
      const allPosts: SocialMediaPost[] = [];
      
      for (const account of tiktokAccounts.accounts) {
        try {
          const videos = await tiktokApi.getVideos(
            account.advertiser_id,
            account.access_token, // This would need to be stored and retrieved
            25,
            1,
            dateRange.since,
            dateRange.until
          );
          
          const formattedVideos = videos.videos.map((video: any) => ({
            ...video,
            platform: 'tiktok' as const
          }));
          
          allPosts.push(...formattedVideos);
        } catch (error) {
          console.error(`Error fetching TikTok videos for account ${account.advertiser_id}:`, error);
        }
      }
      
      return allPosts;
    },
    enabled: !!tiktokAccounts?.connected && tiktokAccounts.accounts.length > 0
  });

  // Combine and filter posts
  const allPosts = [
    ...(metaPosts || []),
    ...(tiktokPosts || [])
  ];

  const filteredPosts = selectedPlatform === 'all' 
    ? allPosts 
    : allPosts.filter(post => post.platform === selectedPlatform);

  // Calculate analytics
  const analytics = {
    totalPosts: filteredPosts.length,
    totalLikes: filteredPosts.reduce((sum, post) => {
      if (post.platform === 'facebook' || post.platform === 'instagram') {
        return sum + (post.likes?.summary?.total_count || post.like_count || 0);
      }
      return sum;
    }, 0),
    totalComments: filteredPosts.reduce((sum, post) => {
      return sum + (post.comments?.summary?.total_count || post.comments_count || 0);
    }, 0),
    totalShares: filteredPosts.reduce((sum, post) => {
      return sum + (post.shares?.count || 0);
    }, 0),
    avgEngagement: filteredPosts.length > 0 
      ? filteredPosts.reduce((sum, post) => {
          const likes = post.likes?.summary?.total_count || post.like_count || 0;
          const comments = post.comments?.summary?.total_count || post.comments_count || 0;
          const shares = post.shares?.count || 0;
          return sum + likes + comments + shares;
        }, 0) / filteredPosts.length
      : 0
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEngagementMetrics = (post: SocialMediaPost) => {
    const likes = post.likes?.summary?.total_count || post.like_count || 0;
    const comments = post.comments?.summary?.total_count || post.comments_count || 0;
    const shares = post.shares?.count || 0;
    const reactions = post.reactions?.summary?.total_count || 0;
    
    return { likes, comments, shares, reactions };
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return (
          <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">f</span>
          </div>
        );
      case 'instagram':
        return (
          <div className="w-5 h-5 bg-gradient-to-br from-purple-600 to-pink-500 rounded flex items-center justify-center">
            <span className="text-white text-xs">📷</span>
          </div>
        );
      case 'tiktok':
        return (
          <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
            <span className="text-white text-xs">♪</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Social Media Dashboard</h2>
          <p className="text-gray-600">Monitor your social media performance across platforms</p>
        </div>
        
        {/* Date Range Picker */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={dateRange.since}
            onChange={(e) => setDateRange(prev => ({ ...prev, since: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={dateRange.until}
            onChange={(e) => setDateRange(prev => ({ ...prev, until: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Platform Filter */}
      <div className="flex gap-2">
        {(['all', 'facebook', 'instagram', 'tiktok'] as const).map((platform) => (
          <button
            key={platform}
            onClick={() => setSelectedPlatform(platform)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPlatform === platform
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </button>
        ))}
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalPosts}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Likes</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalLikes)}</p>
            </div>
            <Heart className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Comments</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalComments)}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Engagement</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(Math.round(analytics.avgEngagement))}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Connection Status */}
      {(!metaConnected && !tiktokAccounts?.connected) && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-yellow-800">No Social Media Accounts Connected</h3>
              <p className="text-sm text-yellow-700">
                Connect your Meta (Facebook/Instagram) or TikTok accounts to see your posts and analytics.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Posts Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.slice(0, 12).map((post) => {
            const engagement = getEngagementMetrics(post);
            const postDate = formatDate(post.created_time || post.timestamp || '');
            
            return (
              <Card key={post.id} className="overflow-hidden">
                {/* Post Media */}
                {(post.full_picture || post.media_url || post.thumbnail_url) && (
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={post.full_picture || post.media_url || post.thumbnail_url}
                      alt="Post content"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="p-4">
                  {/* Platform and Date */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(post.platform)}
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {post.platform}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{postDate}</span>
                  </div>
                  
                  {/* Post Content */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-800 line-clamp-3">
                      {post.message || post.caption || 'No caption available'}
                    </p>
                  </div>
                  
                  {/* Engagement Metrics */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      {engagement.likes > 0 && (
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{formatNumber(engagement.likes)}</span>
                        </div>
                      )}
                      {engagement.comments > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{formatNumber(engagement.comments)}</span>
                        </div>
                      )}
                      {engagement.shares > 0 && (
                        <div className="flex items-center gap-1">
                          <Share2 className="w-4 h-4" />
                          <span>{formatNumber(engagement.shares)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* View Post Link */}
                  {(post.permalink_url || post.permalink) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <a
                        href={post.permalink_url || post.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View Post
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="text-gray-400 mb-2">
            <BarChart3 className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Posts Found</h3>
          <p className="text-gray-600">
            {metaLoading || tiktokLoading
              ? 'Loading posts...'
              : 'No posts available for the selected date range and platform.'}
          </p>
        </Card>
      )}
    </div>
  );
};

export default SocialMediaDashboard;