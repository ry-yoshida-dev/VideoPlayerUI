/**
 * Style sheet of the built-in player, themed through `--vpui-*` custom properties.
 */
export const playerStyleSheet: string = `
.vpui-root {
  --vpui-accent: #3ea6ff;
  --vpui-foreground: #ffffff;
  --vpui-surface: rgba(24, 24, 27, 0.92);
  --vpui-track: rgba(255, 255, 255, 0.28);
  --vpui-hover: rgba(255, 255, 255, 0.16);
  --vpui-bar: #17181c;
  --vpui-invalid: #ff6b6b;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--vpui-bar);
  color: var(--vpui-foreground);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  container-type: inline-size;
  outline: none;
}
.vpui-root:focus-visible { box-shadow: inset 0 0 0 2px var(--vpui-accent); }
.vpui-stage { position: relative; flex: 1 1 auto; min-height: 0; background: #000; aspect-ratio: 16 / 9; }
.vpui-root:fullscreen .vpui-stage { aspect-ratio: auto; }
.vpui-video, .vpui-frame-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.vpui-frame-canvas { pointer-events: none; }
.vpui-frame-canvas[data-interactive="true"] { pointer-events: auto; }
.vpui-slot { display: contents; }

.vpui-center {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  display: grid; place-items: center; pointer-events: none;
}
.vpui-feedback {
  width: 56px; height: 56px; border-radius: 50%;
  display: grid; place-items: center; background: rgba(0, 0, 0, 0.5);
  animation: vpui-feedback 0.45s ease-out forwards;
}
@keyframes vpui-feedback {
  from { opacity: 1; transform: scale(0.85); }
  to { opacity: 0; transform: scale(1.25); }
}
.vpui-spinner {
  width: 44px; height: 44px; border-radius: 50%;
  border: 4px solid var(--vpui-track); border-top-color: var(--vpui-foreground);
  animation: vpui-spin 0.9s linear infinite;
}
@keyframes vpui-spin { to { transform: rotate(360deg); } }
.vpui-error { color: #ffcc00; }

.vpui-controls { flex: none; padding: 4px 8px 4px; background: var(--vpui-bar); }
.vpui-row { display: flex; align-items: center; gap: 2px; min-height: 42px; }
.vpui-spacer { flex: 1; }

.vpui-button {
  width: 40px; height: 40px; flex: none; border: none; border-radius: 50%;
  display: grid; place-items: center; padding: 0; cursor: pointer;
  color: var(--vpui-foreground); background: transparent;
  transition: background 0.15s ease, color 0.15s ease;
}
.vpui-button:hover { background: var(--vpui-hover); }
.vpui-button:focus-visible { outline: 2px solid var(--vpui-accent); outline-offset: -2px; }
.vpui-button[aria-pressed="true"] { color: var(--vpui-accent); }
.vpui-button[data-primary="true"] { width: 46px; height: 46px; }

.vpui-time {
  padding: 0 8px; font-size: 13px; white-space: nowrap; min-width: 0; overflow: hidden; text-overflow: ellipsis;
  font-variant-numeric: tabular-nums; opacity: 0.92;
}
.vpui-chip {
  height: 26px; padding: 0 10px; border-radius: 13px; border: 1px solid rgba(255, 255, 255, 0.35);
  display: inline-flex; align-items: center; font-size: 12px; font-weight: 600;
  font-variant-numeric: tabular-nums; color: var(--vpui-foreground); background: transparent;
  white-space: nowrap; margin: 0 4px;
}
button.vpui-chip { cursor: pointer; }
button.vpui-chip:hover { background: var(--vpui-hover); }
.vpui-chip[data-muted="true"] { border-color: transparent; opacity: 0.7; }

.vpui-time-id {
  display: inline-flex; align-items: center; gap: 2px; height: 28px; padding: 0 4px 0 8px; margin: 0 4px;
  border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.22); cursor: text;
  font-size: 13px; font-variant-numeric: tabular-nums; color: rgba(255, 255, 255, 0.6);
}
.vpui-time-id:focus-within { border-color: var(--vpui-accent); color: var(--vpui-foreground); }
.vpui-time-id[data-invalid="true"] { border-color: var(--vpui-invalid); }
.vpui-time-id input {
  min-width: 4ch; padding: 0; border: none; outline: none; background: transparent;
  font: inherit; color: var(--vpui-foreground); font-variant-numeric: tabular-nums;
}

.vpui-seek {
  position: relative; height: 22px; margin: 0 6px; cursor: pointer; touch-action: none;
}
.vpui-seek-track, .vpui-seek-fill, .vpui-seek-hover {
  position: absolute; left: 0; top: 50%; height: 4px; margin-top: -2px; border-radius: 2px;
  transition: height 0.12s ease, margin-top 0.12s ease;
}
.vpui-seek-track { right: 0; background: var(--vpui-track); }
.vpui-seek-hover { background: rgba(255, 255, 255, 0.35); }
.vpui-seek-fill { background: var(--vpui-accent); }
.vpui-seek:hover .vpui-seek-track, .vpui-seek:hover .vpui-seek-fill, .vpui-seek:hover .vpui-seek-hover,
.vpui-seek[data-scrubbing="true"] .vpui-seek-track, .vpui-seek[data-scrubbing="true"] .vpui-seek-fill {
  height: 6px; margin-top: -3px;
}
.vpui-seek-thumb {
  position: absolute; top: 50%; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%;
  background: var(--vpui-accent); box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.25);
  transform: scale(0.85); transition: transform 0.12s ease;
}
.vpui-seek:hover .vpui-seek-thumb, .vpui-seek[data-scrubbing="true"] .vpui-seek-thumb { transform: scale(1.15); }
.vpui-seek:focus-visible { outline: 2px solid var(--vpui-accent); outline-offset: 2px; border-radius: 4px; }
.vpui-seek-tooltip {
  position: absolute; bottom: 22px; transform: translateX(-50%);
  padding: 3px 7px; border-radius: 6px; font-size: 12px; font-variant-numeric: tabular-nums;
  background: var(--vpui-surface); white-space: nowrap; pointer-events: none;
}

.vpui-tooltip {
  position: absolute; z-index: 3; width: max-content; max-width: min(320px, calc(100% - 12px)); padding: 4px 8px; border-radius: 6px;
  font-size: 12px; line-height: 1.4; white-space: pre-line; pointer-events: none;
  color: var(--vpui-foreground); background: var(--vpui-surface); box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  animation: vpui-tooltip 0.12s ease-out;
}
@keyframes vpui-tooltip { from { opacity: 0; } to { opacity: 1; } }

.vpui-menu-anchor, .vpui-popover-anchor { position: relative; display: inline-flex; }
.vpui-toast {
  position: absolute; bottom: calc(100% + 6px); left: 50%; z-index: 2;
  padding: 4px 9px; border-radius: 7px; white-space: nowrap; pointer-events: none;
  font-size: 12px; font-weight: 600; color: #0b0d10; background: #ffffff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  animation: vpui-toast 1.4s ease forwards;
}
.vpui-toast[data-status="failed"] { color: #ffffff; background: var(--vpui-invalid); }
@keyframes vpui-toast {
  0% { opacity: 0; transform: translate(-50%, 4px); }
  10% { opacity: 1; transform: translate(-50%, 0); }
  75% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, -2px); }
}
.vpui-menu {
  position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; gap: 2px; padding: 6px; min-width: 72px;
  border-radius: 12px; background: var(--vpui-surface); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
.vpui-menu-item {
  height: 32px; padding: 0 12px; border: none; border-radius: 8px; cursor: pointer;
  font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums;
  color: var(--vpui-foreground); background: transparent;
}
.vpui-menu-item:hover { background: var(--vpui-hover); }
.vpui-menu-item[aria-checked="true"] { color: #000; background: var(--vpui-accent); }

@container (max-width: 520px) {
  .vpui-optional { display: none; }
  .vpui-button { width: 34px; height: 34px; }
  .vpui-button[data-primary="true"] { width: 40px; height: 40px; }
  .vpui-controls { padding: 2px 4px; }
  .vpui-time { font-size: 12px; padding: 0 4px; }
}
@container (max-width: 440px) {
  .vpui-time { display: none; }
}
`;
