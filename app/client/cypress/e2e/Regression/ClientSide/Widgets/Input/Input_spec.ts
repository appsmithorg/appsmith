const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Input Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Input", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("newFormDsl");
    });

    // Note: commenting it out because Drag/Drop feature is not stable on cypress.
    // it("Checks if default values are not persisted in cache after delete", function() {
    //   cy.openPropertyPane("inputwidgetv2");
    //   cy.get(widgetsPage.defaultInput)
    //     .type(this.dataSet.command)
    //     .type(this.dataSet.defaultdata);
    //   cy.get(widgetsPage.inputWidget + " " + "input")
    //     .invoke("attr", "value")
    //     .should("contain", this.dataSet.defaultdata);
    //   cy.get(commonlocators.deleteWidget).click();
    //   cy.get(explorer.addWidget).click();
    //   cy.dragAndDropToCanvas("inputwidgetv2");
    //   cy.get(widgetsPage.inputWidget + " " + "input")
    //     .invoke("attr", "value")
    //     .should("not.contain", this.dataSet.defaultdata);

    //   _.agHelper.AddDsl("tableV2NewDsl");
    //   cy.reload();
    // });

    it("1. Input Widget Functionality", function () {
      cy.openPropertyPane("inputwidgetv2");
      /**
       * @param{Text} Random Text
       * @param{InputWidget}Mouseover
       * @param{InputPre Css} Assertion
       */
      cy.widgetText("day", widgetsPage.inputWidget, widgetsPage.widgetNameSpan);
      cy.selectDropdownValue(widgetsPage.datatype, "Single-line text");

      cy.get(widgetsPage.innertext)
        .click({ force: true })
        .type(this.dataSet.para);
      cy.get(widgetsPage.inputWidget + " " + "input")
        .invoke("attr", "value")
        .should("contain", this.dataSet.para);
      //cy.openPropertyPane("inputwidgetv2");
      _.propPane.UpdatePropertyFieldValue(
        "Default value",
        this.dataSet.defaultdata,
      );
      cy.get(widgetsPage.inputWidget + " " + "input")
        .invoke("attr", "value")
        .should("contain", this.dataSet.defaultdata);
      cy.testJsontext("placeholder", this.dataSet.placeholder);
      /**
       * @param{Widget} Widget InnerCss
       */
      cy.get(widgetsPage.innertext)
        .invoke("attr", "placeholder")
        .should("contain", this.dataSet.placeholder);
      cy.testJsontext("regex", this.dataSet.regex);
      /**
       * @param{Show Alert} Css for InputChange
       */
      cy.getAlert("onTextChanged");
      _.deployMode.DeployApp();
    });

    it("2. Input Widget Functionality To Validate Default Text and Placeholder", function () {
      cy.get(publish.inputWidget + " " + "input")
        .invoke("attr", "value")
        .should("contain", this.dataSet.defaultdata);
      cy.get(publish.inputWidget + " " + "input")
        .invoke("attr", "placeholder")
        .should("contain", this.dataSet.placeholder);
      _.deployMode.NavigateBacktoEditor();
    });

    it("3. isSpellCheck: true", function () {
      cy.openPropertyPane("inputwidgetv2");
      _.agHelper.CheckUncheck(commonlocators.spellCheck + " " + "input");
      _.deployMode.DeployApp();
      cy.get(publish.inputWidget + " " + "input")
        .invoke("attr", "spellcheck")
        .should("eq", "true");
      _.deployMode.NavigateBacktoEditor();

      //isSpellCheck: false
      cy.openPropertyPane("inputwidgetv2");
      _.agHelper.CheckUncheck(commonlocators.spellCheck + " " + "input", false);
      _.deployMode.DeployApp();
      cy.get(publish.inputWidget + " " + "input")
        .invoke("attr", "spellcheck")
        .should("eq", "false");
      _.deployMode.NavigateBacktoEditor();
    });

    it("4. Input Widget Functionality To Check Disabled Widget", function () {
      cy.openPropertyPane("inputwidgetv2");
      _.agHelper.CheckUncheck(commonlocators.Disablejs + " " + "input");
      _.deployMode.DeployApp();
      cy.get(publish.inputWidget + " " + "input").should("be.disabled");
      _.deployMode.NavigateBacktoEditor();

      //Input Widget Functionality To Check Enabled Widget
      cy.openPropertyPane("inputwidgetv2");
      _.agHelper.CheckUncheck(commonlocators.Disablejs + " " + "input", false);
      _.deployMode.DeployApp();
      cy.get(publish.inputWidget + " " + "input").should("be.enabled");
      _.deployMode.NavigateBacktoEditor();
    });
    it("5. Input Functionality To Unchecked Visible Widget", function () {
      cy.openPropertyPane("inputwidgetv2");
      _.agHelper.CheckUncheck(commonlocators.visibleCheckbox, false);
      _.deployMode.DeployApp();
      cy.get(publish.inputWidget + " " + "input").should("not.exist");
      _.deployMode.NavigateBacktoEditor();

      //Input Functionality To Check Visible Widget
      cy.openPropertyPane("inputwidgetv2");
      _.agHelper.CheckUncheck(commonlocators.visibleCheckbox);
      _.deployMode.DeployApp();
      cy.get(publish.inputWidget + " " + "input").should("be.visible");
      _.deployMode.NavigateBacktoEditor();
    });

    it("6. Input Functionality To check number input type with custom regex", function () {
      cy.openPropertyPane("inputwidgetv2");
      cy.selectDropdownValue(widgetsPage.datatype, "Number");
      cy.testJsontext("regex", "^s*(?=.*[1-9])d*(?:.d{1,2})?s*$");
      cy.get(widgetsPage.innertext).click().clear().type("1.255");
      cy.get(".bp3-popover-content").should(($x) => {
        expect($x).contain("Invalid input");
      });
      cy.get(widgetsPage.innertext).click({ force: true }).clear();
      cy.closePropertyPane("inputwidgetv2");
    });

    it("7. Input label renders if label prop is not empty", () => {
      //Input label wrapper do not show if lable and tooltip is empty
      cy.get("[data-testid='label-container']").should("not.exist");

      cy.openPropertyPane("inputwidgetv2");
      // enter label in property pan
      cy.get(widgetsPage.inputTextControl).type("Label1");
      // test if label shows up with correct text
      cy.get(".t--input-widget-label").contains("Label1");

      //Input tooltip renders if tooltip prop is not empty
      cy.openPropertyPane("inputwidgetv2");
      // enter tooltip in property pan
      cy.get(widgetsPage.inputTooltipControl).type("Helpfull text for input");
      // tooltip help icon shows
      cy.get(".t--input-widget-tooltip").should("be.visible");

      //Input icon shows on icon select
      cy.selectDropdownValue(widgetsPage.datatype, "Single-line text");
      cy.wait(1000);
      cy.moveToStyleTab();
      cy.get(".t--property-control-icon .bp3-icon-caret-down").click({
        force: true,
      });
      cy.get(".bp3-icon-add").first().click({ force: true });
      cy.get(".bp3-input-group .bp3-icon-add").should("exist");
    });
  },
);
afterEach(() => {
  // put your clean up code if any
});
