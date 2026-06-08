import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface MotionClassification {
  animationName: string;
  classifications: {
    type: string;
    confidence: number;
    characteristics: string[];
  }[];
}

interface MotionClassifierProps {
  animations?: THREE.AnimationClip[];
}

const MotionClassifier: React.FC<MotionClassifierProps> = ({ animations = [] }) => {
  const [classifications, setClassifications] = useState<MotionClassification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (animations.length === 0) return;
    classifyMotions(animations);
  }, [animations]);

  const classifyMotions = async (clips: THREE.AnimationClip[]) => {
    setLoading(true);
    try {
      const results = clips.map((clip) => classifyAnimation(clip));
      setClassifications(results);
    } catch (error) {
      console.error('Error classifying motions:', error);
    } finally {
      setLoading(false);
    }
  };

  const classifyAnimation = (clip: THREE.AnimationClip): MotionClassification => {
    const name = clip.name.toLowerCase();
    const duration = clip.duration;
    const trackCount = clip.tracks.length;

    // Analyze motion characteristics
    let hasRootMotion = false;
    let hasRotation = false;
    let hasScale = false;
    let boneMovement = 0;

    clip.tracks.forEach((track) => {
      const trackName = track.name.toLowerCase();

      if (trackName.includes('root') || trackName.includes('armature')) {
        hasRootMotion = true;
      }

      if (track instanceof THREE.QuaternionKeyframeTrack) {
        hasRotation = true;
      }

      if (track instanceof THREE.VectorKeyframeTrack && trackName.includes('scale')) {
        hasScale = true;
      }

      if (track instanceof THREE.VectorKeyframeTrack && trackName.includes('position')) {
        boneMovement += track.times.length;
      }
    });

    const classifications = classifyByCharacteristics(
      name,
      duration,
      trackCount,
      hasRootMotion,
      hasRotation,
      boneMovement
    );

    return {
      animationName: clip.name,
      classifications,
    };
  };

  const classifyByCharacteristics = (
    name: string,
    duration: number,
    trackCount: number,
    hasRootMotion: boolean,
    hasRotation: boolean,
    boneMovement: number
  ) => {
    const classifications: MotionClassification['classifications'] = [];

    // Idle classification
    if (
      (name.includes('idle') || name.includes('stand')) &&
      duration < 3 &&
      boneMovement < 50
    ) {
      classifications.push({
        type: 'Idle',
        confidence: 95,
        characteristics: ['Minimal movement', 'Short duration', 'Loopable'],
      });
    }

    // Walk classification
    if (
      (name.includes('walk') || name.includes('walk_')) &&
      hasRootMotion &&
      duration > 0.5 &&
      duration < 2
    ) {
      classifications.push({
        type: 'Walk',
        confidence: 90,
        characteristics: ['Root motion', 'Cyclic', 'Moderate speed'],
      });
    }

    // Run classification
    if (
      (name.includes('run') || name.includes('sprint')) &&
      hasRootMotion &&
      duration < 1.5
    ) {
      classifications.push({
        type: 'Run',
        confidence: 92,
        characteristics: ['Root motion', 'High speed', 'Cyclic'],
      });
    }

    // Jump classification
    if (name.includes('jump') && duration < 1 && hasRootMotion) {
      classifications.push({
        type: 'Jump',
        confidence: 88,
        characteristics: ['Vertical motion', 'Short duration', 'Non-cyclic'],
      });
    }

    // Attack classification
    if (
      (name.includes('attack') || name.includes('punch') || name.includes('slash')) &&
      duration < 1.5
    ) {
      classifications.push({
        type: 'Attack',
        confidence: 85,
        characteristics: ['Combat motion', 'Rapid movement', 'Non-cyclic'],
      });
    }

    // Climb classification
    if (name.includes('climb') && hasRootMotion && duration > 1) {
      classifications.push({
        type: 'Climb',
        confidence: 80,
        characteristics: ['Vertical movement', 'Complex motion', 'Cyclic'],
      });
    }

    // Fallback: Generic classification based on characteristics
    if (classifications.length === 0) {
      let confidence = 50;
      const characteristics: string[] = [];

      if (hasRootMotion) {
        characteristics.push('Root motion');
        confidence += 15;
      }

      if (duration < 0.5) {
        characteristics.push('Quick action');
        confidence += 10;
      } else if (duration > 3) {
        characteristics.push('Long duration');
        confidence += 5;
      }

      if (boneMovement > 100) {
        characteristics.push('Complex motion');
        confidence += 10;
      }

      classifications.push({
        type: 'Custom Motion',
        confidence: Math.min(100, confidence),
        characteristics: characteristics.length > 0 ? characteristics : ['Custom animation'],
      });
    }

    return classifications;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500">Classifying motions...</p>
        </CardContent>
      </Card>
    );
  }

  if (classifications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-500">No animations to classify</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Motion Classifier</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-4">
        {classifications.map((classification, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <p className="font-medium text-sm">{classification.animationName}</p>
            </div>

            {classification.classifications.map((cls, clsIndex) => (
              <div key={clsIndex} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">
                      {cls.type}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {cls.confidence}% confidence
                    </span>
                  </div>
                </div>

                <Progress value={cls.confidence} className="h-2" />

                <div className="flex flex-wrap gap-1">
                  {cls.characteristics.map((char, charIndex) => (
                    <Badge
                      key={charIndex}
                      variant="secondary"
                      className="text-xs"
                    >
                      {char}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MotionClassifier;
