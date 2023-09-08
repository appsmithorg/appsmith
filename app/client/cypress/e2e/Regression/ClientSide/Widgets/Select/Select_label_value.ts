import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe("Select Widget Functionality", function () {
  it("Add new Select widget", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.SELECT, 450, 200);
    agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
      expect($selectedValue).to.eq("Green");
    });
    propPane.UpdatePropertyFieldValue("Default selected value", "BLUE");
    agHelper.ReadSelectedDropDownValue().then(($selectedValue) => {
      expect($selectedValue).to.eq("Blue");
      expect($selectedValue).not.to.contain("Green");
    });
    propPane.ToggleJSMode("sourcedata");

    propPane.UpdatePropertyFieldValue(
      "Source Data",
      `[
      {
        "1": "Blue",
        "2": ""
      },
      {
        "1": "Green",
        "2": "GREEN"
      },
      {
        "1": "Red",
        "2": "RED",
        "3": "red"
      }
    ]`,
    );

    agHelper.GetNClick(propPane._selectPropDropdown("labelkey"));
    ["1", "2", "3"].forEach((d) => {
      agHelper.AssertElementExist(propPane._dropDownValue(d));
    });

    agHelper.GetNClick(propPane._selectPropDropdown("valuekey"), 0, true);
    ["1", "2", "3"].forEach((d) => {
      agHelper.AssertElementExist(propPane._dropDownValue(d));
    });

    propPane.UpdatePropertyFieldValue(
      "Source Data",
      `[
      {
        "test1": "label1",
        "test2": "value1"
      },
      {
        "test1": "label2",
        "test2": "value2"
      },
      {
        "test1": "label3",
        "test2": "value3"
      }
    ]`,
    );

    agHelper.GetNClick(propPane._selectPropDropdown("label"));
    ["test1", "test2"].forEach((d) => {
      agHelper.AssertElementExist(propPane._dropDownValue(d));
    });

    agHelper.GetNClick(propPane._selectPropDropdown("value"), 0, true);
    ["test1", "test2"].forEach((d) => {
      agHelper.AssertElementExist(propPane._dropDownValue(d));
    });

    propPane.SelectPropertiesDropDown("label", "test1");

    propPane.SelectPropertiesDropDown("value", "test2", "Action", 0, 1);

    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 450, 500);

    propPane.UpdatePropertyFieldValue(
      "Text",
      `{{Select1.selectedOptionLabel}}:{{Select1.selectedOptionValue}}`,
    );

    [
      {
        label: "label1",
        text: "label1:value1",
      },
      {
        label: "label2",
        text: "label2:value2",
      },
      {
        label: "label3",
        text: "label3:value3",
      },
    ].forEach((d) => {
      agHelper.SelectDropDown(d.label);
      agHelper.AssertText(locators._textInside, "text", d.text);
    });

    (cy as any).openPropertyPane("selectwidget");

    propPane.SelectPropertiesDropDown("label", "test2");

    propPane.SelectPropertiesDropDown("value", "test1", "Action", 0, 1);

    [
      {
        label: "value1",
        text: "value1:label1",
      },
      {
        label: "value2",
        text: "value2:label2",
      },
      {
        label: "value3",
        text: "value3:label3",
      },
    ].forEach((d) => {
      agHelper.SelectDropDown(d.label);
      agHelper.AssertText(locators._textInside, "text", d.text);
    });
  });
});
