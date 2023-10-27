import { type PluginSetting, filterWhitelistedConfig } from "./helper";

describe("filterWhitelistedConfig", () => {
  it("should filter the config based on the whitelisted properties", () => {
    const pluginSettings = [
      {
        id: 1,
        sectionName: "Section 1",
        children: [
          { configProperty: "prop1", value: "value1" },
          { configProperty: "prop2", value: "value2" },
          { configProperty: "prop3", value: "value3" },
        ],
      },
      {
        id: 2,
        sectionName: "Section 2",
        children: [
          { configProperty: "prop1", value: "value4" },
          { configProperty: "prop2", value: "value5" },
          { configProperty: "prop3", value: "value6" },
        ],
      },
    ] as unknown as PluginSetting[];

    const expectedOutput = [
      {
        id: 1,
        sectionName: "Section 1",
        children: [
          { configProperty: "prop1", value: "value1" },
          { configProperty: "prop3", value: "value3" },
        ],
      },
      {
        id: 2,
        sectionName: "Section 2",
        children: [
          { configProperty: "prop1", value: "value4" },
          { configProperty: "prop3", value: "value6" },
        ],
      },
    ];

    const whitelisted = ["prop1", "prop3"];

    const filteredSettings = filterWhitelistedConfig(
      pluginSettings,
      whitelisted,
    );

    expect(filteredSettings).toEqual(expectedOutput);
  });

  it("should return an empty array if no plugin settings are provided", () => {
    const filteredSettings = filterWhitelistedConfig(undefined, [
      "prop1",
      "prop2",
    ]);

    expect(filteredSettings).toEqual([]);
  });

  it("should return an empty array if no whitelisted properties are provided", () => {
    const pluginSettings = [
      {
        id: 1,
        sectionName: "Section 1",
        children: [
          { configProperty: "prop1", value: "value1" },
          { configProperty: "prop2", value: "value2" },
        ],
      },
    ] as unknown as PluginSetting[];

    const filteredSettings = filterWhitelistedConfig(pluginSettings, []);

    expect(filteredSettings).toEqual([]);
  });

  it("should return an empty array if no plugin settings and whitelisted properties are provided", () => {
    const filteredSettings = filterWhitelistedConfig(undefined, []);

    expect(filteredSettings).toEqual([]);
  });
});
