import {
  entityExplorer,
  locators,
  agHelper,
  deployMode,
  propPane,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation", function () {
  it("1. Validate change with auto height width for Form/Switch", function () {
    cy.fixture("dynamicHeightFormSwitchdsl").then((val) => {
      agHelper.AddDsl(val);
    });
    entityExplorer.SelectEntityByName("Form1", "Widgets");
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed("formwidget"))
      .then((formheight) => {
        propPane.SelectPropertiesDropDown("height", "Auto Height");
        entityExplorer.SelectEntityByName("SwitchGroup1", "Form1");
        propPane.SelectPropertiesDropDown("height", "Auto Height");
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed("switchgroupwidget"))
          .then((CurrentSwitchHeight) => {
            agHelper
              .GetWidgetCSSHeight(locators._widgetInDeployed("formwidget"))
              .then((CurrentFormHeight) => {
                // propPane.TypeTextIntoField('options',
                // cy.updateCodeInput(
                // ".t--property-control-options",
                agHelper.UpdateCodeInput(
                  ".t--property-control-options",
                  `[
                      {"label": "Blue","value": "BLUE"},
                      { "label": "Green","value": "GREEN"},
                      {"label": "Red","value": "RED"},
                      { "label": "Yellow","value": "YELLOW"},
                      {"label": "Purple","value": "PURPLE"},
                      {"label": "Pink","value": "PINK"},
                      {"label": "Black","value": "BLACK"},
                      {"label": "Grey","value": "GREY"},
                      {"label": "Orange","value": "ORANGE"},
                      {"label": "Cream","value": "CREAM"}
                    ]`,
                );
                agHelper
                  .GetWidgetCSSHeight(
                    locators._widgetInDeployed("switchgroupwidget"),
                  )
                  .then((UpdatedSwitchHeight: number) => {
                    agHelper
                      .GetWidgetCSSHeight(
                        locators._widgetInDeployed("formwidget"),
                      )
                      .then((UpdatedFormHeight: number) => {
                        expect(CurrentFormHeight).to.not.equal(
                          UpdatedFormHeight,
                        );
                        expect(CurrentSwitchHeight).to.not.equal(
                          UpdatedSwitchHeight,
                        );
                      });
                  });
              });
          });
      });
    agHelper.GetNClick(
      ".t--draggable-switchgroupwidget .bp3-control-indicator",
    );
    agHelper.Sleep(3000);
    agHelper.GetElement(locators._modal).should("have.length", 1);
    agHelper
      .GetElement(".t--widget-propertypane-toggle")
      .last()
      .click({ force: true });
    propPane.SelectPropertiesDropDown("height", "Auto Height");
    agHelper.Sleep(3000);
    agHelper.GetNClick(locators._closeModal, 0, true);
  });
});
