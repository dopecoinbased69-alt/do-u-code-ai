# Animation Analyzer - Implementation Guide

## Overview

The AI 3D Animation Analyzer is a comprehensive web-based platform built with React, Three.js, and TypeScript. This guide explains the architecture, key components, and how to extend the system.

## Architecture

### High-Level Design

The application follows a modular architecture with clear separation of concerns:

- **Presentation Layer**: React components using shadcn/ui
- **Visualization Layer**: Three.js for 3D rendering
- **Analysis Layer**: Algorithms for rig, animation, and quality analysis
- **State Management**: React hooks for local state
- **Routing**: React Router for page navigation

### Component Hierarchy

```
AnimationAnalyzerPage (Main Container)
├── ResizablePanelGroup (Layout)
│   ├── AssetLoader (Left Panel)
│   ├── Viewport3D (Center Panel)
│   │   └── ModelViewer (Three.js Canvas)
│   └── Analysis Tabs (Right Panel)
│       ├── RigAnalyzer
│       ├── AnimationAnalyzer
│       ├── QualityInspector
│       ├── PerformanceAnalyzer
│       └── Export Options
```

## Key Components

### Viewport3D

**Purpose**: Renders 3D models and animations using Three.js and React Three Fiber

**Key Features**:
- GLB/GLTF/FBX model loading
- Animation playback with speed control
- Skeleton visualization
- Orbit camera controls
- Environment lighting

**Implementation Details**:
- Uses `useFrame` hook for animation updates
- Manages `THREE.AnimationMixer` for animation playback
- Handles model loading asynchronously
- Supports multiple animation clips

**Usage Example**:
```typescript
<Viewport3D
  modelUrl={modelUrl}
  showSkeleton={true}
  animationIndex={selectedIndex}
  isPlaying={isPlaying}
  onModelLoaded={handleModelLoaded}
  onAnimationsLoaded={handleAnimationsLoaded}
/>
```

### AssetLoader

**Purpose**: Manages file import and asset history

**Key Features**:
- Drag-and-drop file upload
- File format validation (GLB, GLTF, FBX)
- Asset history display
- File size formatting
- Object URL management

**Implementation Details**:
- Uses HTML5 File API
- Validates file extensions
- Creates object URLs for blob data
- Manages memory with URL.revokeObjectURL

### RigAnalyzer

**Purpose**: Analyzes rigged character structure

**Analysis Metrics**:
- Bone count and hierarchy
- Symmetry detection (left/right pairing)
- Retarget compatibility scoring
- Rig integrity assessment

**Algorithm Overview**:
1. Traverse model to find skeleton
2. Build bone hierarchy tree
3. Analyze bone naming conventions
4. Calculate symmetry score
5. Check for common rigging issues

**Key Functions**:
- `findSkeleton()`: Locate THREE.Skeleton in model
- `buildBoneHierarchy()`: Recursively build bone tree
- `analyzeSymmetry()`: Detect left/right bone pairs
- `analyzeRigIntegrity()`: Check for rigging problems

### AnimationAnalyzer

**Purpose**: Analyzes animation clip properties and characteristics

**Metrics Calculated**:
- Duration and frame count
- Bone transform count
- Root motion detection
- Loop quality assessment
- Motion complexity scoring

**Analysis Process**:
1. Iterate through animation tracks
2. Count keyframes per bone
3. Detect root motion in root bone track
4. Compare first and last frames for loop quality
5. Calculate complexity from track count

### QualityInspector

**Purpose**: Detects animation quality issues

**Issue Types**:
- Foot sliding: Feet moving during contact frames
- Bone snapping: Sudden position changes
- Root drift: Character displacement
- Mesh clipping: Self-intersection
- Animation jitter: Minor motion artifacts

**Detection Methods**:
- Analyzes keyframe positions
- Compares frame-to-frame deltas
- Checks root bone displacement
- Validates bone movement patterns

### PerformanceAnalyzer

**Purpose**: Measures asset performance metrics

**Metrics Tracked**:
- Vertex and triangle count
- Bone count
- Material and texture count
- Draw calls
- Memory usage estimation
- Animation cost

**Calculation Methods**:
- Traverses geometry for vertex/triangle count
- Counts bones in skeleton
- Analyzes materials and textures
- Estimates memory from geometry size
- Calculates animation cost from keyframe count

### MotionClassifier

**Purpose**: Classifies animation types using characteristics

**Classification Types**:
- Idle: Minimal movement, short duration
- Walk: Cyclic with root motion
- Run: High-speed cyclic
- Jump: Vertical motion
- Attack: Combat action
- Climb: Vertical progression
- Custom: User-defined

**Classification Logic**:
1. Extract animation characteristics
2. Match against known patterns
3. Calculate confidence score
4. Return top matches

### OptimizationEngine

**Purpose**: Recommends and applies optimizations

**Optimization Strategies**:
- Keyframe reduction
- Bone reduction
- Animation compression
- Mesh optimization
- Texture atlasing
- LOD system

