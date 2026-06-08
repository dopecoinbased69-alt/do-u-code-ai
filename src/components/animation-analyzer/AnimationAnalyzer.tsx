import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnimationClipAnalysis {
  name: string;
  duration: number;
  frameCount: number;
  frameRate: number;
  hasRootMotion: boolean;
  rootMotionDistance: number;
  loopQuality: number;
  complexity: number;
  boneTransformCount: number;
  keyframeCount: number;
}

interface AnimationAnalyzerProps {
  animations?: THREE.AnimationClip[];
  onAnimationSelect?: (index: number) => void;
  isPlaying?: boolean;
  onPlayToggle?: (playing: boolean) => void;
}

const AnimationAnalyzer: React.FC<AnimationAnalyzerProps> = ({
  animations = [],
  onAnimationSelect,
  isPlaying = false,
  onPlayToggle,
}) => {
  const [analyses, setAnalyses] = useState<AnimationClipAnalysis[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (animations.length === 0) return;
    analyzeAnimations(animations);
  }, [animations]);

  const analyzeAnimations = async (clips: THREE.AnimationClip[]) => {
    setLoading(true);
    try {
      const analysisResults = clips.map((clip) => analyzeClip(clip));
      setAnalyses(analysisResults);
    } catch (error) {
      console.error('Error analyzing animations:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeClip = (clip: THREE.AnimationClip): AnimationClipAnalysis => {
    const duration = clip.duration;
    const frameRate = 30; // Default FPS
    const frameCount = Math.round(duration * frameRate);

    // Count unique bone transforms
    let boneTransformCount = 0;
    let keyframeCount = 0;
    let hasRootMotion = false;
    let rootMotionDistance = 0;

    clip.tracks.forEach((track) => {
      const trackName = track.name;
      boneTransformCount++;
      keyframeCount += track.times.length;

      // Check for root motion (typically on the root bone)
      if (trackName.includes('root') || trackName.includes('Root')) {
        hasRootMotion = true;
        // Calculate approximate distance
        if (track instanceof THREE.VectorKeyframeTrack) {
          const values = track.values;
          if (values.length >= 6) {
            const startX = values[0];
            const startZ = values[2];
            const endX = values[values.length - 3];
            const endZ = values[values.length - 1];
            rootMotionDistance = Math.sqrt(
              Math.pow(endX - startX, 2) + Math.pow(endZ - startZ, 2)
            );
          }
        }
      }
    });

    // Analyze loop quality by comparing first and last frames
    let loopQuality = 100;
    const firstTrack = clip.tracks[0];
    if (firstTrack && firstTrack.times.length > 1) {
      const times = firstTrack.times;
      const firstTime = times[0];
      const lastTime = times[times.length - 1];

      // Check if animation loops smoothly
      if (firstTrack instanceof THREE.QuaternionKeyframeTrack) {
        const values = firstTrack.values;
        const firstValue = values.slice(0, 4);
        const lastValue = values.slice(Math.max(0, values.length - 4));

        const diff = Math.abs(
          Math.sqrt(
            firstValue.reduce((sum, v, i) => sum + Math.pow(v - (lastValue[i] || 0), 2), 0)
          )
        );

        loopQuality = Math.max(0, 100 - diff * 50);
      }
    }

    // Calculate complexity based on number of tracks and keyframes
    const complexity = Math.min(100, (boneTransformCount * keyframeCount) / 100);

    return {
      name: clip.name,
      duration,
      frameCount,
      frameRate,
      hasRootMotion,
      rootMotionDistance,
      loopQuality: Math.round(loopQuality),
      complexity: Math.round(complexity),
      boneTransformCount,
      keyframeCount,
    };
  };

  const handleAnimationSelect = (index: number) => {
    setSelectedIndex(index);
    if (onAnimationSelect) {
      onAnimationSelect(index);
    }
  };

  const currentAnalysis = analyses[selectedIndex];

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500">Analyzing animations...</p>
        </CardContent>
      </Card>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500">No animations loaded</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Animation Analyzer</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto flex flex-col gap-4">
        {/* Animation List */}
        <div>
          <p className="text-xs font-medium mb-2">Animations ({analyses.length})</p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {analyses.map((analysis, index) => (
              <button
                key={index}
                onClick={() => handleAnimationSelect(index)}
                className={`w-full text-left p-2 rounded transition-colors ${
                  selectedIndex === index
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <p className="text-sm font-medium truncate">{analysis.name}</p>
                <p className="text-xs text-gray-500">
                  {analysis.duration.toFixed(2)}s • {analysis.frameCount} frames
                </p>
              </button>
            ))}
          </div>
        </div>

        {currentAnalysis && (
          <>
            {/* Playback Controls */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={isPlaying ? 'default' : 'outline'}
                onClick={() => onPlayToggle?.(!isPlaying)}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Play
                  </>
                )}
              </Button>
              <Button size="sm" variant="outline" onClick={() => onPlayToggle?.(false)}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Analysis Tabs */}
            <Tabs defaultValue="metrics" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="motion">Motion</TabsTrigger>
                <TabsTrigger value="quality">Quality</TabsTrigger>
              </TabsList>

              <TabsContent value="metrics" className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-lg font-bold">{currentAnalysis.duration.toFixed(2)}s</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                    <p className="text-xs text-gray-500">Frame Count</p>
                    <p className="text-lg font-bold">{currentAnalysis.frameCount}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                    <p className="text-xs text-gray-500">Frame Rate</p>
                    <p className="text-lg font-bold">{currentAnalysis.frameRate} FPS</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                    <p className="text-xs text-gray-500">Bone Tracks</p>
                    <p className="text-lg font-bold">{currentAnalysis.boneTransformCount}</p>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <p className="text-xs text-gray-500">Total Keyframes</p>
                  <p className="text-lg font-bold">{currentAnalysis.keyframeCount}</p>
                </div>
              </TabsContent>

              <TabsContent value="motion" className="space-y-3 mt-4">
                <div className="flex items-center gap-2">
                  <Badge variant={currentAnalysis.hasRootMotion ? 'default' : 'secondary'}>
                    {currentAnalysis.hasRootMotion ? 'Root Motion' : 'No Root Motion'}
                  </Badge>
                </div>
                {currentAnalysis.hasRootMotion && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                    <p className="text-xs text-gray-500">Root Motion Distance</p>
                    <p className="text-lg font-bold">
                      {currentAnalysis.rootMotionDistance.toFixed(2)} units
                    </p>
                  </div>
                )}
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <p className="text-xs text-gray-500 mb-2">Motion Complexity</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${currentAnalysis.complexity}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{currentAnalysis.complexity}%</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="quality" className="space-y-3 mt-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <p className="text-xs text-gray-500 mb-2">Loop Quality</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          currentAnalysis.loopQuality >= 80
                            ? 'bg-green-500'
                            : currentAnalysis.loopQuality >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${currentAnalysis.loopQuality}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{currentAnalysis.loopQuality}%</span>
                  </div>
                </div>
                {currentAnalysis.loopQuality < 80 && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠️ Animation may not loop smoothly. Consider adjusting first/last keyframes.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AnimationAnalyzer;
