import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Upload, 
  FileImage, 
  FileVideo, 
  File, 
  Trash2, 
  Edit, 
  Eye, 
  Download,
  Search,
  Plus,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Card from './Card';
import mediaApi from '../api/media';

// Funnel stages definition
const FUNNEL_STAGES = [
  {
    id: 'awareness',
    name: 'Awareness',
    description: 'Content that builds brand awareness and attracts potential customers',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700'
  },
  {
    id: 'downloads',
    name: 'Downloads',
    description: 'Lead magnets and downloadable resources',
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700'
  },
  {
    id: 'registration',
    name: 'Registration',
    description: 'Content for user registration and onboarding',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700'
  },
  {
    id: 'apply',
    name: 'Apply',
    description: 'Content for application and conversion actions',
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700'
  }
];

// Media asset interface
interface MediaAsset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  size: number;
  url: string;
  thumbnailUrl?: string;
  stage: string;
  tags: string[];
  uploadDate: string;
  status: 'active' | 'draft' | 'archived';
  description?: string;
}

// Mock data for demonstration (empty now that we use real API)
// const mockAssets: MediaAsset[] = [];

const ContentManagement: React.FC = () => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadStage, setUploadStage] = useState(FUNNEL_STAGES[0].id);
  const [uploadTags, setUploadTags] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const queryClient = useQueryClient();

  // Fetch assets with filters
  const { data: assetsData } = useQuery({
    queryKey: ['media-assets', selectedStage, searchQuery],
    queryFn: () => mediaApi.getAssets({
      stage: selectedStage,
      search: searchQuery,
      status: 'active'
    }),
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ file, metadata }: { file: File; metadata: any }) => 
      mediaApi.uploadAsset(file, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      setIsUploadModalOpen(false);
      setPendingFiles([]);
      setUploadTags('');
      setUploadDescription('');
      alert('File uploaded successfully!');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, metadata }: { id: string; metadata: any }) => 
      mediaApi.updateAsset(id, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      setEditingAsset(null);
      alert('Asset updated successfully!');
    },
    onError: (error) => {
      console.error('Update error:', error);
      alert('Failed to update asset. Please try again.');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaApi.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      alert('Asset deleted successfully!');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      alert('Failed to delete asset. Please try again.');
    },
  });

  // Update assets when data changes
  useEffect(() => {
    if (assetsData?.assets) {
      setAssets(assetsData.assets);
    }
  }, [assetsData]);

  // Filter assets based on stage and search
  const filteredAssets = assets?.filter(asset => {
    const matchesStage = selectedStage === 'all' || asset.stage === selectedStage;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStage && matchesSearch;
  }) || [];

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setPendingFiles(acceptedFiles);
    setIsUploadModalOpen(true);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  // Handle upload
  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;

    const metadata = {
      stage: uploadStage,
      tags: uploadTags,
      description: uploadDescription,
      status: 'active'
    };

    try {
      for (const file of pendingFiles) {
        await uploadMutation.mutateAsync({ file, metadata });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  // Handle edit
  const handleEdit = (asset: MediaAsset) => {
    setEditingAsset(asset);
  };

  // Handle update
  const handleUpdate = async () => {
    if (!editingAsset) return;

    const metadata = {
      stage: editingAsset.stage,
      tags: editingAsset.tags.join(', '),
      description: editingAsset.description,
      status: editingAsset.status
    };

    updateMutation.mutate({ id: editingAsset.id, metadata });
  };

  // Handle delete
  const handleDelete = async (asset: MediaAsset) => {
    if (window.confirm(`Are you sure you want to delete "${asset.name}"?`)) {
      deleteMutation.mutate(asset.id);
    }
  };

  // Handle view
  const handleView = (asset: MediaAsset) => {
    window.open(asset.url, '_blank');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <FileImage className="h-5 w-5" />;
      case 'video':
        return <FileVideo className="h-5 w-5" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'archived':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getCurrentStage = () => {
    return FUNNEL_STAGES.find(stage => stage.id === selectedStage);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Content Management</h2>
        <p className="text-purple-100">
          Organize and manage media assets across your marketing funnel stages
        </p>
      </div>

      {/* Funnel Stage Progress */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Funnel Stages</h3>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {FUNNEL_STAGES.map((stage, index) => {
            const stageAssets = assets.filter(asset => asset.stage === stage.id);
            const isSelected = selectedStage === stage.id;
            
            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStage(stage.id)}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  isSelected 
                    ? `${stage.lightColor} ${stage.borderColor} shadow-md scale-105` 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${stage.color} mb-2`}></div>
                <h4 className={`font-medium text-sm ${isSelected ? stage.textColor : 'text-gray-900'}`}>
                  {stage.name}
                </h4>
                <p className="text-xs text-gray-600 mt-1">{stageAssets.length} assets</p>
                
                {/* Progress connector line */}
                {index < FUNNEL_STAGES.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 bg-gray-300 transform -translate-y-1/2"></div>
                )}
              </button>
            );
          })}
        </div>
        
        <button
          onClick={() => setSelectedStage('all')}
          className={`mt-4 px-4 py-2 rounded-md transition-colors ${
            selectedStage === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Show All Stages
        </button>
      </Card>

      {/* Controls */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="btn-primary inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Asset
            </button>
            
            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm ${
                  viewMode === 'grid' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border-r border-gray-300`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm ${
                  viewMode === 'list' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
        
        {selectedStage !== 'all' && getCurrentStage() && (
          <div className={`mt-4 p-3 rounded-lg ${getCurrentStage()?.lightColor} border ${getCurrentStage()?.borderColor}`}>
            <h4 className={`font-medium ${getCurrentStage()?.textColor}`}>
              {getCurrentStage()?.name} Stage
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {getCurrentStage()?.description}
            </p>
          </div>
        )}
      </Card>

      {/* Upload Dropzone */}
      <Card>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragActive 
              ? 'border-purple-400 bg-purple-50' 
              : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-purple-600 font-medium">Drop files here to upload...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                <span className="font-medium text-purple-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-sm text-gray-500">
                Images, videos, PDFs, and documents up to 50MB
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Assets Grid/List */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedStage === 'all' ? 'All Assets' : `${getCurrentStage()?.name} Assets`}
            <span className="text-sm text-gray-500 ml-2">({filteredAssets.length})</span>
          </h3>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No assets found</p>
            <p className="text-sm text-gray-400 mt-1">
              Upload your first asset or adjust your filters
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => {
              const stage = FUNNEL_STAGES.find(s => s.id === asset.stage);
              return (
                <div key={asset.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    {asset.type === 'image' ? (
                      <img 
                        src={asset.thumbnailUrl || asset.url} 
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-4xl text-gray-400">
                        {getFileIcon(asset.type)}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm text-gray-900 truncate flex-1">
                        {asset.name}
                      </h4>
                      {getStatusIcon(asset.status)}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${stage?.color}`}></span>
                      <span className="text-xs text-gray-600">{stage?.name}</span>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-3">
                      {formatFileSize(asset.size)} • {new Date(asset.uploadDate).toLocaleDateString()}
                    </p>
                    
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleView(asset)}
                        className="flex-1 btn-secondary text-xs py-1"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </button>
                      <button 
                        onClick={() => handleEdit(asset)}
                        className="btn-secondary text-xs py-1 px-2"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleDelete(asset)}
                        className="btn-secondary text-xs py-1 px-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAssets.map((asset) => {
              const stage = FUNNEL_STAGES.find(s => s.id === asset.stage);
              return (
                <div key={asset.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0">
                    {getFileIcon(asset.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm text-gray-900 truncate">
                        {asset.name}
                      </h4>
                      {getStatusIcon(asset.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className={`inline-block w-2 h-2 rounded-full ${stage?.color}`}></span>
                        {stage?.name}
                      </span>
                      <span>{formatFileSize(asset.size)}</span>
                      <span>{new Date(asset.uploadDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleView(asset)}
                      className="btn-secondary text-xs py-1 px-3"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </button>
                    <button 
                      onClick={() => handleEdit(asset)}
                      className="btn-secondary text-xs py-1 px-2"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleView(asset)}
                      className="btn-secondary text-xs py-1 px-2"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleDelete(asset)}
                      className="btn-secondary text-xs py-1 px-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Asset</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funnel Stage
                </label>
                <select
                  value={uploadStage}
                  onChange={(e) => setUploadStage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {FUNNEL_STAGES.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="e.g., video, social-media, campaign"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Brief description of the asset..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={pendingFiles.length === 0 || uploadMutation.isPending}
                className="btn-primary"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {editingAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Edit Asset</h2>
              <button
                onClick={() => setEditingAsset(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Name
                </label>
                <input
                  type="text"
                  value={editingAsset.name}
                  onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Funnel Stage
                </label>
                <select
                  value={editingAsset.stage}
                  onChange={(e) => setEditingAsset({ ...editingAsset, stage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FUNNEL_STAGES.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={editingAsset.tags.join(', ')}
                  onChange={(e) => setEditingAsset({ 
                    ...editingAsset, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., marketing, social, campaign"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingAsset.description || ''}
                  onChange={(e) => setEditingAsset({ ...editingAsset, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Brief description of this asset..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editingAsset.status}
                  onChange={(e) => setEditingAsset({ ...editingAsset, status: e.target.value as 'active' | 'draft' | 'archived' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingAsset(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
                className="btn-primary"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;