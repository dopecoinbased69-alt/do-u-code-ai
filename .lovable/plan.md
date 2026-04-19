

## Goal
1. Remove the "Welcome back, …" header block from the dashboard.
2. Port the **Atomic Reactor 3D scene** + **Reactor OS aesthetic** (dark slate + Radix blue + glassmorphism) from `reactor.html` to the existing CodeForge app, keeping ALL logic (auth, IDE, AI edge function, vault, preview, routing) untouched.

## Architecture

```text
AppLayout (existing)
 ├── <ReactorBackground/>   ← NEW fixed full-screen Three.js canvas, z-0, opacity controlled per route
 ├── AppSidebar             ← restyled (glass + Radix blue active state)
 └── <main> Outlet          ← pages render above bg with glass cards
```

The 3D scene is mounted **once** at the layout level (not per page) so it persists across navigation without re-instantiating WebGL — matching reactor.html's behavior where opacity changes per route.

## Implementation steps

**1. Install deps** (React 18 compatible, per project context):
- `three@^0.160.0`
- `@react-three/fiber@^8.18.0`
- `@react-three/drei@^9.122.0`

**2. New file: `src/components/ReactorBackground.tsx`**
- React Three Fiber `<Canvas>` fixed-position, full-viewport, `pointer-events: none`, behind content.
- Port `createAtom` / `createRing` / `createOrbital` / `animate` logic verbatim into R3F components:
  - `<Nucleus>` — black metallic sphere (radius 1.2)
  - `<Ring>` ×2 — torus + 6 gold box segments + gold backside outline, tilted at ±π/4
  - `<Orbital>` ×2 — small black sphere with gold glow at distance 1.8
  - Group rotates `y += 0.005`, `x += 0.002` per frame; rings/orbitals spin on own axes
- Reads current route via `useLocation`; sets canvas opacity:
  - `/preview` → 0.9 (foreground hero)
  - `/` (auth) → 0.4
  - all other routes → 0.2
- Colors: `blue 0x2563eb`, `gold 0xfacc15`, `black 0x111111`, exactly as source.

**3. Update `src/components/AppLayout.tsx`**
- Mount `<ReactorBackground />` as first child of root div (z-0), wrap sidebar+main in z-10 layer.

**4. Update `src/index.css` — port Reactor OS palette**
- `--background: 0 0% 7%` (slate-1 #111111)
- `--card: 0 0% 11%` (slate-2 #1c1c1c)
- `--primary: 210 100% 50%` (Radix blue #0091ff)
- `--accent: 48 96% 53%` (gold #facc15) — used only for 3D, not UI chrome
- `--border: 0 0% 18%`
- `--sidebar-background: 0 0% 9%`
- Update `.glass` utility to match reactor.html: `rgba(28,28,28,0.7)` + `backdrop-filter: blur(12px)` + `1px solid rgba(255,255,255,0.1)`
- Replace cyan glow vars with blue glow: `0 0 20px hsl(210 100% 50% / 0.3)`
- Add Inter + Fira Code via Google Fonts import (replacing Space Grotesk/JetBrains Mono).

**5. Update `tailwind.config.ts`**
- `fontFamily.sans: ["Inter", ...]`
- `fontFamily.code: ["Fira Code", ...]`

**6. Update `src/pages/DashboardPage.tsx`**
- Delete the `<motion.div>` block containing `<h1>Welcome back…</h1>` and `<p>Your professional…</p>` (lines 51–57).
- Quick Actions row becomes top of page.
- No other logic changes.

**7. Untouched** (logic preserved):
- `useAuth`, `AuthPage`, `IDEPage` (CodeMirror + Gemini), `PreviewPage`, `VaultPage`, Supabase client, `ai-code-gen` edge function, all routes, all storage.

## Risks & mitigations
- **WebGL cost on mobile**: Canvas uses `dpr={[1, 1.5]}` cap; geometry is low-poly (~1.5k tris total).
- **Z-index stacking**: Background `z-0 pointer-events-none`, layout `relative z-10`, modals/toasts already use Radix portals with high z.
- **Color token churn**: Only HSL values in `:root` change; no component class renames needed since they all reference tokens.
- **Font swap**: Inter is widely available; existing `font-code` utility unchanged in name.

## Files touched
- NEW `src/components/ReactorBackground.tsx`
- EDIT `src/components/AppLayout.tsx`
- EDIT `src/index.css`
- EDIT `tailwind.config.ts`
- EDIT `src/pages/DashboardPage.tsx`
- EDIT `package.json` (3 deps)

