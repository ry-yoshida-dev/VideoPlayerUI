/**
 * Style sheet of the live analysis status.
 */
export const analysisStyleSheet: string = `
.vpui-analysis-status {
  display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 8px; margin: 0 4px;
  border-radius: 13px; font-size: 12px; font-variant-numeric: tabular-nums; white-space: nowrap;
  color: rgba(255, 255, 255, 0.75); border: 1px solid rgba(255, 255, 255, 0.18);
}
.vpui-analysis-dot { width: 8px; height: 8px; border-radius: 50%; background: #34c759; }
.vpui-analysis-status[data-state="analyzing"] .vpui-analysis-dot {
  background: var(--vpui-accent, #3ea6ff); animation: vpui-analysis-pulse 0.8s ease-in-out infinite alternate;
}
.vpui-analysis-status[data-state="failed"] { color: var(--vpui-invalid, #ff6b6b); border-color: currentColor; }
.vpui-analysis-status[data-state="failed"] .vpui-analysis-dot { background: currentColor; }
.vpui-analysis-lag { color: #ffcc00; }
@keyframes vpui-analysis-pulse { from { opacity: 1; } to { opacity: 0.3; } }
`;
