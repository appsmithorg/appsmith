import {
  entityExplorer,
  locators,
  agHelper,
  deployMode,
  propPane,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation", function () {
  it("1. Validate change with auto height width for JsonForm", function () {
    cy.fixture("jsonFormDynamicHeightDsl").then((val) => {
      agHelper.AddDsl(val);
    });
    entityExplorer.SelectEntityByName("JSONForm1", "Widgets");
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed("jsonformwidget"))
      .then((initialFormheight: number) => {
        propPane.SelectPropertiesDropDown("height", "Auto Height");
        agHelper.Sleep(5000);
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed("jsonformwidget"))
          .then((updatedFormheight: number) => {
            expect(initialFormheight).to.not.equal(updatedFormheight);
            agHelper.GetNClick(locators._showColumnButton, 0);
            agHelper.GetNClick(locators._showColumnButton, 1);
            agHelper.GetNClick(locators._showColumnButton, 2);
            propPane.SelectPropertiesDropDown("height", "Fixed");
            agHelper.Sleep(5000);
            agHelper
              .GetWidgetCSSHeight(locators._widgetInDeployed("jsonformwidget"))
              .then((reUpdatedFormheight: number) => {
                expect(updatedFormheight).to.not.equal(reUpdatedFormheight);
                agHelper.GetNClick(locators._showColumnButton, 2);
                agHelper.GetNClick(locators._showColumnButton, 1);
                propPane.SelectPropertiesDropDown("height", "Auto Height");
                agHelper.Sleep(5000);
                agHelper
                  .GetWidgetCSSHeight(
                    locators._widgetInDeployed("jsonformwidget"),
                  )
                  .then((currentformheight: number) => {
                    expect(reUpdatedFormheight).to.not.equal(currentformheight);
                  });
              });
          });
      });
  });
});
