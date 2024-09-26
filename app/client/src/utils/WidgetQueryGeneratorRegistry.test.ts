import WidgetQueryGeneratorRegistry from "./WidgetQueryGeneratorRegistry";

describe("WidgetQueryGeneratorRegistry", () => {
  const somepluginId = "somePluginId";

  it("should be able to register a QueryGenerator", () => {
    const someQueryGenerator = {};

    WidgetQueryGeneratorRegistry.register(somepluginId, someQueryGenerator);
    expect(WidgetQueryGeneratorRegistry.get(somepluginId)).toBeTruthy();
  });

  it("should return a falsey value when searching for an non existing generator", () => {
    const nonExistingQueryGeneratopr = "someId";

    expect(
      WidgetQueryGeneratorRegistry.get(nonExistingQueryGeneratopr),
    ).toBeFalsy();
  });

  it("should return the same adaptor reference when querying the same pluginId", () => {
    const adaptor = WidgetQueryGeneratorRegistry.get(somepluginId);

    expect(adaptor).toBe(WidgetQueryGeneratorRegistry.get(somepluginId));
  });
  it("should not find the registered plugin after clearing the registry", () => {
    WidgetQueryGeneratorRegistry.clear();
    expect(WidgetQueryGeneratorRegistry.get(somepluginId)).toBeFalsy();
  });

  afterAll(() => {
    WidgetQueryGeneratorRegistry.clear();
  });
});
