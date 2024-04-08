import * as _ from "../../../../../support/Objects/ObjectsCore";
const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");

describe(
  "Select Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Multiselect"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("emptyDSL");
    });
    beforeEach(() => {
      cy.wait(2000);
    });
    it("Add new Select widget", () => {
      _.entityExplorer.DragDropWidgetNVerify(
        _.draggableWidgets.MULTISELECT,
        450,
        200,
      );
      _.agHelper.AssertElementExist(".t--widget-multiselectwidgetv2");

      _.propPane.ToggleJSMode("sourcedata");

      _.propPane.UpdatePropertyFieldValue(
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

      _.agHelper.GetNClick(_.propPane._selectPropDropdown("labelkey"));
      ["1", "2", "3"].forEach((d) => {
        _.agHelper.AssertElementExist(_.propPane._dropDownValue(d));
      });

      _.agHelper.GetNClick(_.propPane._selectPropDropdown("valuekey"), 0, true);
      ["1", "2", "3"].forEach((d) => {
        _.agHelper.AssertElementExist(_.propPane._dropDownValue(d));
      });

      _.propPane.UpdatePropertyFieldValue(
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

      _.agHelper.GetNClick(_.propPane._selectPropDropdown("label"));
      ["test1", "test2"].forEach((d) => {
        _.agHelper.AssertElementExist(_.propPane._dropDownValue(d));
      });

      _.agHelper.GetNClick(_.propPane._selectPropDropdown("value"), 0, true);
      ["test1", "test2"].forEach((d) => {
        _.agHelper.AssertElementExist(_.propPane._dropDownValue(d));
      });

      _.propPane.SelectPropertiesDropDown("label", "test1");

      _.propPane.SelectPropertiesDropDown("value", "test2", "Action", 0, 1);

      _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TEXT, 450, 500);

      _.propPane.UpdatePropertyFieldValue(
        "Text",
        `{{MultiSelect1.selectedOptionLabels.toString()}}:{{MultiSelect1.selectedOptionValues.toString()}}`,
      );

      [
        {
          label: "label1",
          text: "label1:value1",
        },
        {
          label: "label2",
          text: "label1,label2:value1,value2",
        },
        {
          label: "label3",
          text: "label1,label2,label3:value1,value2,value3",
        },
      ].forEach((d) => {
        cy.get(formWidgetsPage.multiSelectWidget)
          .find(".rc-select-selector")
          .click({
            force: true,
          });

        cy.get(".rc-select-item").contains(d.label).click({
          force: true,
        });
        cy.get(commonlocators.TextInside).first().should("have.text", d.text);
      });

      (cy as any).openPropertyPane("multiselectwidgetv2");

      _.propPane.SelectPropertiesDropDown("label", "test2");

      _.propPane.SelectPropertiesDropDown("value", "test1", "Action", 0, 1);

      _.agHelper.RefreshPage();

      [
        {
          label: "value1",
          text: "value1:label1",
        },
        {
          label: "value2",
          text: "value1,value2:label1,label2",
        },
        {
          label: "value3",
          text: "value1,value2,value3:label1,label2,label3",
        },
      ].forEach((d) => {
        cy.get(formWidgetsPage.multiSelectWidget)
          .find(".rc-select-selector")
          .click({
            force: true,
          });

        cy.get(".rc-select-item").contains(d.label).click({
          force: true,
        });
        cy.get(commonlocators.TextInside).first().should("have.text", d.text);
      });
    });
  },
);
