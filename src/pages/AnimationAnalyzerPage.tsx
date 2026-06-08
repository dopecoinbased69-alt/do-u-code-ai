import React, { useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Viewport3D from '@/components/animation-analyzer/Viewport3D';
import AssetLoader from '@/components/animation-analyzer/AssetLoader';
import RigAnalyzer from '@/components/animation-analyzer/RigAnalyzer';
import AnimationAnalyzer from '@/components/animation-analyzer/AnimationAnalyzer';
import QualityInspector from '@/components/animation-analyzer/QualityInspector';
import PerformanceAnalyzer from '@/components/animation-analyzer/PerformanceAnalyzer';
import { Button } from '@/components/ui/button';
import { Download, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const AnimationAnalyzerPage: React.FC = () => {
  const [modelUrl, setModelUrl] = useState<string | undefined>();
  const [model, setModel] = useState<THREE.Group | undefined>();
  const [animations, setAnimations] = useState<THREE.AnimationClip[]>([]);
  const [selectedAnimationIndex, setSelectedAnimationIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = useCallback((file: File, url: string) => {
    setModelUrl(url);
    setIsPlaying(false);
    setSelectedAnimationIndex(0);
  }, []);

  const handleModelLoaded = useCallback((loadedModel: THREE.Group) => {
    setModel(loadedModel);
  }, []);

  const handleAnimationsLoaded = useCallback((loadedAnimations: THREE.AnimationClip[]) => {
    setAnimations(loadedAnimations);
  }, []);

  const handleClear = useCallback(() => {
    setModelUrl(undefined);
    setModel(undefined);
    setAnimations([]);
    setIsPlaying(false);
    setSelectedAnimationIndex(0);
  }, []);

  const handleExport = async () => {
    if (!model) {
      toast.error('No model loaded');
      return;
    }

    try {
      // Create a simple export (GLB format would require additional setup)
      const json = {
        model: {
          vertexCount: 0,
          triangleCount: 0,
          boneCount: 0,
        },
        animations: animations.map((anim) => ({
          name: anim.name,
          duration: anim.duration,
          frameCount: Math.round(anim.duration * 30),
        })),
      };

      const dataStr = JSON.stringify(json, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'animation-analysis.json';
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Analysis exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export analysis');
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI 3D Animation Analyzer</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Analyze, validate, and optimize 3D character animations
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!model}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={!model}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Panel - Asset Browser */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="h-full overflow-auto p-4">
            <AssetLoader onFileSelect={handleFileSelect} onClear={handleClear} />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Center Panel - 3D Viewport */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div ref={viewportRef} className="w-full h-full">
            {modelUrl ? (
              <Viewport3D
                modelUrl={modelUrl}
                showSkeleton={true}
                showGrid={true}
                animationIndex={selectedAnimationIndex}
                isPlaying={isPlaying}
                speed={animationSpeed}
                onModelLoaded={handleModelLoaded}
                onAnimationsLoaded={handleAnimationsLoaded}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Load a 3D model to begin analysis
                  </p>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Right Panel - Analysis */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <div className="h-full overflow-auto p-4">
            <Tabs defaultValue="rig" className="w-full h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-5 mb-4">
                <TabsTrigger value="rig">Rig</TabsTrigger>
                <TabsTrigger value="animation">Animation</TabsTrigger>
                <TabsTrigger value="quality">Quality</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-auto">
                <TabsContent value="rig" className="mt-0">
                  <RigAnalyzer model={model} />
                </TabsContent>

                <TabsContent value="animation" className="mt-0">
                  <AnimationAnalyzer
                    animations={animations}
                    onAnimationSelect={setSelectedAnimationIndex}
                    isPlaying={isPlaying}
                    onPlayToggle={setIsPlaying}
                  />
                </TabsContent>

                <TabsContent value="quality" className="mt-0">
                  <QualityInspector model={model} animations={animations} />
                </TabsContent>

                <TabsContent value="performance" className="mt-0">
                  <PerformanceAnalyzer model={model} animations={animations} />
                </TabsContent>

                <TabsContent value="export" className="mt-0">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <h3 className="font-medium mb-2">Export Options</h3>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600 dark:text-gray-400">
                          Export your analysis results and optimized models:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                          <li>GLB / GLTF format</li>
                          <li>FBX format</li>
                          <li>JSON analysis report</li>
                          <li>Optimization recommendations</li>
                        </ul>
                      </div>
                    </div>
                    <Button className="w-full" onClick={handleExport} disabled={!model}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default AnimationAnalyzerPage;
