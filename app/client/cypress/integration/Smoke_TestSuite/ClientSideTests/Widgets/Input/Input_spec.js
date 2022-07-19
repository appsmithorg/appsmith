const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/newFormDsl.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");

describe("Input Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  // Note: commenting it out because Drag/Drop feature is not stable on cypress.
  // it("Checks if default values are not persisted in cache after delete", function() {
  //   cy.openPropertyPane("inputwidgetv2");
  //   cy.get(widgetsPage.defaultInput)
  //     .type(this.data.command)
  //     .type(this.data.defaultdata);
  //   cy.get(widgetsPage.inputWidget + " " + "input")
  //     .invoke("attr", "value")
  //     .should("contain", this.data.defaultdata);
  //   cy.get(commonlocators.deleteWidget).click();
  //   cy.get(explorer.addWidget).click();
  //   cy.dragAndDropToCanvas("inputwidgetv2");
  //   cy.get(widgetsPage.inputWidget + " " + "input")
  //     .invoke("attr", "value")
  //     .should("not.contain", this.data.defaultdata);

  //   cy.addDsl(dsl);
  //   cy.reload();
  // });

  it("Input Widget Functionality", function() {
    cy.openPropertyPane("inputwidgetv2");
    /**
     * @param{Text} Random Text
     * @param{InputWidget}Mouseover
     * @param{InputPre Css} Assertion
     */
    cy.widgetText("day", widgetsPage.inputWidget, widgetsPage.inputval);
    cy.get(widgetsPage.datatype)
      .last()
      .click({ force: true })
      .children()
      .contains("Text")
      .click({ force: true });
    cy.get(widgetsPage.innertext)
      .click({ force: true })
      .type(this.data.para);
    cy.get(widgetsPage.inputWidget + " " + "input")
      .invoke("attr", "value")
      .should("contain", this.data.para);
    //cy.openPropertyPane("inputwidgetv2");
    cy.testJsontext("defaulttext", this.data.defaultdata);
    cy.get(widgetsPage.inputWidget + " " + "input")
      .invoke("attr", "value")
      .should("contain", this.data.defaultdata);
    cy.testJsontext("placeholder", this.data.placeholder);
    /**
     * @param{Widget} Widget InnerCss
     */
    cy.get(widgetsPage.innertext)
      .invoke("attr", "placeholder")
      .should("contain", this.data.placeholder);
    cy.testJsontext("regex", this.data.regex);
    /**
     * @param{Show Alert} Css for InputChange
     */
    cy.getAlert(
      commonlocators.optionchangetextInput,
      widgetsPage.inputOnTextChange,
    );
    cy.PublishtheApp();
  });
  it("Input Widget Functionality To Validate Default Text and Placeholder", function() {
    cy.get(publish.inputWidget + " " + "input")
      .invoke("attr", "value")
      .should("contain", this.data.defaultdata);
    cy.get(publish.inputWidget + " " + "input")
      .invoke("attr", "placeholder")
      .should("contain", this.data.placeholder);
    cy.get(publish.backToEditor).click({ force: true });
  });

  it("isSpellCheck: true", function() {
    cy.openPropertyPane("inputwidgetv2");
    cy.togglebar(commonlocators.spellCheck + " " + "input");
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input")
      .invoke("attr", "spellcheck")
      .should("eq", "true");
    cy.get(publish.backToEditor).click({ force: true });
  });

  it("isSpellCheck: false", function() {
    cy.openPropertyPane("inputwidgetv2");
    cy.togglebarDisable(commonlocators.spellCheck + " " + "input");
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input")
      .invoke("attr", "spellcheck")
      .should("eq", "false");
    cy.get(publish.backToEditor).click({ force: true });
  });

  it("Input Widget Functionality To Check Disabled Widget", function() {
    cy.openPropertyPane("inputwidgetv2");
    cy.togglebar(commonlocators.Disablejs + " " + "input");
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input").should("be.disabled");
    cy.get(publish.backToEditor).click({ force: true });
  });
  it("Input Widget Functionality To Check Enabled Widget", function() {
    cy.openPropertyPane("inputwidgetv2");
    cy.togglebarDisable(commonlocators.Disablejs + " " + "input");
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input").should("be.enabled");
    cy.get(publish.backToEditor).click({ force: true });
  });
  it("Input Functionality To Unchecked Visible Widget", function() {
    cy.openPropertyPane("inputwidgetv2");
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input").should("not.exist");
    cy.get(publish.backToEditor).click({ force: true });
  });
  it("Input Functionality To Check Visible Widget", function() {
    cy.openPropertyPane("inputwidgetv2");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input").should("be.visible");
    cy.get(publish.backToEditor).click({ force: true });
  });

  it("Input Functionality To check number input type with custom regex", function() {
    cy.openPropertyPane("inputwidgetv2");
    cy.get(commonlocators.dataType)
      .last()
      .click({ force: true });
    /*cy.get(
      `${commonlocators.dataType} .single-select:contains("Number")`,
    ).click();*/
    cy.get(".t--dropdown-option")
      .children()
      .contains("Number")
      .click({ force: true });
    cy.testJsontext("regex", "^s*(?=.*[1-9])d*(?:.d{1,2})?s*$");
    cy.get(widgetsPage.innertext)
      .click()
      .clear()
      .type("1.255");
    cy.get(".bp3-popover-content").should(($x) => {
      expect($x).contain("Invalid input");
    });
    cy.get(widgetsPage.innertext)
      .click({ force: true })
      .clear();
    cy.closePropertyPane("inputwidgetv2");
  });

  it("Input label wrapper do not show if lable and tooltip is empty", () => {
    cy.get("[data-cy='label-container']").should("not.exist");
  });

  it("Input label renders if label prop is not empty", () => {
    cy.openPropertyPane("inputwidgetv2");
    // enter label in property pan
    cy.get(widgetsPage.inputTextControl).type("Label1");
    // test if label shows up with correct text
    cy.get(".t--input-widget-label").contains("Label1");
  });

  it("Input tooltip renders if tooltip prop is not empty", () => {
    cy.openPropertyPane("inputwidgetv2");
    // enter tooltip in property pan
    cy.get(widgetsPage.inputTooltipControl).type("Helpfull text for input");
    // tooltip help icon shows
    cy.get(".t--input-widget-tooltip").should("be.visible");
  });

  it("Input icon shows on icon select", () => {
    cy.selectDropdownValue(commonlocators.dataType, "Text");
    cy.get(".t--property-control-icon .bp3-icon-caret-down").click({
      force: true,
    });
    cy.get(".bp3-icon-add")
      .first()
      .click({ force: true });
    cy.get(".bp3-input-group .bp3-icon-add").should("exist");
  });

  it("Input value of number type should reflect the default text value 0", () => {
    cy.selectDropdownValue(commonlocators.dataType, "Number");
    /*cy.get(widgetsPage.defaultInput)
      .click({ force: true })
      .type("0");*/
    cy.testJsontext("defaulttext", "0");
    cy.closePropertyPane("inputwidgetv2");
    cy.get(widgetsPage.innertext)
      .invoke("val")
      .then((text) => {
        expect(text).to.equal("0");
      });
  });
});
afterEach(() => {
  // put your clean up code if any
});
