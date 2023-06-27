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
      .then((oheight: number) => {
        agHelper
          .GetWidgetCSSHeight(locators._widgetInDeployed("containerwidget"), 1)
          .then((mheight: number) => {
            agHelper
              .GetWidgetCSSHeight(
                locators._widgetInDeployed("containerwidget"),
                2,
              )
              .then((iheight: number) => {
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
                  .then((onewheight: number) => {
                    expect(oheight).to.not.equal(onewheight);
                  });
                agHelper
                  .GetWidgetCSSHeight(
                    locators._widgetInDeployed("containerwidget"),
                    1,
                  )
                  .then((mnewheight: number) => {
                    expect(mheight).to.not.equal(mnewheight);
                  });
                agHelper
                  .GetWidgetCSSHeight(
                    locators._widgetInDeployed("containerwidget"),
                    2,
                  )
                  .then((inewheight: number) => {
                    expect(iheight).to.not.equal(inewheight);
                  });
              });
          });
      });
  });
});
