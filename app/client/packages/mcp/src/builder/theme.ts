import { createHash } from "node:crypto";
import { z } from "zod";
import { canonicalStableSerialize } from "./semantic.js";

const RAW_EXPRESSION = /\{\{|\}\}|\$\{|`/;
const HEX_COLOR = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
const BORDER_RADIUS = /^\d+(?:\.\d+)?(?:px|rem|em)$/;
const FONT_FAMILY = /^[A-Za-z0-9 ,'-]+$/;

const safeLiteral = (pattern: RegExp, message: string) =>
  z
    .string()
    .min(1)
    .max(60)
    .regex(pattern, message)
    .refine(
      (value) => !RAW_EXPRESSION.test(value),
      "must not contain bindings",
    );

const primaryColor = safeLiteral(HEX_COLOR, "must be a hex color");
const borderRadius = safeLiteral(
  BORDER_RADIUS,
  "must be a numeric px, rem, or em value",
);
const fontFamily = safeLiteral(
  FONT_FAMILY,
  "must be a literal font family name",
);

// The MCP can change only these literal application-level tokens. It never accepts stylesheets, CSS declarations,
// URLs, or binding syntax from an agent.
export const themePatchSchema = z
  .object({
    primaryColor: primaryColor.optional(),
    borderRadius: borderRadius.optional(),
    fontFamily: fontFamily.optional(),
  })
  .strict()
  .refine((tokens) => Object.keys(tokens).length > 0, "must update a token");

export type ThemePatch = z.infer<typeof themePatchSchema>;

const themePropertiesSchema = z
  .object({
    colors: z.object({ primaryColor: primaryColor.optional() }).passthrough(),
    borderRadius: z
      .object({ appBorderRadius: borderRadius.optional() })
      .passthrough(),
    fontFamily: z.object({ appFont: fontFamily.optional() }).passthrough(),
  })
  .passthrough();

// This intentionally models only the safe read surface. Config and stylesheet data remain opaque implementation
// details of Appsmith's existing PUT payload and are never returned to an MCP caller.
const storedThemeSchema = z
  .object({
    config: z.record(z.unknown()),
    stylesheet: z.record(z.unknown()),
    properties: themePropertiesSchema,
  })
  .passthrough();

export interface ThemeProjection {
  primaryColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  revision: string;
}

function fingerprintTokens(tokens: Omit<ThemeProjection, "revision">): string {
  return createHash("sha256")
    .update(canonicalStableSerialize(tokens), "utf8")
    .digest("hex");
}

function projectTokens(theme: unknown): Omit<ThemeProjection, "revision"> {
  const parsed = storedThemeSchema.parse(theme);

  return {
    ...(parsed.properties.colors.primaryColor !== undefined
      ? { primaryColor: parsed.properties.colors.primaryColor }
      : {}),
    ...(parsed.properties.borderRadius.appBorderRadius !== undefined
      ? { borderRadius: parsed.properties.borderRadius.appBorderRadius }
      : {}),
    ...(parsed.properties.fontFamily.appFont !== undefined
      ? { fontFamily: parsed.properties.fontFamily.appFont }
      : {}),
  };
}

export function fingerprintTheme(theme: unknown): string {
  return fingerprintTokens(projectTokens(theme));
}

// Projects a server-fetched theme into the three allowlisted tokens. Because the revision fingerprints this
// projection, opaque stylesheet/config fields can neither leak to callers nor affect optimistic concurrency.
export function projectTheme(theme: unknown): ThemeProjection {
  const tokens = projectTokens(theme);

  return { ...tokens, revision: fingerprintTokens(tokens) };
}

// Builds the body expected by PUT /v1/themes/applications/{applicationId}. The existing server-fetched theme must be
// retained because Appsmith replaces config, stylesheet, and properties together. Only validated token values are
// changed; agent input cannot replace any other part of that payload.
export function buildThemeUpdatePayload(
  currentTheme: unknown,
  patchInput: unknown,
): Record<string, unknown> {
  const patch = themePatchSchema.parse(patchInput);

  storedThemeSchema.parse(currentTheme);
  const clonedTheme = JSON.parse(
    canonicalStableSerialize(currentTheme),
  ) as Record<string, unknown>;
  const properties = clonedTheme.properties as Record<
    string,
    Record<string, unknown>
  >;

  properties.colors = {
    ...properties.colors,
    ...(patch.primaryColor !== undefined
      ? { primaryColor: patch.primaryColor }
      : {}),
  };
  properties.borderRadius = {
    ...properties.borderRadius,
    ...(patch.borderRadius !== undefined
      ? { appBorderRadius: patch.borderRadius }
      : {}),
  };
  properties.fontFamily = {
    ...properties.fontFamily,
    ...(patch.fontFamily !== undefined ? { appFont: patch.fontFamily } : {}),
  };

  // Preserve the frontend's existing endpoint contract while preventing a caller from controlling its value.
  return { ...clonedTheme, properties, new: undefined };
}
