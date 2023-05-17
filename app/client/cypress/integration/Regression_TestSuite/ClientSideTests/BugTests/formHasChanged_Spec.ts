import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators,
  agHelper = ObjectsRegistry.AggregateHelper;

describe("JS Function Execution", function () {
  before(() => {
    cy.fixture("formChangeDSL.json").then((val: any) => {
      agHelper.AddDsl(val);
    });
    ee.NavigateToSwitcher("explorer");
  });

  it("Doesn't show lint errors for 'form.hasChanges'", () => {
    ee.SelectEntityByName("Button1", "Widgets");
    agHelper.Sleep(4000);
    agHelper.AssertElementAbsence(locator._lintErrorElement);
  });
});
