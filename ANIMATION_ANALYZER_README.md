# AI 3D Animation Analyzer

A professional-grade web-based platform for analyzing, validating, optimizing, and generating animations for rigged 3D character models. The system combines animation engineering, procedural motion systems, and AI-driven analysis into a unified workflow.

## Features

### Core Capabilities

#### Asset Management
- **Import Formats**: GLB, GLTF, FBX
- **Export Formats**: GLB, FBX, JSON Reports
- **Asset Browser**: Drag-and-drop interface for loading 3D models
- **History**: Track recently loaded assets

#### Analysis Tools

##### Rig Analyzer
- Bone hierarchy visualization
- Joint structure analysis
- Symmetry detection (left/right bone pairing)
- Retarget compatibility scoring
- Rig integrity assessment
- Bone count and depth analysis

##### Animation Analyzer
- Duration and frame count metrics
- Frame rate analysis
- Root motion detection
- Loop quality assessment
- Bone transform tracking
- Motion complexity scoring
- Keyframe analysis

##### Quality Inspector
- **Foot Sliding Detection**: Identifies unnatural foot movement
- **Bone Snapping Detection**: Detects sudden position changes
- **Root Drift Analysis**: Measures character displacement
- **Mesh Clipping Detection**: Identifies self-intersection issues
- **Animation Jitter Detection**: Finds minor motion artifacts
- **Overall Quality Score**: Comprehensive assessment (0-100)

##### Motion Classifier
- **Idle**: Minimal movement, short duration
- **Walk**: Cyclic locomotion with root motion
- **Run**: High-speed cyclic movement
- **Jump**: Vertical motion, non-cyclic
- **Attack**: Combat actions, rapid movement
- **Climb**: Vertical progression, complex motion
- **Custom**: User-defined motion types
- Confidence scoring for each classification

##### Performance Analyzer
- Vertex and triangle count
- Bone count analysis
- Animation cost estimation
- Memory usage calculation
- Draw call optimization
- Material and texture analysis
- Optimization recommendations

#### Optimization Engine
- **Keyframe Reduction**: Remove redundant keyframes using curve fitting
- **Bone Reduction**: Merge or remove non-essential bones
- **Animation Compression**: Quantization and delta encoding
- **Mesh Optimization**: Decimation and LOD systems
- **Texture Atlasing**: Combine multiple textures
- **LOD System**: Create simplified versions for distance viewing
- Estimated savings calculation
- Optimization report generation

#### AI Motion Generator
- Natural language prompt support
- Suggested motion templates
- Animation generation from existing libraries
- Rig-compatible motion synthesis
- Generated animation history

#### Visualization Modes
- **Skeleton View**: Bone hierarchy and joint structure
- **Wireframe View**: Mesh topology inspection
- **Motion Trails**: Bone motion path visualization
- **Root Motion View**: Character displacement tracking
- **Bone Influence View**: Skin weight visualization
- **Motion Heatmap**: Animation intensity distribution

### 3D Viewport
- Real-time 3D visualization with Three.js
- Orbit controls for camera navigation
- Grid display for reference
- Skeleton visualization
- Animation playback controls
- Adjustable animation speed
- Lighting and environment presets

## Architecture

### Component Structure

```
src/components/animation-analyzer/
├── Viewport3D.tsx              # 3D visualization with Three.js
├── AssetLoader.tsx             # File import and management
├── RigAnalyzer.tsx             # Rig analysis and validation
├── AnimationAnalyzer.tsx       # Animation metrics and analysis
├── QualityInspector.tsx        # Quality issue detection
├── PerformanceAnalyzer.tsx     # Performance metrics
├── MotionClassifier.tsx        # Motion type classification
├── MotionGenerator.tsx         # AI motion generation
├── OptimizationEngine.tsx      # Optimization recommendations
├── VisualizationModes.tsx      # Visualization options
└── index.ts                    # Component exports
```

### Main Page
- **AnimationAnalyzerPage.tsx**: Integrated UI with resizable panels
  - Left Panel: Asset Browser
  - Center Panel: 3D Viewport
  - Right Panel: Analysis Tools (tabbed interface)

## Technology Stack

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type-safe development
- **Three.js**: 3D graphics
- **React Three Fiber**: React renderer for Three.js
- **React Three Drei**: Useful Three.js helpers
- **TailwindCSS**: Styling
- **shadcn/ui**: Component library
- **React Router**: Navigation
- **Zod**: Schema validation

