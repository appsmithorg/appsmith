import {
  locators,
  agHelper,
  deployMode,
  propPane,
  pageSettings,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Dynamic Height Width validation for Visibility",
  { tags: ["@tag.AutoHeight"] },
  function () {
    before(() => {
      agHelper.AddDsl("invisibleWidgetdsl");
    });
    it("1. Validating visbility/invisiblity of widget with dynamic height feature", function () {
      //changing the Text Name and verifying
      EditorNavigation.SelectEntityByName("Container1", EntityType.Widget);
      propPane.SelectPropertiesDropDown("height", "Auto Height");
      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget, {}, [
        "Container1",
      ]);
      propPane.SelectPropertiesDropDown("height", "Auto Height");
      EditorNavigation.SelectEntityByName("Input2", EntityType.Widget, {}, [
        "Container1",
      ]);
      propPane.SelectPropertiesDropDown("height", "Auto Height");
      agHelper.Sleep(2000);
      agHelper
        .GetWidgetCSSHeight(
          locators._widgetInDeployed(draggableWidgets.CONTAINER),
        )
        .then((currentContainerHeight: number) => {
          agHelper.GetNClick(locators._widgetInCanvas("checkboxwidget"));
          agHelper
            .GetWidgetCSSHeight(
              locators._widgetInDeployed(draggableWidgets.CONTAINER),
            )
            .then((updatedContainerHeight: number) => {
              expect(currentContainerHeight).to.equal(updatedContainerHeight);
              agHelper
                .GetElement(propPane._labelContains("On"))
                .should("not.be.enabled");
              // agHelper.AssertElementEnabledDisabled(
              // locators._labelContains("On"),0,true
              //);
            });
        });
      deployMode.DeployApp();
      agHelper
        .GetWidgetCSSHeight(
          locators._widgetInDeployed(draggableWidgets.CONTAINER),
        )
        .then((currentContainerHeight: number) => {
          agHelper.GetNClick(pageSettings.locators._setHomePageToggle);
          agHelper.Sleep(2000);
          agHelper
            .GetWidgetCSSHeight(
              locators._widgetInDeployed(draggableWidgets.CONTAINER),
            )
            .then((updatedContainerHeight: number) => {
              expect(currentContainerHeight).to.not.equal(
                updatedContainerHeight,
              );
              agHelper.AssertElementAbsence(propPane._labelContains("On"));
              agHelper.AssertElementVisibility(propPane._labelContains("Off"));
              agHelper.GetNClick(pageSettings.locators._setHomePageToggle);
              agHelper.Sleep(2000);
              agHelper
                .GetWidgetCSSHeight(
                  locators._widgetInDeployed(draggableWidgets.CONTAINER),
                )
                .then((currentContainerHeight: number) => {
                  expect(currentContainerHeight).to.not.equal(
                    updatedContainerHeight,
                  );
                  agHelper.AssertElementAbsence(propPane._labelContains("Off"));
                  agHelper.AssertElementVisibility(
                    propPane._labelContains("On"),
                  );
                });
            });
        });
    });
  },
);
