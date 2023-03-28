import WidgetQueryGeneratorRegistry from "./WidgetQueryGeneratorRegistry";

describe("WidgetQueryGeneratorRegistry", () => {
  it("should be able to register a QueryGenerator", () => {
    const somepluginId = "somePluginId";
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

  afterAll(() => {
    WidgetQueryGeneratorRegistry.clear();
  });
});
