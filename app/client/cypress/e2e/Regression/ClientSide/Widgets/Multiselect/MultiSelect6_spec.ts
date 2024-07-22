import {
  agHelper,
  entityExplorer,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";
const defaultValue = `[
    "GREEN"
  ]`;
describe(
  "Multi Select widget Tests",
  { tags: ["@tag.Widget", "@tag.Multiselect"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify("multiselectwidgetv2", 550, 100);
    });

    it("1. Verify background color for selected option", () => {
      EditorNavigation.SelectEntityByName("MultiSelect1", EntityType.Widget);
      propPane.ToggleJSMode("sourcedata");
      propPane.UpdatePropertyFieldValue(
        "Source Data",
        `[
          {
            "name": "Blue",
            "code": "BLUE"
          },
          {
            "name": "Green",
            "code": "GREEN"
          }
        ]`,
      );

      //update default select value
      propPane.UpdatePropertyFieldValue(
        "Default selected values",
        defaultValue,
      );
      //enter preview mode
      agHelper.GetNClick(locators._enterPreviewMode);
      // clicking on select to open dropdown
      cy.get(".rc-select-selector").last().click({ force: true });
      // assert background color for selected option
      agHelper.AssertCSS(
        `.rc-virtual-list .rc-select-item-option-selected`,
        "background-color",
        "rgb(227, 223, 251)",
        0,
      );
    });
  },
);
