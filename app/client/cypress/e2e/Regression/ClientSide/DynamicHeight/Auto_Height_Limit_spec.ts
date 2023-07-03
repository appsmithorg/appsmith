import {
  entityExplorer,
  locators,
  agHelper,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation with limits", function () {
  it("1. Validate change in auto height with limits width for widgets and highlight section validation", function () {
    cy.fixture("dynamicHeightContainerdsl").then((val) => {
      agHelper.AddDsl(val);
    });
    entityExplorer.SelectEntityByName("Container1");
    propPane.SelectPropertiesDropDown("height", "Auto Height with limits");
    agHelper.HoverElement(locators._autoHeightLimitMin);
    agHelper.AssertContains("Min-Height: 10 rows");
    agHelper.AssertCSS(
      locators._autoHeightLimitMin_div,
      "background-color",
      "rgb(243, 43, 139)",
      0,
    );
    agHelper.HoverElement(locators._autoHeightLimitMax);
    agHelper.AssertContains("Max-Height: 12 rows");
    propPane.SelectPropertiesDropDown("height", "Fixed");
    propPane.SelectPropertiesDropDown("height", "Auto Height with limits");
  });
});
