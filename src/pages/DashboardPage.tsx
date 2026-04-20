import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Code, Eye, Database, Upload, Download, FileCode, Layers, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

const cards = [
  { to: '/ide', icon: Code, label: 'IDE', desc: 'AI-powered code editor with syntax highlighting', color: 'primary' },
  { to: '/preview', icon: Eye, label: 'Live Preview', desc: 'Real-time preview with iterational AI', color: 'accent' },
  { to: '/vault', icon: Database, label: 'Vault', desc: 'Persistent storage for your projects', color: 'primary' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleLoadHTML = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      localStorage.setItem('codeforge_editor_content', content);
      toast({ title: 'File loaded!', description: `${file.name} loaded into IDE` });
      navigate('/ide');
    };
    reader.readAsText(file);
  };

  const handleExportHTML = () => {
    const code = localStorage.getItem('codeforge_editor_content') || '<!DOCTYPE html>\n<html>\n<body>\n\n</body>\n</html>';
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.html';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!', description: 'HTML file downloaded' });
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <input ref={fileInputRef} type="file" accept=".html,.htm" onChange={handleFileChange} className="hidden" />
        <Button variant="cyber" onClick={handleLoadHTML}>
          <Upload className="h-4 w-4" /> Load HTML
        </Button>
        <Button variant="cyber" onClick={handleExportHTML}>
          <Download className="h-4 w-4" /> Export HTML
        </Button>
        <Button variant="cyber" onClick={() => navigate('/ide')}>
          <FileCode className="h-4 w-4" /> New Project
        </Button>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(({ to, icon: Icon, label, desc }, i) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <button
              onClick={() => navigate(to)}
              className="w-full text-left p-6 rounded-xl glass hover:glow-border hover:border-primary/40 transition-all group"
            >
              <Icon className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-lg">{label}</h3>
              <p className="text-sm text-muted-foreground mt-1">{desc}</p>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: FileCode, label: 'HTML Engine', value: 'v5' },
          { icon: Layers, label: 'Three.js', value: 'Ready' },
          { icon: Cpu, label: 'AI Model', value: 'Gemini' },
          { icon: Database, label: 'Storage', value: 'Active' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="p-4 rounded-lg glass">
            <Icon className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-semibold text-primary">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
