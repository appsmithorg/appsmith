import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const appSettings = ObjectsRegistry.AppSettings;

describe("Page Settings", () => {
  it("Page name change updates URL", () => {
    appSettings.openPaneFromCta();
    appSettings.goToPageSettings("Page1");
    appSettings.page.changePageNameAndVerifyUrl("Page2", true);
  });

  it("Custom slug change updates URL", () => {
    appSettings.page.changeCustomSlugAndVerifyUrl("custom");
    appSettings.page.changeCustomSlugAndVerifyUrl("custom2", true);
  });
});
