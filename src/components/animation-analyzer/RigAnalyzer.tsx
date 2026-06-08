import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface RigAnalysis {
  boneCount: number;
  rootBone: string | null;
  maxDepth: number;
  symmetry: {
    isSymmetrical: boolean;
    leftBones: string[];
    rightBones: string[];
    unpaired: string[];
  };
  boneHierarchy: BoneNode[];
  rigIntegrity: {
    score: number;
    issues: string[];
    warnings: string[];
  };
  retargetCompatibility: {
    score: number;
    compatible: boolean;
    missingBones: string[];
  };
}

interface BoneNode {
  name: string;
  position: [number, number, number];
  children: BoneNode[];
  boneIndex?: number;
}

const RigAnalyzer: React.FC<{ model?: THREE.Group }> = ({ model }) => {
  const [analysis, setAnalysis] = useState<RigAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!model) return;
    analyzeRig(model);
  }, [model]);

  const analyzeRig = async (model: THREE.Group) => {
    setLoading(true);
    try {
      const skeleton = findSkeleton(model);
      if (!skeleton) {
        setAnalysis(null);
        setLoading(false);
        return;
      }

      const bones = skeleton.bones;
      const rootBone = bones[0];
      const boneHierarchy = buildBoneHierarchy(rootBone);
      const maxDepth = calculateMaxDepth(boneHierarchy);
      const symmetry = analyzeSymmetry(bones);
      const rigIntegrity = analyzeRigIntegrity(bones, skeleton);
      const retargetCompatibility = analyzeRetargetCompatibility(bones);

      setAnalysis({
        boneCount: bones.length,
        rootBone: rootBone?.name || 'Unknown',
        maxDepth,
        symmetry,
        boneHierarchy: [boneHierarchy],
        rigIntegrity,
        retargetCompatibility,
      });
    } catch (error) {
      console.error('Error analyzing rig:', error);
    } finally {
      setLoading(false);
    }
  };

  const findSkeleton = (object: THREE.Object3D): THREE.Skeleton | null => {
    let skeleton: THREE.Skeleton | null = null;

    object.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.skeleton) {
        skeleton = child.skeleton;
      }
    });

    return skeleton;
  };

  const buildBoneHierarchy = (bone: THREE.Bone | THREE.Object3D): BoneNode => {
    return {
      name: bone.name,
      position: [bone.position.x, bone.position.y, bone.position.z],
      children: bone.children
        .filter((child) => child instanceof THREE.Bone)
        .map((child) => buildBoneHierarchy(child)),
    };
  };

  const calculateMaxDepth = (node: BoneNode): number => {
    if (node.children.length === 0) return 1;
    return 1 + Math.max(...node.children.map(calculateMaxDepth));
  };

  const analyzeSymmetry = (bones: THREE.Bone[]) => {
    const leftBones: string[] = [];
    const rightBones: string[] = [];
    const unpaired: string[] = [];

    bones.forEach((bone) => {
      const name = bone.name.toLowerCase();
      if (name.includes('left') || name.includes('l_')) {
        leftBones.push(bone.name);
      } else if (name.includes('right') || name.includes('r_')) {
        rightBones.push(bone.name);
      } else if (!name.includes('spine') && !name.includes('root') && !name.includes('armature')) {
        unpaired.push(bone.name);
      }
    });

    const isSymmetrical = leftBones.length === rightBones.length && unpaired.length < bones.length * 0.2;

    return {
      isSymmetrical,
      leftBones,
      rightBones,
      unpaired,
    };
  };

  const analyzeRigIntegrity = (bones: THREE.Bone[], skeleton: THREE.Skeleton) => {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Check for disconnected bones
    bones.forEach((bone) => {
      if (bone.children.length === 0 && bone.name.toLowerCase().includes('end')) {
        // End bones are expected to have no children
      } else if (bone.children.length === 0 && !bone.name.toLowerCase().includes('tip')) {
        warnings.push(`Bone "${bone.name}" has no children`);
        score -= 5;
      }
    });

    // Check for extreme bone scales
    bones.forEach((bone) => {
      const scale = Math.max(bone.scale.x, bone.scale.y, bone.scale.z);
      if (scale > 2 || scale < 0.1) {
        warnings.push(`Bone "${bone.name}" has unusual scale: ${scale.toFixed(2)}`);
        score -= 3;
      }
    });

    // Check bone count
    if (bones.length < 10) {
      warnings.push('Rig has very few bones (< 10)');
      score -= 10;
    } else if (bones.length > 200) {
      warnings.push('Rig has many bones (> 200), may impact performance');
      score -= 5;
    }

    score = Math.max(0, Math.min(100, score));

    return {
      score,
      issues,
      warnings,
    };
  };

  const analyzeRetargetCompatibility = (bones: THREE.Bone[]) => {
    const requiredBones = [
      'Armature',
      'Root',
      'Spine',
      'Chest',
      'Neck',
      'Head',
      'LeftShoulder',
      'LeftArm',
      'LeftForeArm',
      'LeftHand',
      'RightShoulder',
      'RightArm',
      'RightForeArm',
      'RightHand',
      'LeftUpLeg',
      'LeftLeg',
      'LeftFoot',
      'RightUpLeg',
      'RightLeg',
      'RightFoot',
    ];

    const boneNames = bones.map((b) => b.name.toLowerCase());
    const missingBones: string[] = [];
    let foundCount = 0;

    requiredBones.forEach((bone) => {
      if (boneNames.some((name) => name.includes(bone.toLowerCase()))) {
        foundCount++;
      } else {
        missingBones.push(bone);
      }
    });

    const score = (foundCount / requiredBones.length) * 100;
    const compatible = score >= 70;

    return {
      score: Math.round(score),
      compatible,
      missingBones,
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500">Analyzing rig...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500">No rigged model loaded</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Rig Analyzer</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="symmetry">Symmetry</TabsTrigger>
            <TabsTrigger value="integrity">Integrity</TabsTrigger>
            <TabsTrigger value="retarget">Retarget</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <p className="text-xs text-gray-500">Bone Count</p>
                <p className="text-lg font-bold">{analysis.boneCount}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <p className="text-xs text-gray-500">Max Depth</p>
                <p className="text-lg font-bold">{analysis.maxDepth}</p>
              </div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
              <p className="text-xs text-gray-500">Root Bone</p>
              <p className="text-sm font-medium">{analysis.rootBone}</p>
            </div>
          </TabsContent>

          <TabsContent value="symmetry" className="space-y-3 mt-4">
            <div className="flex items-center gap-2 mb-3">
              {analysis.symmetry.isSymmetrical ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Symmetrical</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Asymmetrical</span>
                </>
              )}
            </div>
            <div>
              <p className="text-xs font-medium mb-2">Left Bones ({analysis.symmetry.leftBones.length})</p>
              <div className="space-y-1">
                {analysis.symmetry.leftBones.slice(0, 5).map((bone) => (
                  <p key={bone} className="text-xs text-gray-600">
                    {bone}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium mb-2">Right Bones ({analysis.symmetry.rightBones.length})</p>
              <div className="space-y-1">
                {analysis.symmetry.rightBones.slice(0, 5).map((bone) => (
                  <p key={bone} className="text-xs text-gray-600">
                    {bone}
                  </p>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="integrity" className="space-y-3 mt-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium">Integrity Score</p>
                <Badge variant={analysis.rigIntegrity.score >= 80 ? 'default' : 'secondary'}>
                  {analysis.rigIntegrity.score}%
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${analysis.rigIntegrity.score}%` }}
                />
              </div>
            </div>
            {analysis.rigIntegrity.warnings.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Warnings
                </p>
                <div className="space-y-1">
                  {analysis.rigIntegrity.warnings.map((warning, i) => (
                    <p key={i} className="text-xs text-yellow-600 dark:text-yellow-400">
                      • {warning}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="retarget" className="space-y-3 mt-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium">Compatibility Score</p>
                <Badge variant={analysis.retargetCompatibility.compatible ? 'default' : 'secondary'}>
                  {analysis.retargetCompatibility.score}%
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${analysis.retargetCompatibility.score}%` }}
                />
              </div>
            </div>
            {analysis.retargetCompatibility.missingBones.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2">Missing Bones</p>
                <div className="space-y-1">
                  {analysis.retargetCompatibility.missingBones.slice(0, 5).map((bone) => (
                    <p key={bone} className="text-xs text-red-600 dark:text-red-400">
                      • {bone}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RigAnalyzer;
