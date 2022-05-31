import { ObjectsRegistry } from "../../../../support/Objects/Registry"

let agHelper = ObjectsRegistry.AggregateHelper,
    ee = ObjectsRegistry.EntityExplorer,
    locator = ObjectsRegistry.CommonLocators,
    deployMode = ObjectsRegistry.DeployMode;

describe("DocumentViewer Widget Functionality", () => {
  it("1. Add new DocumentViewer and verify in canvas", () => {
    ee.DragDropWidgetNVerify("documentviewerwidget", 300, 300);
  });

  it("2. Modify visibility & Publish app & verify", () => {
    ee.NavigateToSwitcher('explorer')
    ee.SelectEntityByName("DocumentViewer1", 'WIDGETS');
    agHelper.ToggleOnOrOff("visible", 'Off');
    deployMode.DeployApp();
    cy.get(locator._widgetInDeployed("documentviewerwidget")).should(
      "not.exist",
    );
    agHelper.NavigateBacktoEditor();
  });

  it("3. Change visibility & Publish app & verify again", () => {
    ee.SelectEntityByName("DocumentViewer1", 'WIDGETS');
    agHelper.ToggleOnOrOff("visible", 'On');
    deployMode.DeployApp();
    cy.get(locator._widgetInDeployed("documentviewerwidget")).should("exist");
  });
});
