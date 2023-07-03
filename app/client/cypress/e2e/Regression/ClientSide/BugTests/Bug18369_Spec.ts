import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators,
  agHelper = ObjectsRegistry.AggregateHelper;

describe("JS Function Execution", function () {
  before(() => {
    agHelper.AddDsl("formWithtabdsl");
    ee.NavigateToSwitcher("Explorer");
  });

  it("1. Doesn't show lint errors for 'form.hasChanges' for form in inactive tab", () => {
    ee.SelectEntityByName("Text2", "Widgets");
    agHelper.Sleep(4000);
    agHelper.AssertElementAbsence(locator._lintErrorElement);
  });
});
