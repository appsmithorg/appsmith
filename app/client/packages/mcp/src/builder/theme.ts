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

// The READ side is deliberately permissive about the shape of what is already stored: it accepts any string and
// leaves the strict allowlists above to guard the WRITE side (themePatchSchema) and the projection below.
//
// Reusing the strict token schemas here made a stored value the MCP cannot model a hard failure for the whole
// tool: `storedThemeSchema.parse` threw, so read_theme and update_theme died outright on such an app. That is
// reachable through ordinary product use — the theme color control validates free text with isValidColor(), which
// accepts any CSS color (`rgb(85, 61, 233)`, `hsl(...)`, named colors) and even `url(...)`, none of which match
// HEX_COLOR. Reading a theme must not require that every stored token conform to the write-side allowlist.
const themePropertiesSchema = z
  .object({
    colors: z.object({ primaryColor: z.string().optional() }).passthrough(),
    borderRadius: z
      .object({ appBorderRadius: z.string().optional() })
      .passthrough(),
    fontFamily: z.object({ appFont: z.string().optional() }).passthrough(),
  })
  .passthrough();

// A stored token reaches the projection only if the strict schema still accepts it; anything else is omitted.
// This keeps the security property intact — unsafe CSS (`url(...)`) and binding expressions are never returned to
// an MCP caller — while degrading to a partial read instead of failing the whole call.
function projectToken(
  schema: z.ZodType<string>,
  value: string | undefined,
): string | undefined {
  if (value === undefined) return undefined;

  return schema.safeParse(value).success ? value : undefined;
}

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
  // Names ONLY — never the values — of tokens that are set in storage but fall outside the strict allowlist, so a
  // caller can tell "this token is unset" apart from "this token exists and we will not show it to you". Without
  // this the two are indistinguishable, and an agent that reads a theme whose primaryColor is `rgb(85, 61, 233)`
  // sees no primaryColor, concludes the app is unstyled, and overwrites the author's brand colour believing it
  // filled a blank. Emitting the name leaks nothing: `url(...)` and binding syntax still never cross this boundary.
  unsupportedTokens?: string[];
  revision: string;
}

function fingerprintTokens(tokens: Omit<ThemeProjection, "revision">): string {
  return createHash("sha256")
    .update(canonicalStableSerialize(tokens), "utf8")
    .digest("hex");
}

function projectTokens(theme: unknown): Omit<ThemeProjection, "revision"> {
  const parsed = storedThemeSchema.parse(theme);

  const projectedPrimaryColor = projectToken(
    primaryColor,
    parsed.properties.colors.primaryColor,
  );
  const projectedBorderRadius = projectToken(
    borderRadius,
    parsed.properties.borderRadius.appBorderRadius,
  );
  const projectedFontFamily = projectToken(
    fontFamily,
    parsed.properties.fontFamily.appFont,
  );

  // A token is "unsupported" only when storage HAS a value and the strict schema refused it — an absent token is
  // simply unset and is not reported. Sorted so the fingerprint below is order-stable.
  const unsupportedTokens = (
    [
      [
        "primaryColor",
        parsed.properties.colors.primaryColor,
        projectedPrimaryColor,
      ],
      [
        "borderRadius",
        parsed.properties.borderRadius.appBorderRadius,
        projectedBorderRadius,
      ],
      ["fontFamily", parsed.properties.fontFamily.appFont, projectedFontFamily],
    ] as const
  )
    .filter(
      ([, stored, projected]) =>
        stored !== undefined && projected === undefined,
    )
    .map(([name]) => name)
    .sort();

  return {
    ...(projectedPrimaryColor !== undefined
      ? { primaryColor: projectedPrimaryColor }
      : {}),
    ...(projectedBorderRadius !== undefined
      ? { borderRadius: projectedBorderRadius }
      : {}),
    ...(projectedFontFamily !== undefined
      ? { fontFamily: projectedFontFamily }
      : {}),
    // Included in the projection — and therefore in the revision fingerprint — so that a token crossing the
    // projectable/unprojectable boundary changes the revision instead of being invisible to the concurrency check.
    // Residual, accepted: two different unprojectable values still hash alike, since only the name is recorded.
    ...(unsupportedTokens.length > 0 ? { unsupportedTokens } : {}),
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
