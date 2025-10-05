import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { importApi } from '../api/import';
import { ImportResult } from '../types';
import Card from './Card';
import { useClient } from '../contexts/ClientContext';

interface FileImportProps {
  onSuccess?: (result: ImportResult) => void;
}

const FileImport: React.FC<FileImportProps> = ({ onSuccess }) => {
  const { selectedClient } = useClient();
  const [dragActive, setDragActive] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: ({ file, clientId }: { file: File; clientId: string }) => 
      importApi.importFile(file, clientId),
    onSuccess: (result) => {
      setImportResult(result);
      setShowResult(true);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['columns'] });
      onSuccess?.(result);
    },
  });

  const handleFile = (file: File) => {
    if (!selectedClient) {
      alert('Please select a client first');
      return;
    }
    
    if (!file.name.match(/\.(xlsx?|csv)$/i)) {
      alert('Please select an Excel (.xlsx, .xls) or CSV file');
      return;
    }
    importMutation.mutate({ file, clientId: selectedClient.id });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <>
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Data</h3>
        
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            Drag and drop your Excel or CSV file here, or click to browse
          </p>
          
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            disabled={importMutation.isPending}
          />
          
          <label
            htmlFor="file-upload"
            className={`btn-primary cursor-pointer inline-flex items-center ${
              importMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
            {importMutation.isPending ? 'Importing...' : 'Choose File'}
          </label>
        </div>

        {importMutation.isError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">
              Error: {importMutation.error instanceof Error ? importMutation.error.message : 'Unknown error'}
            </p>
          </div>
        )}
      </Card>

      {/* Result Modal */}
      {showResult && importResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Import Results</h3>
              <button
                onClick={() => setShowResult(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-green-600">{importResult.inserted}</div>
                <div className="text-sm text-gray-600">Inserted</div>
              </div>
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-blue-600">{importResult.updated}</div>
                <div className="text-sm text-gray-600">Updated</div>
              </div>
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
                <div className="text-sm text-gray-600">Skipped</div>
              </div>
            </div>

            {importResult.new_columns.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">New Columns Added:</h4>
                <div className="flex flex-wrap gap-2">
                  {importResult.new_columns.map(col => (
                    <span key={col} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {importResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Errors:</h4>
                <div className="max-h-32 overflow-auto space-y-1">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600">
                      Row {error.row}: {error.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowResult(false)}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileImport;
