import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PerformanceMetrics {
  vertexCount: number;
  triangleCount: number;
  boneCount: number;
  animationCount: number;
  totalAnimationFrames: number;
  memoryUsage: number; // in MB
  estimatedAnimationCost: number; // 0-100
  meshCount: number;
  materialCount: number;
  textureCount: number;
  drawCalls: number;
}

interface OptimizationRecommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialSavings: string;
}

interface PerformanceAnalyzerProps {
  model?: THREE.Group;
  animations?: THREE.AnimationClip[];
}

const PerformanceAnalyzer: React.FC<PerformanceAnalyzerProps> = ({ model, animations = [] }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!model) return;
    analyzePerformance(model, animations);
  }, [model, animations]);

  const analyzePerformance = async (model: THREE.Group, clips: THREE.AnimationClip[]) => {
    setLoading(true);
    try {
      const metrics = calculateMetrics(model, clips);
      const recommendations = generateRecommendations(metrics);

      setMetrics(metrics);
      setRecommendations(recommendations);
    } catch (error) {
      console.error('Error analyzing performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (model: THREE.Group, clips: THREE.AnimationClip[]): PerformanceMetrics => {
    let vertexCount = 0;
    let triangleCount = 0;
    let meshCount = 0;
    let materialCount = 0;
    let textureCount = new Set<string>();
    let drawCalls = 0;

    const materials = new Set<THREE.Material>();

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshCount++;
        drawCalls++;

        const geometry = child.geometry;
        if (geometry instanceof THREE.BufferGeometry) {
          const positionAttribute = geometry.getAttribute('position');
          if (positionAttribute) {
            vertexCount += positionAttribute.count;
          }

          const indexAttribute = geometry.getIndex();
          if (indexAttribute) {
            triangleCount += indexAttribute.count / 3;
          } else {
            triangleCount += vertexCount / 3;
          }
        }

        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => materials.add(mat));
        } else if (child.material) {
          materials.add(child.material);
        }
      }
    });

    materials.forEach((material) => {
      materialCount++;
      if (material instanceof THREE.MeshStandardMaterial) {
        if (material.map) textureCount.add(material.map.uuid);
        if (material.normalMap) textureCount.add(material.normalMap.uuid);
        if (material.roughnessMap) textureCount.add(material.roughnessMap.uuid);
        if (material.metalnessMap) textureCount.add(material.metalnessMap.uuid);
      }
    });

    // Calculate bone count
    let boneCount = 0;
    model.traverse((child) => {
      if (child instanceof THREE.Bone) {
        boneCount++;
      }
    });

    // Calculate animation metrics
    let totalAnimationFrames = 0;
    clips.forEach((clip) => {
      totalAnimationFrames += Math.round(clip.duration * 30); // Assume 30 FPS
    });

    // Estimate animation cost (keyframes per second per bone)
    const animationCost = Math.min(
      100,
      (totalAnimationFrames * boneCount) / 1000
    );

    // Rough memory estimation
    const vertexMemory = (vertexCount * 12) / (1024 * 1024); // 12 bytes per vertex
    const indexMemory = (triangleCount * 3 * 4) / (1024 * 1024); // 4 bytes per index
    const textureMemory = (textureCount.size * 2) / 1024; // Assume 2MB per texture
    const animationMemory = (totalAnimationFrames * boneCount * 4) / (1024 * 1024);
    const totalMemory = vertexMemory + indexMemory + textureMemory + animationMemory;

    return {
      vertexCount,
      triangleCount: Math.round(triangleCount),
      boneCount,
      animationCount: clips.length,
      totalAnimationFrames,
      memoryUsage: Math.round(totalMemory * 100) / 100,
      estimatedAnimationCost: Math.round(animationCost),
      meshCount,
      materialCount,
      textureCount: textureCount.size,
      drawCalls,
    };
  };

  const generateRecommendations = (metrics: PerformanceMetrics): OptimizationRecommendation[] => {
    const recommendations: OptimizationRecommendation[] = [];

    if (metrics.vertexCount > 100000) {
      recommendations.push({
        priority: 'high',
        title: 'Reduce Vertex Count',
        description: 'Your model has a high vertex count which may impact performance',
        potentialSavings: `${Math.round(metrics.vertexCount * 0.2)} vertices (20%)`,
      });
    }

    if (metrics.boneCount > 100) {
      recommendations.push({
        priority: 'high',
        title: 'Optimize Bone Structure',
        description: 'Consider removing unnecessary bones or merging similar bones',
        potentialSavings: `${Math.round(metrics.boneCount * 0.15)} bones (15%)`,
      });
    }

    if (metrics.estimatedAnimationCost > 50) {
      recommendations.push({
        priority: 'medium',
        title: 'Optimize Keyframe Count',
        description: 'Reduce keyframes in animations to lower memory and CPU usage',
        potentialSavings: `${Math.round(metrics.totalAnimationFrames * 0.25)} frames (25%)`,
      });
    }

    if (metrics.textureCount > 10) {
      recommendations.push({
        priority: 'medium',
        title: 'Consolidate Textures',
        description: 'Consider using texture atlases to reduce draw calls',
        potentialSavings: `${Math.round(metrics.drawCalls * 0.3)} draw calls (30%)`,
      });
    }

    if (metrics.meshCount > 50) {
      recommendations.push({
        priority: 'medium',
        title: 'Merge Meshes',
        description: 'Combine static meshes to reduce draw calls',
        potentialSavings: `${Math.round(metrics.meshCount * 0.2)} meshes (20%)`,
      });
    }

    if (metrics.memoryUsage > 50) {
      recommendations.push({
        priority: 'low',
        title: 'Overall Memory Optimization',
        description: 'Consider compression or LOD systems for large assets',
        potentialSavings: `~${Math.round(metrics.memoryUsage * 0.2)}MB (20%)`,
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500">Analyzing performance...</p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500">No model loaded</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Performance Analyzer</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <p className="text-xs text-gray-500">Vertex Count</p>
                <p className="text-lg font-bold">{metrics.vertexCount.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <p className="text-xs text-gray-500">Triangle Count</p>
                <p className="text-lg font-bold">{metrics.triangleCount.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <p className="text-xs text-gray-500">Mesh Count</p>
                <p className="text-lg font-bold">{metrics.meshCount}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <p className="text-xs text-gray-500">Draw Calls</p>
                <p className="text-lg font-bold">{metrics.drawCalls}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <p className="text-xs text-gray-500">Materials</p>
                <p className="text-lg font-bold">{metrics.materialCount}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <p className="text-xs text-gray-500">Textures</p>
                <p className="text-lg font-bold">{metrics.textureCount}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="memory" className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <p className="text-xs text-gray-500">Bone Count</p>
                <p className="text-lg font-bold">{metrics.boneCount}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <p className="text-xs text-gray-500">Animation Count</p>
                <p className="text-lg font-bold">{metrics.animationCount}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <p className="text-xs text-gray-500">Total Frames</p>
                <p className="text-lg font-bold">{metrics.totalAnimationFrames.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <p className="text-xs text-gray-500">Animation Cost</p>
                <p className="text-lg font-bold">{metrics.estimatedAnimationCost}%</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded">
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Estimated Memory Usage</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-300">
                {metrics.memoryUsage.toFixed(2)} MB
              </p>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-3 mt-4">
            {recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border-l-4 ${
                      rec.priority === 'high'
                        ? 'bg-red-50 dark:bg-red-950 border-red-500'
                        : rec.priority === 'medium'
                          ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-500'
                          : 'bg-blue-50 dark:bg-blue-950 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium">{rec.title}</p>
                      <Badge
                        variant={
                          rec.priority === 'high'
                            ? 'destructive'
                            : rec.priority === 'medium'
                              ? 'secondary'
                              : 'outline'
                        }
                        className="text-xs"
                      >
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {rec.description}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <TrendingDown className="w-3 h-3" />
                      {rec.potentialSavings}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No optimization recommendations at this time</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PerformanceAnalyzer;
