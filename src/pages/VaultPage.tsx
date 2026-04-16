import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Download, Trash2, FileCode, Loader2, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface VaultFile {
  name: string;
  id: string;
  created_at: string;
  metadata: { size: number };
}

export default function VaultPage() {
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFiles = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.storage
      .from('vault')
      .list(user.id, { sortBy: { column: 'created_at', order: 'desc' } });
    if (error) {
      toast({ title: 'Error loading files', description: error.message, variant: 'destructive' });
    } else {
      setFiles((data || []) as any);
    }
    setLoading(false);
  };

  useEffect(() => { fetchFiles(); }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const { error } = await supabase.storage
      .from('vault')
      .upload(`${user.id}/${file.name}`, file, { upsert: true });
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Uploaded!', description: file.name });
      fetchFiles();
    }
    setUploading(false);
  };

  const handleDownload = async (fileName: string) => {
    if (!user) return;
    const { data, error } = await supabase.storage
      .from('vault')
      .download(`${user.id}/${fileName}`);
    if (error || !data) {
      toast({ title: 'Download failed', description: error?.message, variant: 'destructive' });
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadToIDE = async (fileName: string) => {
    if (!user) return;
    const { data, error } = await supabase.storage
      .from('vault')
      .download(`${user.id}/${fileName}`);
    if (error || !data) return;
    const text = await data.text();
    localStorage.setItem('codeforge_editor_content', text);
    toast({ title: 'Loaded to IDE', description: fileName });
  };

  const handleSaveCurrentToVault = async () => {
    if (!user) return;
    const code = localStorage.getItem('codeforge_editor_content');
    if (!code) { toast({ title: 'Nothing to save', variant: 'destructive' }); return; }
    const name = `project_${Date.now()}.html`;
    setUploading(true);
    const blob = new Blob([code], { type: 'text/html' });
    const { error } = await supabase.storage
      .from('vault')
      .upload(`${user.id}/${name}`, blob, { upsert: true });
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved!', description: name });
      fetchFiles();
    }
    setUploading(false);
  };

  const handleDelete = async (fileName: string) => {
    if (!user) return;
    const { error } = await supabase.storage
      .from('vault')
      .remove([`${user.id}/${fileName}`]);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted' });
      fetchFiles();
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vault</h1>
          <p className="text-muted-foreground text-sm">Persistent storage for your projects</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept=".html,.htm,.css,.js" onChange={handleUpload} className="hidden" />
          <Button variant="cyber" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
          </Button>
          <Button variant="default" onClick={handleSaveCurrentToVault} disabled={uploading}>
            <FileCode className="h-4 w-4" /> Save Current
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FolderOpen className="h-16 w-16 mb-4 opacity-30" />
          <p>No files yet. Upload or save your current project.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file, i) => (
            <motion.div
              key={file.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:glow-border transition-all group"
            >
              <FileCode className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(file.metadata?.size)}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => handleLoadToIDE(file.name)} title="Load to IDE">
                  <FileCode className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDownload(file.name)} title="Download">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(file.name)} title="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
