import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators,
  agHelper = ObjectsRegistry.AggregateHelper;

describe("JS Function Execution", function () {
  before(() => {
    agHelper.AddDsl("formChangeDSL");
    ee.NavigateToSwitcher("Explorer");
  });

  it("1. Doesn't show lint errors for 'form.hasChanges'", () => {
    ee.SelectEntityByName("Button1", "Widgets");
    agHelper.Sleep(4000);
    agHelper.AssertElementAbsence(locator._lintErrorElement);
  });
});
