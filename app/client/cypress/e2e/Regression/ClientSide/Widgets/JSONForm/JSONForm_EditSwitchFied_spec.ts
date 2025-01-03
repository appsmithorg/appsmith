import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

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

    it("verifies the label position and alignment", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.JSONFORM, 300, 100);
      propPane.EnterJSContext(
        "sourcedata",
        JSON.stringify(schema),
        true,
        false,
      );
      propPane.ChangeJsonFormFieldType("Education", "Switch");
      agHelper.AssertClassExists(
        widgetsPage.switchlabel,
        widgetsPage.switchAlignRight,
      );
      agHelper
        .GetNClick(commonlocators.optionposition)
        .last()
        .click({ force: true });
      agHelper.GetNClick(widgetsPage.rightAlign).first().click({ force: true });
      agHelper.AssertClassExists(
        widgetsPage.switchlabel,
        widgetsPage.switchAlignLeft,
      );
      agHelper
        .GetNClick(commonlocators.optionpositionL)
        .last()
        .click({ force: true });
      agHelper.AssertClassExists(
        widgetsPage.switchlabel,
        widgetsPage.switchAlignRight,
      );
      propPane.NavigateBackToPropertyPane();
    });
  },
);
