import { useRef, useState } from 'react';
import GameCanvas, { GameQuality } from './GameCanvas';
import JoystickHud from './JoystickHud';
import { useTouchControls } from './useTouchControls';
import DemoScene from './DemoScene';
import { Button } from '@/components/ui/button';

/**
 * Drop-in starter for mobile-optimized 3D games.
 *
 * Replace <DemoScene/> with your own scene component. Pass `move`, `look`,
 * and `jumpRef` to consume input. Quality selector + HUD are reusable.
 */
export default function GameTemplate() {
  const [quality, setQuality] = useState<GameQuality>('medium');
  const { move, look, onTap } = useTouchControls();
  const jumpRef = useRef(0);
  onTap(() => {
    jumpRef.current = 1;
  });

  return (
    <div className="fixed inset-0 bg-background overflow-hidden touch-none select-none">
      <GameCanvas quality={quality}>
        <DemoScene move={move} look={look} jumpRef={jumpRef} />
      </GameCanvas>

      {/* Top HUD */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-20 p-4 flex items-start justify-between">
        <div className="glass rounded-lg px-3 py-2 border border-white/10">
          <p className="text-[10px] tracking-widest text-muted-foreground">REACTOR / GAME</p>
          <p className="text-sm font-semibold text-primary">Demo Scene</p>
        </div>
        <div className="pointer-events-auto flex gap-1 glass rounded-lg p-1 border border-white/10">
          {(['low', 'medium', 'high'] as GameQuality[]).map((q) => (
            <Button
              key={q}
              size="sm"
              variant={quality === q ? 'cyber' : 'ghost'}
              className="h-7 px-2 text-[10px] uppercase tracking-wider"
              onClick={() => setQuality(q)}
            >
              {q}
            </Button>
          ))}
        </div>
      </div>

      <JoystickHud move={move} look={look} />

      {/* Tap hint */}
      <div className="pointer-events-none fixed bottom-44 left-1/2 -translate-x-1/2 z-20 text-[11px] text-muted-foreground tracking-widest">
        TAP TO JUMP · DRAG L/R FOR MOVE/LOOK
      </div>
    </div>
  );
}