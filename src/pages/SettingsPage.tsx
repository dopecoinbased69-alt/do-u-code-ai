import { useAIProvider, type ProviderId } from '@/hooks/useAIProvider';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, RefreshCw, Loader2, Settings as SettingsIcon, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const PROVIDER_NOTES: Record<ProviderId, string> = {
  lovable: 'Built-in Lovable AI Gateway. Uses workspace credits.',
  openai: 'Requires OPENAI_API_KEY in backend secrets.',
  anthropic: 'Requires ANTHROPIC_API_KEY in backend secrets.',
  gemini: 'Requires GEMINI_API_KEY (Google AI Studio) in backend secrets.',
  groq: 'Requires GROQ_API_KEY. Fastest inference, generous free tier.',
};

export default function SettingsPage() {
  const { providers, preferred, setPreferred, refresh, loading } = useAIProvider();
  const { toast } = useToast();

  const handleSelect = (id: ProviderId, available: boolean) => {
    if (!available) {
      toast({
        title: 'Provider unavailable',
        description: 'Add the corresponding API key in backend secrets to enable this provider.',
        variant: 'destructive',
      });
      return;
    }
    setPreferred(id);
    toast({ title: 'Preferred provider updated', description: id });
  };

  const availableCount = providers.filter((p) => p.available).length;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-3xl">
      <header className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <SettingsIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gradient">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your AI engine and preferences.</p>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">AI Provider</h2>
            <p className="text-xs text-muted-foreground">
              {loading
                ? 'Checking available providers…'
                : `${availableCount} of ${providers.length} provider${providers.length === 1 ? '' : 's'} configured. Fallback runs automatically if your preferred provider fails.`}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Refresh
          </Button>
        </div>

        <div className="grid gap-3">
          {providers.length === 0 && !loading && (
            <div className="p-4 rounded-lg glass border border-border text-sm text-muted-foreground">
              Could not reach the backend status endpoint. Try refreshing.
            </div>
          )}

          {providers.map((p) => {
            const isPreferred = preferred === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id, p.available)}
                className={cn(
                  'text-left p-4 rounded-lg glass border transition-all',
                  isPreferred
                    ? 'border-primary/60 glow-border'
                    : 'border-border hover:border-primary/30',
                  !p.available && 'opacity-60',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{p.label}</span>
                      {isPreferred && (
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                          Preferred
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{PROVIDER_NOTES[p.id]}</p>
                    <p className="text-[11px] font-code text-muted-foreground mt-2">
                      Model: <span className="text-primary">{p.defaultModel}</span>
                    </p>
                  </div>
                  <div className="shrink-0">
                    {p.available ? (
                      <span className="flex items-center gap-1 text-xs text-primary">
                        <CheckCircle2 className="h-4 w-4" /> Available
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <XCircle className="h-4 w-4" /> Missing key
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 rounded-lg border border-border bg-secondary/30 flex gap-3">
          <KeyRound className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="text-foreground font-medium">Adding a new provider</p>
            <p>
              Ask in chat to add an API key (e.g. <span className="font-code text-primary">OPENAI_API_KEY</span>,
              <span className="font-code text-primary"> ANTHROPIC_API_KEY</span>,
              <span className="font-code text-primary"> GEMINI_API_KEY</span>, or
              <span className="font-code text-primary"> GROQ_API_KEY</span>). Once stored, it becomes available here automatically.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}