/**
 * Shared dark-mode color palette for classic (non-Anvil) published apps.
 *
 * These values are referenced by the dark preset stylesheet
 * (`globalStyles/DarkModeGlobalStyles`), the viewer page background, and the
 * per-widget dark defaults resolved via `resolveWidgetColor`. Keeping them in
 * one place avoids the same hex literal drifting across widgets.
 */
export const DARK_MODE_COLORS = {
  // Page canvas behind all widgets — the darkest layer.
  pageBackground: "#0f0f0f",
  // Default widget surface (containers, primary buttons, table base).
  surface: "#1a1a1a",
  // Slightly raised surface used for table row striping.
  rowSurface: "#1e1e1e",
  // Primary readable text on dark surfaces.
  text: "#e6e6e6",
};
