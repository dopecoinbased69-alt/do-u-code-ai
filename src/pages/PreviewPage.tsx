import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Maximize2, Minimize2, RotateCcw, Sparkles, Loader2, Code } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAIProvider } from '@/hooks/useAIProvider';

export default function PreviewPage() {
  const [code, setCode] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { preferred } = useAIProvider();

  useEffect(() => {
    const saved = localStorage.getItem('codeforge_editor_content') || '';
    setCode(saved);
    const handleStorage = () => {
      setCode(localStorage.getItem('codeforge_editor_content') || '');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleIterate = useCallback(async () => {
    if (!prompt.trim()) return;
    setAiLoading(true);
    try {
      const resp = await supabase.functions.invoke('ai-code-gen', {
        body: { prompt: `Iterate on this code: ${prompt.trim()}`, currentCode: code, provider: preferred },
      });
      if (resp.error) throw resp.error;
      const data = resp.data;
      if (data?.code) {
        setCode(data.code);
        localStorage.setItem('codeforge_editor_content', data.code);
        toast({ title: 'Iterated!', description: 'Preview updated with AI changes' });
      } else if (data?.error) {
        toast({ title: 'AI Error', description: data.message || data.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  }, [prompt, code, toast, preferred]);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = '';
      setTimeout(() => { if (iframeRef.current) iframeRef.current.srcdoc = code; }, 50);
    }
  };

  return (
    <div className={`h-full flex flex-col ${fullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* Toolbar */}
      <div className="border-b border-border p-3 flex items-center gap-2">
        <span className="font-code text-sm text-primary">Preview</span>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={handleRefresh}><RotateCcw className="h-3 w-3" /></Button>
        <Button variant="ghost" size="sm" onClick={() => navigate('/ide')}><Code className="h-3 w-3" /> IDE</Button>
        <Button variant="ghost" size="sm" onClick={() => setFullscreen(!fullscreen)}>
          {fullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
        </Button>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 bg-secondary">
        <iframe
          ref={iframeRef}
          srcDoc={code}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title="Live Preview"
        />
      </div>

      {/* Iterational AI */}
      <div className="border-t border-border p-3 flex gap-2">
        <Textarea
          placeholder="Iterate on the preview... (e.g., 'Change the background to a gradient and add animation')"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          className="flex-1 bg-secondary border-border font-code text-sm min-h-[50px] resize-none"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleIterate(); } }}
        />
        <Button onClick={handleIterate} disabled={aiLoading || !prompt.trim()} className="self-end">
          {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Iterate
        </Button>
      </div>
    </div>
  );
}
