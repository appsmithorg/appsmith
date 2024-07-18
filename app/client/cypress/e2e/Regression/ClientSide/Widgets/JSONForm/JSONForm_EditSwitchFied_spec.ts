import {
  agHelper,
  draggableWidgets,
  entityExplorer,
} from "../../../../../support/Objects/ObjectsCore";

const commonlocators = require("../../../../../locators/commonlocators.json");
const { propPane } = require("../../../../../support/Objects/ObjectsCore");

// this spec will have a json form with two textinput fields  and one is updated to switch field
// We will check the position property by clicking on the left and right position buttons
// here only alignment changes and the fields order in the dom changes so no assertions were added 

describe(
  "JSON Form Widget Custom Field",
  { tags: ["@tag.Widget", "@tag.JSONForm"] },
  () => {
    const schema = {
      name: "John",
      education: "1",
    };

    it("uses the custom field when the accessor matches", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.JSONFORM, 300, 100);
      propPane.EnterJSContext(
        "sourcedata",
        JSON.stringify(schema),
        true,
        false,
      );
      propPane.ChangeJsonFormFieldType("Education", "Switch");
      agHelper
        .GetNClick(commonlocators.optionposition)
        .last()
        .click({ force: true });
      agHelper
        .GetNClick(commonlocators.optionpositionL)
        .last()
        .click({ force: true });
      propPane.NavigateBackToPropertyPane();
    });
  },
);