import {
  buildThemeUpdatePayload,
  fingerprintTheme,
  projectTheme,
  themePatchSchema,
} from "./theme.js";

const storedTheme = {
  id: "theme1",
  name: "default-new",
  displayName: "Default",
  isSystemTheme: true,
  config: {
    colors: { primaryColor: "#4F70FE" },
    borderRadius: { appBorderRadius: { M: "4px" } },
    fontFamily: { appFont: ["Inter"] },
  },
  stylesheet: {
    ButtonWidget: { background: "var(--ads-v2-color-bg-emphasis)" },
  },
  properties: {
    colors: { primaryColor: "#4F70FE", backgroundColor: "#FFFFFF" },
    borderRadius: { appBorderRadius: "4px" },
    fontFamily: { appFont: "Inter" },
    boxShadow: { appBoxShadow: "none" },
  },
};

describe("theme projection", () => {
  it("returns only allowlisted tokens and a stable revision", () => {
    const first = projectTheme(storedTheme);
    const reordered = projectTheme({
      config: storedTheme.config,
      stylesheet: storedTheme.stylesheet,
      properties: {
        fontFamily: { appFont: "Inter" },
        borderRadius: { appBorderRadius: "4px" },
        colors: { backgroundColor: "#FFFFFF", primaryColor: "#4F70FE" },
      },
    });

    expect(first).toEqual({
      primaryColor: "#4F70FE",
      borderRadius: "4px",
      fontFamily: "Inter",
      revision: expect.any(String),
    });
    expect(first).not.toHaveProperty("stylesheet");
    expect(first.revision).toMatch(/^[a-f0-9]{64}$/);
    expect(first.revision).toBe(reordered.revision);
    expect(fingerprintTheme(storedTheme)).toBe(first.revision);
    expect(
      projectTheme({
        ...storedTheme,
        properties: {
          ...storedTheme.properties,
          colors: { ...storedTheme.properties.colors, primaryColor: "#112233" },
        },
      }).revision,
    ).not.toBe(first.revision);
  });
});

describe("theme update payload builder", () => {
  it("updates only mapped Appsmith properties and preserves the endpoint payload", () => {
    const payload = buildThemeUpdatePayload(storedTheme, {
      primaryColor: "#112233",
      borderRadius: "0.5rem",
      fontFamily: "Source Sans Pro",
    });

    expect(payload).toMatchObject({
      id: "theme1",
      config: storedTheme.config,
      stylesheet: storedTheme.stylesheet,
      properties: {
        colors: { primaryColor: "#112233", backgroundColor: "#FFFFFF" },
        borderRadius: { appBorderRadius: "0.5rem" },
        fontFamily: { appFont: "Source Sans Pro" },
        boxShadow: { appBoxShadow: "none" },
      },
    });
    expect(payload).toHaveProperty("new", undefined);
    expect(storedTheme.properties.colors.primaryColor).toBe("#4F70FE");
  });

  it.each([
    ["raw expression", { primaryColor: "{{ evil }}" }],
    ["template interpolation", { fontFamily: "${evil}" }],
    ["arbitrary CSS", { borderRadius: "4px; color: red" }],
    ["non-hex color", { primaryColor: "red" }],
    ["URL", { fontFamily: "url(https://attacker.example/font.woff2)" }],
    ["unknown property", { stylesheet: { color: "red" } }],
  ])("rejects %s", (_label, patch) => {
    expect(themePatchSchema.safeParse(patch).success).toBe(false);
  });

  // An unsafe stored token is omitted from the projection rather than thrown on. Throwing made the whole read fail,
  // which took read_theme/update_theme down for any app whose theme held a value the strict allowlist cannot model
  // — reachable through ordinary product use, since the theme color control accepts any CSS color via
  // isValidColor(). The exclusion itself is the security property and is preserved.
  it("omits an unsafe stored token from the projection instead of returning it", () => {
    const projected = projectTheme({
      ...storedTheme,
      properties: {
        ...storedTheme.properties,
        colors: { primaryColor: "url(https://attacker.example)" },
      },
    });

    expect(projected.primaryColor).toBeUndefined();
    expect(JSON.stringify(projected)).not.toContain("attacker.example");
    // Named, so the caller can tell "unset" from "present but not showable" — but the VALUE never crosses.
    expect(projected.unsupportedTokens).toEqual(["primaryColor"]);
    // The rest of the theme still reads.
    expect(projected.borderRadius).toBe(
      storedTheme.properties.borderRadius.appBorderRadius,
    );
    expect(projected.revision).toMatch(/^[a-f0-9]{64}$/);
  });

  it("reports nothing as unsupported when every stored token projects", () => {
    expect(projectTheme(storedTheme).unsupportedTokens).toBeUndefined();
  });

  it("does not report an absent token as unsupported", () => {
    // Absent means unset, which is not the same as present-but-unshowable.
    const projected = projectTheme({
      ...storedTheme,
      properties: {
        ...storedTheme.properties,
        colors: {},
      },
    });

    expect(projected.primaryColor).toBeUndefined();
    expect(projected.unsupportedTokens).toBeUndefined();
  });

  it("changes the revision when a token crosses the projectable boundary", () => {
    // Guards the concurrency blind spot: with only projected tokens fingerprinted, a hex -> rgb() edit would have
    // left the revision identical, so update_theme could not detect the concurrent change.
    const withHex = projectTheme(storedTheme);
    const withRgb = projectTheme({
      ...storedTheme,
      properties: {
        ...storedTheme.properties,
        colors: { primaryColor: "rgb(85, 61, 233)" },
      },
    });

    expect(withRgb.revision).not.toBe(withHex.revision);
  });

  it("reads a theme whose stored color is a valid CSS color the allowlist cannot model", () => {
    const projected = projectTheme({
      ...storedTheme,
      properties: {
        ...storedTheme.properties,
        colors: { primaryColor: "rgb(85, 61, 233)" },
      },
    });

    // Not projected (not a hex color), but the call succeeds instead of throwing — and says so.
    expect(projected.primaryColor).toBeUndefined();
    expect(projected.unsupportedTokens).toEqual(["primaryColor"]);
    expect(projected.fontFamily).toBe(
      storedTheme.properties.fontFamily.appFont,
    );
  });

  // The harm case: an agent must be able to see that primaryColor exists before it overwrites it. Writing is still
  // permitted — the point is that the read no longer looks like "unstyled app".
  it("warns before an agent can overwrite an unprojectable token it never saw", () => {
    const current = {
      ...storedTheme,
      properties: {
        ...storedTheme.properties,
        colors: { primaryColor: "rgb(85, 61, 233)" },
      },
    };

    expect(projectTheme(current).unsupportedTokens).toContain("primaryColor");

    const payload = buildThemeUpdatePayload(current, {
      primaryColor: "#ff0000",
    });
    const properties = payload.properties as Record<
      string,
      Record<string, unknown>
    >;

    expect(properties.colors.primaryColor).toBe("#ff0000");
  });

  it("preserves an unprojectable stored token when writing an unrelated one", () => {
    const current = {
      ...storedTheme,
      properties: {
        ...storedTheme.properties,
        colors: { primaryColor: "rgb(85, 61, 233)" },
      },
    };
    const payload = buildThemeUpdatePayload(current, {
      borderRadius: "1.5rem",
    });
    const properties = payload.properties as Record<
      string,
      Record<string, unknown>
    >;

    expect(properties.colors.primaryColor).toBe("rgb(85, 61, 233)");
    expect(properties.borderRadius.appBorderRadius).toBe("1.5rem");
  });
});
