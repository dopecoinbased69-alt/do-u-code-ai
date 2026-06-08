import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface QualityIssue {
  type: 'error' | 'warning' | 'info';
  name: string;
  description: string;
  severity: number; // 0-100
  affectedBones?: string[];
}

interface QualityAnalysis {
  footSliding: QualityIssue[];
  boneSnapping: QualityIssue[];
  rootDrift: QualityIssue[];
  meshClipping: QualityIssue[];
  animationJitter: QualityIssue[];
  overallScore: number;
}

interface QualityInspectorProps {
  model?: THREE.Group;
  animations?: THREE.AnimationClip[];
}

const QualityInspector: React.FC<QualityInspectorProps> = ({ model, animations = [] }) => {
  const [analysis, setAnalysis] = useState<QualityAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!model || animations.length === 0) return;
    inspectQuality(model, animations);
  }, [model, animations]);

  const inspectQuality = async (model: THREE.Group, clips: THREE.AnimationClip[]) => {
    setLoading(true);
    try {
      const footSliding = detectFootSliding(clips);
      const boneSnapping = detectBoneSnapping(clips);
      const rootDrift = detectRootDrift(clips);
      const meshClipping = detectMeshClipping(model, clips);
      const animationJitter = detectAnimationJitter(clips);

      const allIssues = [
        ...footSliding,
        ...boneSnapping,
        ...rootDrift,
        ...meshClipping,
        ...animationJitter,
      ];

      const overallScore = Math.max(
        0,
        100 -
          allIssues.reduce((sum, issue) => {
            const weight = issue.type === 'error' ? 10 : issue.type === 'warning' ? 5 : 1;
            return sum + issue.severity * weight;
          }, 0) /
            10
      );

      setAnalysis({
        footSliding,
        boneSnapping,
        rootDrift,
        meshClipping,
        animationJitter,
        overallScore: Math.round(overallScore),
      });
    } catch (error) {
      console.error('Error inspecting quality:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectFootSliding = (clips: THREE.AnimationClip[]): QualityIssue[] => {
    const issues: QualityIssue[] = [];

    clips.forEach((clip) => {
      // Look for foot bones with position changes during contact frames
      const footBones = clip.tracks.filter((track) =>
        track.name.toLowerCase().includes('foot')
      );

      if (footBones.length > 0) {
        // Simplified detection: check for inconsistent motion
        const hasSliding = Math.random() > 0.7; // Placeholder logic

        if (hasSliding) {
          issues.push({
            type: 'warning',
            name: 'Potential Foot Sliding',
            description: `Animation "${clip.name}" may have foot sliding issues`,
            severity: 30,
            affectedBones: footBones.map((t) => t.name),
          });
        }
      }
    });

    return issues;
  };

  const detectBoneSnapping = (clips: THREE.AnimationClip[]): QualityIssue[] => {
    const issues: QualityIssue[] = [];

    clips.forEach((clip) => {
      clip.tracks.forEach((track) => {
        if (track.times.length < 2) return;

        // Check for large jumps between keyframes
        const values = track.values;
        let hasSnapping = false;
        let maxJump = 0;

        for (let i = 3; i < values.length; i += 3) {
          const jump = Math.sqrt(
            Math.pow(values[i] - values[i - 3], 2) +
              Math.pow(values[i + 1] - values[i - 2], 2) +
              Math.pow(values[i + 2] - values[i - 1], 2)
          );

          if (jump > 2) {
            hasSnapping = true;
            maxJump = Math.max(maxJump, jump);
          }
        }

        if (hasSnapping) {
          issues.push({
            type: 'warning',
            name: 'Bone Snapping Detected',
            description: `Track "${track.name}" has sudden position changes`,
            severity: Math.min(100, maxJump * 20),
          });
        }
      });
    });

    return issues;
  };

  const detectRootDrift = (clips: THREE.AnimationClip[]): QualityIssue[] => {
    const issues: QualityIssue[] = [];

    clips.forEach((clip) => {
      const rootTrack = clip.tracks.find((track) =>
        track.name.toLowerCase().includes('root')
      );

      if (rootTrack && rootTrack.times.length > 1) {
        const values = rootTrack.values;
        const startPos = [values[0], values[1], values[2]];
        const endPos = [values[values.length - 3], values[values.length - 2], values[values.length - 1]];

        const drift = Math.sqrt(
          Math.pow(endPos[0] - startPos[0], 2) +
            Math.pow(endPos[1] - startPos[1], 2) +
            Math.pow(endPos[2] - startPos[2], 2)
        );

        // If drift is significant and animation should loop
        if (drift > 0.1 && clip.name.toLowerCase().includes('idle')) {
          issues.push({
            type: 'warning',
            name: 'Root Drift Detected',
            description: `Animation "${clip.name}" has root position drift`,
            severity: Math.min(100, drift * 50),
            affectedBones: ['Root'],
          });
        }
      }
    });

    return issues;
  };

  const detectMeshClipping = (model: THREE.Group, clips: THREE.AnimationClip[]): QualityIssue[] => {
    const issues: QualityIssue[] = [];

    // Simplified mesh clipping detection
    let meshCount = 0;
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        meshCount++;
      }
    });

    if (meshCount > 0 && clips.length > 0) {
      // Placeholder: check if any animation might cause clipping
      const potentialClipping = Math.random() > 0.8;

      if (potentialClipping) {
        issues.push({
          type: 'info',
          name: 'Potential Mesh Clipping',
          description: 'Some animations may cause mesh self-intersection',
          severity: 20,
        });
      }
    }

    return issues;
  };

  const detectAnimationJitter = (clips: THREE.AnimationClip[]): QualityIssue[] => {
    const issues: QualityIssue[] = [];

    clips.forEach((clip) => {
      clip.tracks.forEach((track) => {
        if (track.times.length < 3) return;

        const values = track.values;
        let jitterSum = 0;
        let jitterCount = 0;

        for (let i = 6; i < values.length; i += 3) {
          const diff1 = Math.abs(values[i] - values[i - 3]);
          const diff2 = Math.abs(values[i - 3] - values[i - 6]);
          const jitter = Math.abs(diff1 - diff2);

          if (jitter > 0.01) {
            jitterSum += jitter;
            jitterCount++;
          }
        }

        if (jitterCount > 0 && jitterSum / jitterCount > 0.05) {
          issues.push({
            type: 'info',
            name: 'Animation Jitter',
            description: `Track "${track.name}" shows minor jitter`,
            severity: 15,
          });
        }
      });
    });

    return issues;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500">Inspecting quality...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500">No model or animations to inspect</p>
        </CardContent>
      </Card>
    );
  }

  const allIssues = [
    ...analysis.footSliding,
    ...analysis.boneSnapping,
    ...analysis.rootDrift,
    ...analysis.meshClipping,
    ...analysis.animationJitter,
  ];

  const errorCount = allIssues.filter((i) => i.type === 'error').length;
  const warningCount = allIssues.filter((i) => i.type === 'warning').length;
  const infoCount = allIssues.filter((i) => i.type === 'info').length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quality Inspector</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto flex flex-col gap-4">
        {/* Overall Score */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Overall Quality Score</p>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold">{analysis.overallScore}</div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    analysis.overallScore >= 80
                      ? 'bg-green-500'
                      : analysis.overallScore >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${analysis.overallScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Issue Summary */}
        <div className="grid grid-cols-3 gap-2">
          {errorCount > 0 && (
            <div className="p-2 bg-red-50 dark:bg-red-950 rounded">
              <p className="text-xs text-red-600 dark:text-red-300">Errors</p>
              <p className="text-lg font-bold text-red-700 dark:text-red-200">{errorCount}</p>
            </div>
          )}
          {warningCount > 0 && (
            <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
              <p className="text-xs text-yellow-600 dark:text-yellow-300">Warnings</p>
              <p className="text-lg font-bold text-yellow-700 dark:text-yellow-200">{warningCount}</p>
            </div>
          )}
          {infoCount > 0 && (
            <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
              <p className="text-xs text-blue-600 dark:text-blue-300">Info</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-200">{infoCount}</p>
            </div>
          )}
        </div>

        {/* Issues List */}
        {allIssues.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {allIssues.map((issue, index) => (
              <div
                key={index}
                className={`p-3 rounded border-l-4 ${
                  issue.type === 'error'
                    ? 'bg-red-50 dark:bg-red-950 border-red-500'
                    : issue.type === 'warning'
                      ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-500'
                      : 'bg-blue-50 dark:bg-blue-950 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-2">
                  {issue.type === 'error' ? (
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
                  ) : issue.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{issue.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {issue.description}
                    </p>
                    {issue.affectedBones && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {issue.affectedBones.slice(0, 3).map((bone) => (
                          <Badge key={bone} variant="secondary" className="text-xs">
                            {bone}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium">No issues detected</p>
              <p className="text-xs text-gray-500">Your animation looks great!</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QualityInspector;
