import {
  agHelper,
  fakerHelper,
  draggableWidgets,
  entityExplorer,
  deployMode,
  propPane,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

import { switchlocators } from "../../../../../locators/WidgetLocators";

const explorer = require("../../../../../locators/explorerlocators.json");
const widgetsLoc = require("../../../../../locators/Widgets.json");
const widgets = require("../../../../../locators/publishWidgetspage.json");

describe("Switchgroup Widget Functionality", function () {
  /**
   * Adding switch group, checkbox group and text widgets
   */
  before(() => {
    entityExplorer.DragNDropWidget(draggableWidgets.SWITCHGROUP, 300, 300);
    entityExplorer.DragNDropWidget(draggableWidgets.CHECKBOXGROUP, 300, 500);
    entityExplorer.DragNDropWidget(draggableWidgets.TEXT, 300, 700);
    propPane.UpdatePropertyFieldValue(
      "Text",
      "{{SwitchGroup1.selectedValues[0]}}",
    );
  });

  it("1. Check for empty, duplicate values and other error texts in options", () => {
    entityExplorer.SelectEntityByName("SwitchGroup1");
    propPane.UpdatePropertyFieldValue(
      "Options",
      `[
      {
        "label": "Blue",
        "value": ""
      },
      {
        "label": "Green",
        "value": "GREEN"
      },
      {
        "label": "Red",
        "value": "RED"
      }
    ]`,
    );
    agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);
    propPane.UpdatePropertyFieldValue(
      "Options",
      `[
      {
        "label": "Blue",
        "value": ""
      },
      {
        "label": "Green",
        "value": ""
      },
      {
        "label": "Red",
        "value": "RED"
      }
    ]`,
    );
    agHelper.VerifyEvaluatedErrorMessage(
      "Duplicate values found for the following properties," +
        " in the array entries, that must be unique -- label,value.",
    );
    propPane.UpdatePropertyFieldValue(
      "Options",
      `[
        {
          "value": "Blue"
        },
        {
          "label": "Green",
          "value": "GREEN"
        },
        {
          "label": "Red",
          "value": "RED"
        }
      ]`,
    );
    agHelper.VerifyEvaluatedErrorMessage(
      "Invalid entry at index: 0. Missing required key: label",
    );
    propPane.UpdatePropertyFieldValue("Options", "hello");
    agHelper.VerifyEvaluatedErrorMessage(
      'This value does not evaluate to type Array<{ "label": "string", "value": "string" }>',
    );
  });

  it("2. test default selected value func and error texts", () => {
    entityExplorer.SelectEntityByName("SwitchGroup1");
    propPane.UpdatePropertyFieldValue(
      "Options",
      `[
      {
        "label": "Blue",
        "value": "BLUE"
      },
      {
        "label": "Green",
        "value": "GREEN"
      },
      {
        "label": "Red",
        "value": "RED"
      }
    ]`,
    );

    propPane.UpdatePropertyFieldValue("Default selected values", "1");
    agHelper.VerifyEvaluatedErrorMessage(
      "This value does not evaluate to type Array<string>",
    );
    propPane.UpdatePropertyFieldValue("Default selected values", "[]");
    agHelper.AssertElementAbsence(locators._evaluatedErrorMessage);
    propPane.UpdatePropertyFieldValue(
      "Default selected values",
      '["RED", "GREEN"]',
    );
    agHelper
      .GetElement(locators._switchGroupToggleChecked("Red"))
      .should("be.checked");
    agHelper
      .GetElement(locators._switchGroupToggleChecked("Green"))
      .should("be.checked");
  });

  //Note:  Old case, rewrittwen to using ts methods
  it("3. Setting selectedValues to undefined does not crash the app", () => {
    // Reset options for switch group
    entityExplorer.SelectEntityByName("SwitchGroup1");
    propPane.UpdatePropertyFieldValue(
      "Options",
      `[
      {
        "label": "Blue",
        "value": "BLUE"
      },
      {
        "label": "Green1",
        "value": "GREEN"
      },
      {
        "label": "Red",
        "value": "RED"
      }
    ]`,
    );
    // throw a cyclic dependency error from checkbox group
    entityExplorer.SelectEntityByName("CheckboxGroup1");
    agHelper.TypeText(widgetsLoc.RadioInput, "{{BLUE}}", 1);
    propPane.ToggleJSMode("Options", true);
    agHelper.AssertElementAbsence(locators._toastMsg);
    agHelper.GetNAssertElementText(widgets.textWidget, "RED");
  });

  it(" Set Label, Tooltip, Inline and check switch group", () => {
    entityExplorer.SelectEntityByName("SwitchGroup1");
    propPane.UpdatePropertyFieldValue("Text", "SG Widget");
    propPane.UpdatePropertyFieldValue("Tooltip", "Select any color");

    // assert label and tooltip
    deployMode.DeployApp();
    agHelper.AssertText(switchlocators.switchGroupLabel, "text", "SG Widget");
    agHelper.GetNClick(switchlocators.switchTooltip, 1);
    agHelper.AssertPopoverTooltip("Select any color");
    deployMode.NavigateBacktoEditor();

    // assert height of the container based on inline property value
    entityExplorer.SelectEntityByName("SwitchGroup1");
    agHelper.AssertElementExist(switchlocators.switchWidgetHeight("60"));
    propPane.TogglePropertyState("Inline", "Off");
    agHelper.AssertElementExist(switchlocators.switchWidgetHeight("110"));
  });
});
