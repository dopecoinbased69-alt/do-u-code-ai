import { useState, useEffect, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Play, Sparkles, Copy, RotateCcw, Eye, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <style>
    body {
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #0f172a;
      color: #00e5ff;
      font-family: 'Segoe UI', sans-serif;
    }
    h1 { font-size: 3rem; text-shadow: 0 0 30px rgba(0,229,255,0.5); }
  </style>
</head>
<body>
  <h1>Hello CodeForge ⚡</h1>
</body>
</html>`;

const TEMPLATES = {
  threejs: `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>body{margin:0;overflow:hidden}</style>
</head><body>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>
<script>
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,0.1,1000);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
document.body.appendChild(renderer.domElement);
const geo=new THREE.TorusKnotGeometry(1,0.3,100,16);
const mat=new THREE.MeshNormalMaterial();
const mesh=new THREE.Mesh(geo,mat);
scene.add(mesh);camera.position.z=4;
function animate(){requestAnimationFrame(animate);mesh.rotation.x+=0.01;mesh.rotation.y+=0.01;renderer.render(scene,camera)}
animate();
<\/script></body></html>`,
  babylon: `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>body{margin:0;overflow:hidden}canvas{width:100%;height:100%}</style>
</head><body>
<canvas id="c"></canvas>
<script src="https://cdn.babylonjs.com/babylon.js"><\/script>
<script>
const canvas=document.getElementById('c');
const engine=new BABYLON.Engine(canvas,true);
const scene=new BABYLON.Scene(engine);
const cam=new BABYLON.ArcRotateCamera('c',Math.PI/4,Math.PI/3,10,BABYLON.Vector3.Zero(),scene);
cam.attachControl(canvas,true);
new BABYLON.HemisphericLight('l',new BABYLON.Vector3(1,1,0),scene);
BABYLON.MeshBuilder.CreateSphere('s',{diameter:2},scene);
engine.runRenderLoop(()=>scene.render());
window.addEventListener('resize',()=>engine.resize());
<\/script></body></html>`,
};

export default function IDEPage() {
  const [code, setCode] = useState('');
  const [prompt, setPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [promptOpen, setPromptOpen] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('codeforge_editor_content');
    setCode(saved || DEFAULT_HTML);
  }, []);

  useEffect(() => {
    localStorage.setItem('codeforge_editor_content', code);
  }, [code]);

  const handleAIGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setAiLoading(true);
    try {
      const resp = await supabase.functions.invoke('ai-code-gen', {
        body: { prompt: prompt.trim(), currentCode: code },
      });
      if (resp.error) throw resp.error;
      const data = resp.data;
      if (data?.code) {
        setCode(data.code);
        toast({ title: 'AI Generated!', description: 'Code updated with AI response' });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ title: 'AI Error', description: err.message || 'Failed to generate', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  }, [prompt, code, toast]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied!' });
  };

  const handlePreview = () => {
    localStorage.setItem('codeforge_editor_content', code);
    navigate('/preview');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b border-border p-3 flex items-center gap-2 flex-wrap">
        <span className="font-code text-sm text-primary mr-2">IDE</span>
        <Button variant="ghost" size="sm" onClick={() => setCode(TEMPLATES.threejs)}>Three.js</Button>
        <Button variant="ghost" size="sm" onClick={() => setCode(TEMPLATES.babylon)}>Babylon.js</Button>
        <Button variant="ghost" size="sm" onClick={() => setCode(DEFAULT_HTML)}>
          <RotateCcw className="h-3 w-3" /> Reset
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={handleCopy}><Copy className="h-3 w-3" /> Copy</Button>
        <Button variant="cyber" size="sm" onClick={handlePreview}><Eye className="h-3 w-3" /> Preview</Button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={code}
          onChange={setCode}
          extensions={[html(), javascript(), css()]}
          theme={oneDark}
          height="100%"
          className="h-full text-sm"
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            autocompletion: true,
            bracketMatching: true,
            highlightActiveLine: true,
          }}
        />
      </div>

      {/* AI Prompt */}
      <div className="border-t border-border">
        <button
          onClick={() => setPromptOpen(!promptOpen)}
          className="w-full flex items-center justify-between px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> AI Code Generator
          </span>
          {promptOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        {promptOpen && (
          <div className="p-3 pt-0 flex gap-2">
            <Textarea
              placeholder="Describe what you want to build... (e.g., 'Create a 3D rotating cube with Three.js and ambient lighting')"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="flex-1 bg-secondary border-border font-code text-sm min-h-[60px] resize-none"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAIGenerate(); } }}
            />
            <Button
              variant="default"
              onClick={handleAIGenerate}
              disabled={aiLoading || !prompt.trim()}
              className="self-end"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Generate
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
