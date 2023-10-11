import {
  entityExplorer,
  agHelper,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation with limits", function () {
  it("1. Validate change in auto height with limits width for widgets and highlight section validation", function () {
    agHelper.AddDsl("dynamicHeightContainerdsl");

    entityExplorer.SelectEntityByName("Container1");
    propPane.SelectPropertiesDropDown("height", "Auto Height with limits");
    agHelper.HoverElement(propPane._autoHeightLimitMin);
    agHelper.AssertContains("Min-Height: 10 rows");
    agHelper.AssertCSS(
      propPane._autoHeightLimitMin_div,
      "background-color",
      "rgb(243, 43, 139)",
      0,
    );
    agHelper.HoverElement(propPane._autoHeightLimitMax);
    agHelper.AssertContains("Max-Height: 12 rows");
    propPane.SelectPropertiesDropDown("height", "Fixed");
    propPane.SelectPropertiesDropDown("height", "Auto Height with limits");
  });
});
