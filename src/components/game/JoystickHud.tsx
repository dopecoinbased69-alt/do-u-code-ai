import type { Joystick } from './useTouchControls';

/**
 * Visual feedback for the virtual joysticks. Fixed overlay, pointer-events: none.
 */
export default function JoystickHud({ move, look }: { move: Joystick; look: Joystick }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      <Stick label="MOVE" stick={move} side="left" />
      <Stick label="LOOK" stick={look} side="right" />
    </div>
  );
}

function Stick({ stick, side, label }: { stick: Joystick; side: 'left' | 'right'; label: string }) {
  const pos = side === 'left' ? 'left-6' : 'right-6';
  return (
    <div
      className={`absolute bottom-8 ${pos} h-28 w-28 rounded-full glass border border-white/15 flex items-center justify-center transition-opacity ${stick.active ? 'opacity-90' : 'opacity-40'}`}
    >
      <span className="absolute top-1 text-[10px] tracking-widest text-muted-foreground">{label}</span>
      <div
        className="h-10 w-10 rounded-full bg-primary/40 border border-primary/60 glow-primary transition-transform"
        style={{ transform: `translate(${stick.x * 30}px, ${stick.y * 30}px)` }}
      />
    </div>
  );
}