**Strategy Scoring**:
- Impact: High/Medium/Low
- Difficulty: Easy/Medium/Hard
- Estimated savings: Vertices, bones, keyframes, memory

### MotionGenerator

**Purpose**: Generates new animations from prompts

**Features**:
- Natural language input
- Suggested prompt templates
- Generation status tracking
- Animation history

**Future Enhancement**:
- Integration with AI models (Gemini, GPT)
- Motion library matching
- Rig-compatible synthesis

## Data Flow

### Model Loading Flow

```
User selects file
    ↓
AssetLoader validates format
    ↓
Creates Object URL
    ↓
Passes to Viewport3D
    ↓
GLTFLoader/FBXLoader loads model
    ↓
Extract animations and skeleton
    ↓
Trigger onModelLoaded callback
    ↓
Analyzers process model
```

### Analysis Flow

```
Model loaded
    ↓
RigAnalyzer extracts skeleton
    ↓
AnimationAnalyzer processes clips
    ↓
QualityInspector checks issues
    ↓
PerformanceAnalyzer calculates metrics
    ↓
MotionClassifier identifies types
    ↓
Display results in UI
```

## State Management

### Local State (React Hooks)

The application uses React hooks for state management:

```typescript
// AnimationAnalyzerPage.tsx
const [modelUrl, setModelUrl] = useState<string>();
const [model, setModel] = useState<THREE.Group>();
const [animations, setAnimations] = useState<THREE.AnimationClip[]>([]);
const [selectedAnimationIndex, setSelectedAnimationIndex] = useState(0);
const [isPlaying, setIsPlaying] = useState(false);
const [animationSpeed, setAnimationSpeed] = useState(1);
```

### Component Props

Props are used for communication between components:

```typescript
// Parent to Child
<RigAnalyzer model={model} />

// Child to Parent
onAnimationSelect={(index) => setSelectedAnimationIndex(index)}
```

## Styling

The application uses TailwindCSS for styling with a dark mode support:

- **Color Scheme**: Gray-based with blue accents
- **Components**: shadcn/ui for consistent design
- **Responsive**: Resizable panels for flexible layout
- **Dark Mode**: Automatic detection and support

## Performance Optimization

### Rendering Optimization
- Three.js handles efficient 3D rendering
- React Three Fiber manages component lifecycle
- Memoization for expensive calculations
- Lazy loading for large models

### Memory Management
- Object URLs are revoked after use
- Three.js geometries are properly disposed
- Animation mixers are cleaned up
- References are cleared on unmount

### Code Splitting
- Components are modular and independently loadable
- Large models are handled asynchronously
- Analysis runs without blocking UI

## Extension Points

### Adding New Analysis Tools

1. **Create Component**: `src/components/animation-analyzer/NewAnalyzer.tsx`
2. **Implement Analysis**: Add analysis logic
3. **Add to Page**: Import and add tab to AnimationAnalyzerPage
4. **Update Index**: Export from index.ts

### Adding New Visualization Modes

1. **Define Mode**: Add to VisualizationModes component
2. **Implement Rendering**: Add Three.js visualization code
3. **Connect to Viewport**: Update Viewport3D to render mode
4. **Add Controls**: Create UI controls for the mode

### Integrating AI Features

1. **Connect API**: Use Gemini or OpenAI API
2. **Add Prompting**: Create prompt templates
3. **Process Results**: Parse and validate responses
4. **Update UI**: Display generated content

## Testing

### Unit Testing
- Test analysis algorithms with sample data
- Verify calculations and edge cases
- Mock Three.js objects

### Integration Testing
- Test component interactions
- Verify data flow between components
- Test file loading and processing

### Manual Testing
- Load various model formats
- Test with different animation types
- Verify performance metrics
- Check export functionality

## Deployment

### Build Process
```bash
npm run build
```

### Output
- Optimized JavaScript bundle
- CSS files
- Static assets
- HTML entry point

### Hosting
- Deploy to Vercel, Netlify, or similar
- Serve from CDN for performance
- Enable compression and caching

## Troubleshooting

### Common Issues

**Model Won't Load**
- Check file format and size
- Verify file is not corrupted
- Check browser console for errors

**Animations Not Showing**
- Verify animations are in the file
- Check animation names
- Ensure skeleton is present

**Performance Issues**
- Reduce model complexity
- Disable unnecessary visualizations
- Check browser memory usage

**Export Not Working**
- Verify data is available
- Check browser download settings
- Check file permissions

## Future Enhancements

### Planned Features
- Cloud-based processing for large models
- Collaborative review tools
- Advanced motion matching
- Physics-assisted animation
- Motion capture import
- Multi-character analysis

### Technical Improvements
- WebGL 2.0 for better performance
- Web Workers for background processing
- IndexedDB for asset caching
- Service Workers for offline support

## References

- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [React Documentation](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
