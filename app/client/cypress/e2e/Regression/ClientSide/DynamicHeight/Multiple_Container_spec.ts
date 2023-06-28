import {
  entityExplorer,
  agHelper,
  locators,
  propPane,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation for multiple container", function () {
  before(() => {
    cy.fixture("multipleContainerdsl").then((val) => {
      agHelper.AddDsl(val);
    });
  });
  it("1. Validate change in auto height width with multiple containers", function () {
    entityExplorer.SelectEntityByName("Container1");
    propPane.SelectPropertiesDropDown("height", "Fixed");
    propPane.SelectPropertiesDropDown("height", "Auto Height");
    entityExplorer.SelectEntityByName("Container2", "Container1");
    propPane.SelectPropertiesDropDown("height", "Fixed");
    propPane.SelectPropertiesDropDown("height", "Auto Height");
    entityExplorer.SelectEntityByName("Container3", "Container2");
    entityExplorer.SelectEntityByName("CheckboxGroup1", "Container3");
    propPane.SelectPropertiesDropDown("height", "Fixed");
    propPane.SelectPropertiesDropDown("height", "Auto Height");
    agHelper.Sleep(2000);
    agHelper
      .GetWidgetCSSHeight(locators._widgetInDeployed("containerwidget"))
      .then((outerContainerHeight: number) => {
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed("containerwidget"), 1)
          .then((middleContainerHeight: number) => {
            agHelper
              .GetWidgetCSSHeight(
                locators._widgetInDeployed("containerwidget"),
                2,
              )
              .then((innerContainerHeight: number) => {
                agHelper
                  .GetWidgetCSSHeight(
                    locators._widgetInDeployed("checkboxgroupwidget"),
                  )
                  .then((checkboxheight: number) => {
                    agHelper.GetNClick(locators._addOptionProperty);
                    agHelper.GetNClick(locators._addOptionProperty);
                    assertHelper.AssertNetworkStatus("@updateLayout");
                    agHelper.Sleep(3000);
                    agHelper
                      .GetWidgetCSSHeight(
                        locators._widgetInDeployed("checkboxgroupwidget"),
                      )
                      .then((newcheckboxheight: number) => {
                        expect(checkboxheight).to.not.equal(newcheckboxheight);
                      });
                  });
                agHelper.Sleep(2000);
                agHelper
                  .GetWidgetCSSHeight(
                    locators._widgetInDeployed("containerwidget"),
                  )
                  .then((outerContainerUpdatedHeight: number) => {
                    expect(outerContainerHeight).to.not.equal(
                      outerContainerUpdatedHeight,
                    );
                  });
                agHelper
                  .GetWidgetCSSHeight(
                    locators._widgetInDeployed("containerwidget"),
                    1,
                  )
                  .then((middleContainerUpdatedHeight: number) => {
                    expect(middleContainerHeight).to.not.equal(
                      middleContainerUpdatedHeight,
                    );
                  });
                agHelper
                  .GetWidgetCSSHeight(
                    locators._widgetInDeployed("containerwidget"),
                    2,
                  )
                  .then((innerContainerUpdatedHeight: number) => {
                    expect(innerContainerHeight).to.not.equal(
                      innerContainerUpdatedHeight,
                    );
                  });
              });
          });
      });
  });
});
