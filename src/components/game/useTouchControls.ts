import { useEffect, useRef, useState } from 'react';

export type Joystick = { x: number; y: number; active: boolean };

/**
 * Virtual joystick + tap detector for mobile-first 3D games.
 * - Left half of screen drives `move` joystick (normalized -1..1).
 * - Right half drives `look` joystick (camera/aim).
 * - `tap` fires on quick touches/clicks for actions (jump/fire).
 *
 * Works with both touch and mouse so it's testable on desktop.
 */
export function useTouchControls(target?: React.RefObject<HTMLElement>) {
  const [move, setMove] = useState<Joystick>({ x: 0, y: 0, active: false });
  const [look, setLook] = useState<Joystick>({ x: 0, y: 0, active: false });
  const tapRef = useRef<() => void>(() => {});
  const onTap = (cb: () => void) => {
    tapRef.current = cb;
  };

  useEffect(() => {
    const el = target?.current ?? window;
    const pointers = new Map<
      number,
      { side: 'left' | 'right'; startX: number; startY: number; startedAt: number }
    >();
    const RADIUS = 60; // px

    const getPoint = (e: PointerEvent) => ({ x: e.clientX, y: e.clientY });

    const down = (e: PointerEvent) => {
      const { x, y } = getPoint(e);
      const half = window.innerWidth / 2;
      const side: 'left' | 'right' = x < half ? 'left' : 'right';
      pointers.set(e.pointerId, { side, startX: x, startY: y, startedAt: performance.now() });
      const setter = side === 'left' ? setMove : setLook;
      setter({ x: 0, y: 0, active: true });
    };

    const move_ = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const { x, y } = getPoint(e);
      const dx = Math.max(-1, Math.min(1, (x - p.startX) / RADIUS));
      const dy = Math.max(-1, Math.min(1, (y - p.startY) / RADIUS));
      const setter = p.side === 'left' ? setMove : setLook;
      setter({ x: dx, y: dy, active: true });
    };

    const up = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const dt = performance.now() - p.startedAt;
      const { x, y } = getPoint(e);
      const moved = Math.hypot(x - p.startX, y - p.startY);
      if (dt < 250 && moved < 10) tapRef.current();
      const setter = p.side === 'left' ? setMove : setLook;
      setter({ x: 0, y: 0, active: false });
      pointers.delete(e.pointerId);
    };

    el.addEventListener('pointerdown', down as EventListener);
    el.addEventListener('pointermove', move_ as EventListener);
    el.addEventListener('pointerup', up as EventListener);
    el.addEventListener('pointercancel', up as EventListener);
    return () => {
      el.removeEventListener('pointerdown', down as EventListener);
      el.removeEventListener('pointermove', move_ as EventListener);
      el.removeEventListener('pointerup', up as EventListener);
      el.removeEventListener('pointercancel', up as EventListener);
    };
  }, [target]);

  return { move, look, onTap };
}