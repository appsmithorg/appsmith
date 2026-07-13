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

  it("rejects an unsafe stored token instead of projecting it", () => {
    expect(() =>
      projectTheme({
        ...storedTheme,
        properties: {
          ...storedTheme.properties,
          colors: { primaryColor: "url(https://attacker.example)" },
        },
      }),
    ).toThrow();
  });
});
