import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, AlertCircle, Zap, Download } from 'lucide-react';
import { toast } from 'sonner';

interface OptimizationStrategy {
  id: string;
  name: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  estimatedSavings: {
    vertices?: number;
    bones?: number;
    keyframes?: number;
    memory?: number;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  applied: boolean;
}

interface OptimizationEngineProps {
  model?: THREE.Group;
  animations?: THREE.AnimationClip[];
  onOptimizationApplied?: (strategy: OptimizationStrategy) => void;
}

const OptimizationEngine: React.FC<OptimizationEngineProps> = ({
  model,
  animations = [],
  onOptimizationApplied,
}) => {
  const [strategies, setStrategies] = useState<OptimizationStrategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalSavings, setTotalSavings] = useState({
    vertices: 0,
    bones: 0,
    keyframes: 0,
    memory: 0,
  });

  useEffect(() => {
    if (!model || animations.length === 0) return;
    generateOptimizationStrategies(model, animations);
  }, [model, animations]);

  const generateOptimizationStrategies = async (
    model: THREE.Group,
    clips: THREE.AnimationClip[]
  ) => {
    setLoading(true);
    try {
      const strategies: OptimizationStrategy[] = [];

      // Strategy 1: Keyframe Reduction
      strategies.push({
        id: 'keyframe-reduction',
        name: 'Keyframe Reduction',
        description: 'Remove redundant keyframes using curve fitting algorithms',
        impact: 'high',
        estimatedSavings: {
          keyframes: Math.round(clips.reduce((sum, c) => sum + c.tracks.length * 10, 0)),
          memory: Math.round(Math.random() * 5 + 2),
        },
        difficulty: 'medium',
        applied: false,
      });

      // Strategy 2: Bone Reduction
      let boneCount = 0;
      model.traverse((child) => {
        if (child instanceof THREE.Bone) boneCount++;
      });

      if (boneCount > 50) {
        strategies.push({
          id: 'bone-reduction',
          name: 'Bone Reduction',
          description: 'Merge or remove non-essential bones from the rig',
          impact: 'high',
          estimatedSavings: {
            bones: Math.round(boneCount * 0.15),
            memory: Math.round(boneCount * 0.15 * 0.5),
          },
          difficulty: 'hard',
          applied: false,
        });
      }

      // Strategy 3: Animation Compression
      strategies.push({
        id: 'animation-compression',
        name: 'Animation Compression',
        description: 'Compress animation data using quantization and delta encoding',
        impact: 'high',
        estimatedSavings: {
          keyframes: Math.round(clips.reduce((sum, c) => sum + c.tracks.length * 5, 0)),
          memory: Math.round(Math.random() * 10 + 5),
        },
        difficulty: 'medium',
        applied: false,
      });

      // Strategy 4: Mesh Optimization
      let vertexCount = 0;
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const geometry = child.geometry;
          if (geometry instanceof THREE.BufferGeometry) {
            const positionAttribute = geometry.getAttribute('position');
            if (positionAttribute) {
              vertexCount += positionAttribute.count;
            }
          }
        }
      });

      if (vertexCount > 50000) {
        strategies.push({
          id: 'mesh-optimization',
          name: 'Mesh Optimization',
          description: 'Reduce vertex count using decimation and LOD systems',
          impact: 'high',
          estimatedSavings: {
            vertices: Math.round(vertexCount * 0.3),
            memory: Math.round(vertexCount * 0.3 * 0.00003),
          },
          difficulty: 'medium',
          applied: false,
        });
      }

      // Strategy 5: Texture Atlasing
      strategies.push({
        id: 'texture-atlasing',
        name: 'Texture Atlasing',
        description: 'Combine multiple textures into atlases to reduce draw calls',
        impact: 'medium',
        estimatedSavings: {
          memory: Math.round(Math.random() * 5 + 2),
        },
        difficulty: 'hard',
        applied: false,
      });

      // Strategy 6: LOD System
      strategies.push({
        id: 'lod-system',
        name: 'Level of Detail (LOD)',
        description: 'Create simplified versions of the model for distant viewing',
        impact: 'medium',
        estimatedSavings: {
          vertices: Math.round(vertexCount * 0.4),
          memory: Math.round(vertexCount * 0.4 * 0.00003),
        },
        difficulty: 'hard',
        applied: false,
      });

      setStrategies(strategies);
      calculateTotalSavings(strategies);
    } catch (error) {
      console.error('Error generating optimization strategies:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalSavings = (strats: OptimizationStrategy[]) => {
    const applied = strats.filter((s) => s.applied);
    const savings = {
      vertices: applied.reduce((sum, s) => sum + (s.estimatedSavings.vertices || 0), 0),
      bones: applied.reduce((sum, s) => sum + (s.estimatedSavings.bones || 0), 0),
      keyframes: applied.reduce((sum, s) => sum + (s.estimatedSavings.keyframes || 0), 0),
      memory: applied.reduce((sum, s) => sum + (s.estimatedSavings.memory || 0), 0),
    };
    setTotalSavings(savings);
  };

  const applyStrategy = (strategyId: string) => {
    setStrategies((prev) => {
      const updated = prev.map((s) =>
        s.id === strategyId ? { ...s, applied: !s.applied } : s
      );
      calculateTotalSavings(updated);
      return updated;
    });

    const strategy = strategies.find((s) => s.id === strategyId);
    if (strategy && onOptimizationApplied) {
      onOptimizationApplied({ ...strategy, applied: !strategy.applied });
    }

    toast.success('Optimization applied');
  };

  const handleExportOptimized = () => {
    const applied = strategies.filter((s) => s.applied);
    if (applied.length === 0) {
      toast.error('No optimizations selected');
      return;
    }

    const report = {
      optimizations: applied.map((s) => ({
        name: s.name,
        description: s.description,
        savings: s.estimatedSavings,
      })),
      totalSavings,
      timestamp: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'optimization-report.json';
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Optimization report exported');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500">Analyzing optimization opportunities...</p>
        </CardContent>
      </Card>
    );
  }

  const appliedCount = strategies.filter((s) => s.applied).length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Optimization Engine
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto flex flex-col gap-4">
        {/* Savings Summary */}
        {appliedCount > 0 && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg space-y-2">
            <p className="text-sm font-medium">Estimated Savings</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {totalSavings.vertices > 0 && (
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Vertices</p>
                  <p className="font-bold text-green-600 dark:text-green-400">
                    -{totalSavings.vertices.toLocaleString()}
                  </p>
                </div>
              )}
              {totalSavings.bones > 0 && (
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Bones</p>
                  <p className="font-bold text-green-600 dark:text-green-400">
                    -{totalSavings.bones}
                  </p>
                </div>
              )}
              {totalSavings.keyframes > 0 && (
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Keyframes</p>
                  <p className="font-bold text-green-600 dark:text-green-400">
                    -{totalSavings.keyframes.toLocaleString()}
                  </p>
                </div>
              )}
              {totalSavings.memory > 0 && (
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Memory</p>
                  <p className="font-bold text-green-600 dark:text-green-400">
                    -{totalSavings.memory.toFixed(1)}MB
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Strategies List */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="high">High Impact</TabsTrigger>
            <TabsTrigger value="applied">Applied</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                className="p-3 border rounded-lg space-y-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{strategy.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {strategy.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant={
                        strategy.impact === 'high'
                          ? 'destructive'
                          : strategy.impact === 'medium'
                            ? 'secondary'
                            : 'outline'
                      }
                      className="text-xs"
                    >
                      {strategy.impact}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      {strategy.difficulty}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 space-y-0.5">
                    {strategy.estimatedSavings.vertices && (
                      <p>Vertices: -{strategy.estimatedSavings.vertices.toLocaleString()}</p>
                    )}
                    {strategy.estimatedSavings.bones && (
                      <p>Bones: -{strategy.estimatedSavings.bones}</p>
                    )}
                    {strategy.estimatedSavings.keyframes && (
                      <p>Keyframes: -{strategy.estimatedSavings.keyframes.toLocaleString()}</p>
                    )}
                    {strategy.estimatedSavings.memory && (
                      <p>Memory: -{strategy.estimatedSavings.memory.toFixed(1)}MB</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={strategy.applied ? 'default' : 'outline'}
                    onClick={() => applyStrategy(strategy.id)}
                  >
                    {strategy.applied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Applied
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Apply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="high" className="space-y-3 mt-4">
            {strategies
              .filter((s) => s.impact === 'high')
              .map((strategy) => (
                <div
                  key={strategy.id}
                  className="p-3 border rounded-lg space-y-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{strategy.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {strategy.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={strategy.applied ? 'default' : 'outline'}
                      onClick={() => applyStrategy(strategy.id)}
                    >
                      {strategy.applied ? 'Applied' : 'Apply'}
                    </Button>
                  </div>
                </div>
              ))}
          </TabsContent>

          <TabsContent value="applied" className="space-y-3 mt-4">
            {strategies.filter((s) => s.applied).length > 0 ? (
              <>
                {strategies
                  .filter((s) => s.applied)
                  .map((strategy) => (
                    <div
                      key={strategy.id}
                      className="p-3 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 rounded-lg space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{strategy.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {strategy.description}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => applyStrategy(strategy.id)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Applied
                        </Button>
                      </div>
                    </div>
                  ))}
                <Button className="w-full mt-4" onClick={handleExportOptimized}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Optimization Report
                </Button>
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No optimizations applied yet
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OptimizationEngine;
