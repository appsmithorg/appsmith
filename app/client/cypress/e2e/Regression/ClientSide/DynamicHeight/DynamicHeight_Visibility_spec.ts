import {
  entityExplorer,
  locators,
  agHelper,
  deployMode,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation for Visibility", function () {
  before(() => {
    cy.fixture("invisibleWidgetdsl").then((val) => {
      agHelper.AddDsl(val);
    });
  });
  it("1. Validating visbility/invisiblity of widget with dynamic height feature", function () {
    //changing the Text Name and verifying
    agHelper.Sleep(3000);
    entityExplorer.SelectEntityByName("Container1", "Widgets");
    propPane.SelectPropertiesDropDown("height", "Auto Height");
    entityExplorer.SelectEntityByName("Input1", "Container1");
    propPane.SelectPropertiesDropDown("height", "Auto Height");
    entityExplorer.SelectEntityByName("Input2", "Container1");
    propPane.SelectPropertiesDropDown("height", "Auto Height");
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed("containerwidget"))
      .then((currentContainerHeight: number) => {
        agHelper.GetNClick(locators._widgetInCanvas("checkboxwidget"));
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed("containerwidget"))
          .then((updatedContainerHeight: number) => {
            expect(currentContainerHeight).to.equal(updatedContainerHeight);
            agHelper
              .GetElement(locators._labelContains("On"))
              .should("not.be.enabled");
          });
      });
    deployMode.DeployApp();
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed("containerwidget"))
      .then((currentContainerHeight: number) => {
        agHelper.GetNClick(".bp3-control-indicator");
        agHelper.Sleep(2000);
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed("containerwidget"))
          .then((updatedContainerHeight: number) => {
            expect(currentContainerHeight).to.not.equal(updatedContainerHeight);
            agHelper
              .GetElement(locators._labelContains("On"))
              .should("not.exist");
            agHelper
              .GetElement(locators._labelContains("Off"))
              .should("be.visible");
            agHelper.GetNClick(".bp3-control-indicator");
            agHelper.Sleep(2000);
            agHelper
              .GetWidgetCSSHeight(locators._widgetInDeployed("containerwidget"))
              .then((currentContainerHeight: number) => {
                expect(currentContainerHeight).to.not.equal(
                  updatedContainerHeight,
                );
                agHelper
                  .GetElement(locators._labelContains("Off"))
                  .should("not.exist");
                agHelper
                  .GetElement(locators._labelContains("On"))
                  .should("be.visible");
              });
          });
      });
  });
});
