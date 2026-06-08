import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface GeneratedAnimation {
  id: string;
  prompt: string;
  status: 'generating' | 'completed' | 'failed';
  generatedAt: Date;
  duration?: number;
  preview?: string;
}

interface MotionGeneratorProps {
  onAnimationGenerated?: (animation: GeneratedAnimation) => void;
}

const MotionGenerator: React.FC<MotionGeneratorProps> = ({ onAnimationGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedAnimations, setGeneratedAnimations] = useState<GeneratedAnimation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const suggestedPrompts = [
    'Walk while injured',
    'Heavy armored run',
    'Stealth crouch movement',
    'Idle with nervous fidgeting',
    'Combat roll dodge',
    'Climbing a rope',
    'Swimming motion',
    'Falling animation',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a motion description');
      return;
    }

    setIsGenerating(true);

    const animation: GeneratedAnimation = {
      id: Math.random().toString(36).substr(2, 9),
      prompt,
      status: 'generating',
      generatedAt: new Date(),
    };

    setGeneratedAnimations([animation, ...generatedAnimations]);

    try {
      // Simulate AI generation process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update animation status
      setGeneratedAnimations((prev) =>
        prev.map((anim) =>
          anim.id === animation.id
            ? {
                ...anim,
                status: 'completed',
                duration: Math.random() * 2 + 0.5,
              }
            : anim
        )
      );

      if (onAnimationGenerated) {
        onAnimationGenerated({
          ...animation,
          status: 'completed',
          duration: Math.random() * 2 + 0.5,
        });
      }

      toast.success('Animation generated successfully');
      setPrompt('');
    } catch (error) {
      setGeneratedAnimations((prev) =>
        prev.map((anim) =>
          anim.id === animation.id ? { ...anim, status: 'failed' } : anim
        )
      );
      toast.error('Failed to generate animation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestedPrompt = (suggestedPrompt: string) => {
    setPrompt(suggestedPrompt);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Motion Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto flex flex-col gap-4">
        {/* Input Section */}
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Motion Description</label>
            <Input
              placeholder="Describe the animation you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isGenerating) {
                  handleGenerate();
                }
              }}
              disabled={isGenerating}
              className="text-sm"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Generate Animation
              </>
            )}
          </Button>
        </div>

        {/* Suggested Prompts */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Suggested Prompts
          </p>
          <div className="grid grid-cols-2 gap-2">
            {suggestedPrompts.map((suggestedPrompt, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedPrompt(suggestedPrompt)}
                disabled={isGenerating}
                className="text-left p-2 text-xs bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
              >
                {suggestedPrompt}
              </button>
            ))}
          </div>
        </div>

        {/* Generated Animations List */}
        {generatedAnimations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Generated Animations
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {generatedAnimations.map((anim) => (
                <div
                  key={anim.id}
                  className="p-3 bg-gray-50 dark:bg-gray-900 rounded border"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium truncate">{anim.prompt}</p>
                    {anim.status === 'generating' && (
                      <Badge variant="secondary" className="text-xs">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Generating
                      </Badge>
                    )}
                    {anim.status === 'completed' && (
                      <Badge variant="default" className="text-xs">
                        Ready
                      </Badge>
                    )}
                    {anim.status === 'failed' && (
                      <Badge variant="destructive" className="text-xs">
                        Failed
                      </Badge>
                    )}
                  </div>
                  {anim.duration && (
                    <p className="text-xs text-gray-500">
                      Duration: {anim.duration.toFixed(2)}s
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-auto p-3 bg-blue-50 dark:bg-blue-950 rounded text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p className="font-medium">How it works:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Describe your desired animation in natural language</li>
            <li>AI generates motion based on existing motion libraries</li>
            <li>Animations are optimized for your character rig</li>
            <li>Export and use in your project</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default MotionGenerator;
