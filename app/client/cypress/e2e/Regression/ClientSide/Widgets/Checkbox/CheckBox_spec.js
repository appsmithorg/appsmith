const commonlocators = require("../../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Checkbox Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Checkbox", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("newFormDsl");
    });
    it("Checkbox Widget Functionality", function () {
      cy.openPropertyPane("checkboxwidget");
      /**
       * @param{Text} Random Text
       * @param{CheckboxWidget}Mouseover
       * @param{CheckboxPre Css} Assertion
       */
      cy.widgetText(
        "checker",
        formWidgetsPage.checkboxWidget,
        widgetsPage.widgetNameSpan,
      );
      /**
       * @param{Text} Random Value
       */
      cy.testCodeMirror(this.dataSet.checkbocInputName);
      cy.get(widgetsPage.checkboxLabel).should("have.text", "value");
      /**
       * @param{toggleButton Css} Assert to be checked
       */
      _.agHelper.CheckUncheck(widgetsPage.defaultcheck);
      /**
       * @param{Show Alert} Css for InputChange
       */
      cy.getAlert("onCheckChange");
      _.deployMode.DeployApp();
      //Checkbox Functionality To Check Label
      cy.get(publish.checkboxWidget + " " + "label").should(
        "have.text",
        this.dataSet.checkbocInputName,
      );
    });
    it("Checkbox Functionality To Check Disabled Widget", function () {
      cy.openPropertyPane("checkboxwidget");
      _.agHelper.CheckUncheck(commonlocators.Disablejs + " " + "input");
      _.deployMode.DeployApp();
      cy.get(publish.checkboxWidget + " " + "input").should("be.disabled");
    });
    it("Checkbox Functionality To Check Enabled Widget", function () {
      cy.openPropertyPane("checkboxwidget");
      _.agHelper.CheckUncheck(commonlocators.Disablejs + " " + "input", false);
      _.deployMode.DeployApp();
      cy.get(publish.checkboxWidget + " " + "input").should("be.enabled");
    });
    it("Checkbox Functionality To Unchecked Visible Widget", function () {
      cy.openPropertyPane("checkboxwidget");
      _.agHelper.CheckUncheck(commonlocators.visibleCheckbox, false);
      _.deployMode.DeployApp();
      cy.get(publish.checkboxWidget + " " + "input").should("not.exist");
    });
    it("Checkbox Functionality To Check Visible Widget", function () {
      cy.openPropertyPane("checkboxwidget");
      _.agHelper.CheckUncheck(commonlocators.visibleCheckbox);
      _.deployMode.DeployApp();
      cy.get(publish.checkboxWidget + " " + "input").should("be.checked");
    });

    it("Check isDirty meta property", function () {
      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(".t--property-control-text", `{{checker.isDirty}}`);
      // Check if initial value of isDirty is false
      cy.get(".t--widget-textwidget").should("contain", "false");
      // Interact with UI
      cy.get(`${formWidgetsPage.checkboxWidget} label`).first().click();
      // Check if isDirty is set to true
      cy.get(".t--widget-textwidget").should("contain", "true");
      // Change defaultCheckedState property
      cy.openPropertyPane("checkboxwidget");
      cy.get(".t--property-control-defaultstate label").last().click();
      // Check if isDirty is reset to false
      cy.get(".t--widget-textwidget").should("contain", "false");
      _.deployMode.DeployApp();
    });

    it.only("Validate onCheckChange event is triggered on programmatic state change", function () {
      cy.openPropertyPane("textwidget");
      cy.updateCodeInput(
        ".t--property-control-text",
        `{{Checkbox1.isChecked}}`,
      );
      _.agHelper.GetNAssertElementText(_.locators._textWidget, "true");

      cy.openPropertyPane("checkboxwidget");
      _.propPane.EnterJSContext(
        "onCheckChange",
        "{{showAlert('Checkbox state changed programmatically')}}",
      );

      cy.openPropertyPane("buttonwidget");
      _.propPane.EnterJSContext(
        "onClick",
        "{{Checkbox1.setValue(!Checkbox1.isChecked)}}",
      );

      _.agHelper.ClickButton("Submit");
      _.agHelper.ValidateToastMessage(
        "Checkbox state changed programmatically",
      );

      _.agHelper.GetNAssertElementText(_.locators._textWidget, "false");

      _.agHelper.ClickButton("Submit");
      _.agHelper.ValidateToastMessage(
        "Checkbox state changed programmatically",
      );

      _.agHelper.GetNAssertElementText(_.locators._textWidget, "true");

      _.deployMode.DeployApp();
    });
  },
);

afterEach(() => {
  _.deployMode.NavigateBacktoEditor();
});
