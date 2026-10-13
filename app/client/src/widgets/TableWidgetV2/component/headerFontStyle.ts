export function getHeaderEmphasis(value: unknown): {
  italic: boolean;
  underline: boolean;
} {
  const tokens = new Set<string>();

  if (typeof value === "string") {
    value.split(",").forEach((token) => {
      const normalized = token.trim().toUpperCase();

      if (normalized === "ITALIC" || normalized === "UNDERLINE") {
        tokens.add(normalized);
      }
    });
  }

  return {
    italic: tokens.has("ITALIC"),
    underline: tokens.has("UNDERLINE"),
  };
}
