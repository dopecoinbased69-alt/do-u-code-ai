import React, { useRef, useState } from 'react';
import { Upload, FileUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface AssetLoaderProps {
  onFileSelect: (file: File, url: string) => void;
  onClear?: () => void;
}

interface LoadedAsset {
  name: string;
  type: 'glb' | 'gltf' | 'fbx';
  url: string;
  size: number;
  uploadedAt: Date;
}

const AssetLoader: React.FC<AssetLoaderProps> = ({ onFileSelect, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadedAssets, setLoadedAssets] = useState<LoadedAsset[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['glb', 'gltf', 'fbx'];

    if (!validExtensions.includes(extension || '')) {
      toast.error('Invalid file format. Supported formats: GLB, GLTF, FBX');
      return;
    }

    const url = URL.createObjectURL(file);
    const asset: LoadedAsset = {
      name: file.name,
      type: extension as 'glb' | 'gltf' | 'fbx',
      url,
      size: file.size,
      uploadedAt: new Date(),
    };

    setLoadedAssets([asset, ...loadedAssets.slice(0, 4)]);
    onFileSelect(file, url);
    toast.success(`Loaded: ${file.name}`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeAsset = (url: string) => {
    setLoadedAssets(loadedAssets.filter((asset) => asset.url !== url));
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Asset Browser</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf,.fbx"
            onChange={handleInputChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <p className="text-sm font-medium">Drag & drop your model here</p>
            <p className="text-xs text-gray-500">or click to browse</p>
            <p className="text-xs text-gray-400 mt-2">Supported: GLB, GLTF, FBX</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="w-4 h-4 mr-2" />
            Browse Files
          </Button>
        </div>

        {/* Loaded Assets List */}
        {loadedAssets.length > 0 && (
          <div className="flex-1 min-h-0">
            <p className="text-sm font-medium mb-2">Loaded Assets</p>
            <ScrollArea className="h-full border rounded-lg">
              <div className="p-3 space-y-2">
                {loadedAssets.map((asset) => (
                  <div
                    key={asset.url}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded hover:bg-gray-100 dark:hover:bg-gray-800 group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{asset.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(asset.size)} • {asset.type.toUpperCase()}
                      </p>
                    </div>
                    <button
                      onClick={() => removeAsset(asset.url)}
                      className="ml-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Clear Button */}
        {loadedAssets.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadedAssets.forEach((asset) => URL.revokeObjectURL(asset.url));
              setLoadedAssets([]);
              if (onClear) onClear();
            }}
            className="w-full"
          >
            Clear All
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AssetLoader;