### Build Tools
- **Vite**: Fast build tool
- **ESLint**: Code linting
- **TypeScript**: Type checking

## Usage

### Getting Started

1. **Navigate to Animation Analyzer**
   - Click the "Animation" link in the sidebar

2. **Load a 3D Model**
   - Drag and drop a GLB, GLTF, or FBX file into the Asset Browser
   - Or click "Browse Files" to select from your computer

3. **Analyze the Model**
   - **Rig Tab**: View bone hierarchy and structure analysis
   - **Animation Tab**: Select and analyze animation clips
   - **Quality Tab**: Review detected issues and quality score
   - **Performance Tab**: Check optimization opportunities

4. **Optimize and Export**
   - Select optimization strategies in the Optimization Engine
   - Export analysis report as JSON
   - Download optimized model files

### Workflow Examples

#### Validating a Rigged Character
1. Load the FBX/GLB file
2. Check Rig Analyzer for bone structure issues
3. Review retarget compatibility score
4. Examine symmetry analysis
5. Export rig report

#### Analyzing Animations
1. Load the model with animations
2. Select each animation in Animation Analyzer
3. Check loop quality and motion complexity
4. Review Quality Inspector for issues
5. Classify motions using Motion Classifier
6. Generate optimization report

#### Optimizing for Performance
1. Load the model
2. Review Performance Analyzer metrics
3. Select high-impact optimizations
4. Apply strategies and review savings
5. Export optimization report
6. Implement recommendations in your DCC tool

#### Generating New Animations
1. Load a character model
2. Open Motion Generator
3. Enter natural language description (e.g., "walk while injured")
4. AI generates motion based on description
5. Preview in viewport
6. Export generated animation

## API Reference

### Viewport3D Props
```typescript
interface Viewport3DProps {
  modelUrl?: string;              // URL to 3D model
  showSkeleton?: boolean;         // Display skeleton
  showGrid?: boolean;             // Display grid
  animationIndex?: number;        // Selected animation
  isPlaying?: boolean;            // Animation playback state
  speed?: number;                 // Animation speed multiplier
  onModelLoaded?: (model) => void;
  onAnimationsLoaded?: (clips) => void;
}
```

### RigAnalyzer Props
```typescript
interface RigAnalyzerProps {
  model?: THREE.Group;  // Loaded 3D model
}
```

### AnimationAnalyzer Props
```typescript
interface AnimationAnalyzerProps {
  animations?: THREE.AnimationClip[];
  onAnimationSelect?: (index: number) => void;
  isPlaying?: boolean;
  onPlayToggle?: (playing: boolean) => void;
}
```

## Performance Considerations

### Optimization Tips
- Use LOD (Level of Detail) for complex models
- Reduce keyframe count for animations
- Consolidate textures using atlases
- Merge static meshes
- Use bone reduction for rigs with 100+ bones

### Memory Management
- Large models (>100k vertices) may impact performance
- Consider streaming for very large assets
- Use compression for animation data
- Implement texture compression

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Keyboard Shortcuts
- **Orbit Controls**: Right-click + drag to rotate
- **Pan**: Middle-click + drag
- **Zoom**: Scroll wheel
- **Reset View**: Double-click

## Troubleshooting

### Model Won't Load
- Verify file format (GLB, GLTF, FBX)
- Check file size (max 100MB recommended)
- Ensure proper file encoding

### Animations Not Playing
- Verify animations are embedded in the model file
- Check animation names in Animation Analyzer
- Ensure model has proper skeleton

### Performance Issues
- Reduce viewport resolution
- Disable unnecessary visualization modes
- Use simpler models for testing
- Clear browser cache

## Future Roadmap

- Motion capture import support
- AI retargeting between different rigs
- Physics-assisted animation
- Collaborative review tools
- Real-time procedural animation synthesis
- Advanced motion matching
- Multi-character analysis
- Cloud-based processing

## Contributing

To extend the Animation Analyzer:

1. Add new analysis components in `src/components/animation-analyzer/`
2. Implement analysis logic in separate utility files
3. Add UI components using shadcn/ui
4. Update the main page to include new features
5. Test with various model formats

## License

This project is part of the CodeForge platform.

## Support

For issues or feature requests, please contact the development team or submit feedback through the platform.

## Changelog

### Version 1.0.0
- Initial release
- Core analysis tools
- Optimization engine
- AI motion generator
- Multiple visualization modes
- Export functionality
