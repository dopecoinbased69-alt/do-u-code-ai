import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bone,
  Grid3x3,
  Zap,
  Eye,
  Layers,
  Palette,
} from 'lucide-react';

interface VisualizationMode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface VisualizationModesProps {
  onVisualizationChange?: (modes: VisualizationMode[]) => void;
}

const VisualizationModes: React.FC<VisualizationModesProps> = ({ onVisualizationChange }) => {
  const [modes, setModes] = useState<VisualizationMode[]>([
    {
      id: 'skeleton',
      name: 'Skeleton View',
      description: 'Display bone hierarchy and joint structure',
      icon: <Bone className="w-4 h-4" />,
      enabled: true,
    },
    {
      id: 'wireframe',
      name: 'Wireframe View',
      description: 'Show mesh wireframe for topology inspection',
      icon: <Grid3x3 className="w-4 h-4" />,
      enabled: false,
    },
    {
      id: 'motion-trails',
      name: 'Motion Trails',
      description: 'Visualize bone motion paths and trajectories',
      icon: <Zap className="w-4 h-4" />,
      enabled: false,
    },
    {
      id: 'root-motion',
      name: 'Root Motion View',
      description: 'Highlight root bone movement and displacement',
      icon: <Eye className="w-4 h-4" />,
      enabled: false,
    },
    {
      id: 'bone-influence',
      name: 'Bone Influence View',
      description: 'Show skin weight and bone influence on mesh',
      icon: <Layers className="w-4 h-4" />,
      enabled: false,
    },
    {
      id: 'heatmap',
      name: 'Motion Heatmap',
      description: 'Visualize animation intensity and movement speed',
      icon: <Palette className="w-4 h-4" />,
      enabled: false,
    },
  ]);

  const toggleMode = (modeId: string) => {
    const updated = modes.map((mode) =>
      mode.id === modeId ? { ...mode, enabled: !mode.enabled } : mode
    );
    setModes(updated);
    if (onVisualizationChange) {
      onVisualizationChange(updated);
    }
  };

  const enabledCount = modes.filter((m) => m.enabled).length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Visualization Modes</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto flex flex-col gap-4">
        {/* Summary */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
          <p className="text-sm font-medium">
            {enabledCount} of {modes.length} visualization{enabledCount !== 1 ? 's' : ''} active
          </p>
        </div>

        {/* Visualization Modes */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All Modes</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-2 mt-4">
            {modes.map((mode) => (
              <div
                key={mode.id}
                className={`p-3 border rounded-lg transition-colors ${
                  mode.enabled
                    ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1 text-gray-600 dark:text-gray-400">
                      {mode.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{mode.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {mode.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={mode.enabled ? 'default' : 'outline'}
                    onClick={() => toggleMode(mode.id)}
                  >
                    {mode.enabled ? 'On' : 'Off'}
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="active" className="space-y-2 mt-4">
            {modes.filter((m) => m.enabled).length > 0 ? (
              modes
                .filter((m) => m.enabled)
                .map((mode) => (
                  <div
                    key={mode.id}
                    className="p-3 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1 text-green-600 dark:text-green-400">
                          {mode.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{mode.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {mode.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => toggleMode(mode.id)}
                      >
                        On
                      </Button>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No visualization modes active. Enable modes to see them in the viewport.
              </p>
            )}
          </TabsContent>
        </Tabs>

        {/* Tips */}
        <div className="mt-auto p-3 bg-amber-50 dark:bg-amber-950 rounded text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p className="font-medium">Tips:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Combine multiple modes for detailed analysis</li>
            <li>Motion trails help identify animation issues</li>
            <li>Heatmaps show motion intensity distribution</li>
            <li>Bone influence reveals rigging problems</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisualizationModes;
