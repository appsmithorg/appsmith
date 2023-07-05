import {
  entityExplorer,
  agHelper,
  locators,
  propPane,
  assertHelper,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation for multiple container", function () {
  before(() => {
    agHelper.AddDsl("multipleContainerdsl");
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
    agHelper
      .GetWidgetCSSHeight(
        locators._widgetInDeployed(draggableWidgets.CONTAINER),
      )
      .then((outerContainerHeight: number) => {
        agHelper
          .GetWidgetCSSHeight(
            locators._widgetInDeployed(draggableWidgets.CONTAINER),
            1,
          )
          .then((middleContainerHeight: number) => {
            agHelper
              .GetWidgetCSSHeight(
                locators._widgetInDeployed(draggableWidgets.CONTAINER),
                2,
              )
              .then((innerContainerHeight: number) => {
                agHelper
                  .GetWidgetCSSHeight(
                    locators._widgetInDeployed(draggableWidgets.CHECKBOXGROUP),
                  )
                  .then((checkboxheight: number) => {
                    agHelper.GetNClick(propPane._addOptionProperty);
                    agHelper.GetNClick(propPane._addOptionProperty);
                    assertHelper.AssertNetworkStatus("@updateLayout", 200);
                    agHelper
                      .GetWidgetCSSHeight(
                        locators._widgetInDeployed(
                          draggableWidgets.CHECKBOXGROUP,
                        ),
                      )
                      .then((newcheckboxheight: number) => {
                        expect(checkboxheight).to.not.equal(newcheckboxheight);
                      });
                  });
                agHelper
                  .GetWidgetCSSHeight(
                    locators._widgetInDeployed(draggableWidgets.CONTAINER),
                  )
                  .then((outerContainerUpdatedHeight: number) => {
                    expect(outerContainerHeight).to.not.equal(
                      outerContainerUpdatedHeight,
                    );
                  });
                agHelper
                  .GetWidgetCSSHeight(
                    locators._widgetInDeployed(draggableWidgets.CONTAINER),
                    1,
                  )
                  .then((middleContainerUpdatedHeight: number) => {
                    expect(middleContainerHeight).to.not.equal(
                      middleContainerUpdatedHeight,
                    );
                  });
                agHelper
                  .GetWidgetCSSHeight(
                    locators._widgetInDeployed(draggableWidgets.CONTAINER),
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
