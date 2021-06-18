const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/newFormDsl.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");

describe("Input Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  // Note: commenting it out because Drag/Drop feature is not stable on cypress.
  // it("Checks if default values are not persisted in cache after delete", function() {
  //   cy.openPropertyPane("inputwidget");
  //   cy.get(widgetsPage.defaultInput)
  //     .type(this.data.command)
  //     .type(this.data.defaultdata);
  //   cy.get(widgetsPage.inputWidget + " " + "input")
  //     .invoke("attr", "value")
  //     .should("contain", this.data.defaultdata);
  //   cy.get(commonlocators.deleteWidget).click();
  //   cy.get(explorer.addWidget).click();
  //   cy.dragAndDropToCanvas("inputwidget");
  //   cy.get(widgetsPage.inputWidget + " " + "input")
  //     .invoke("attr", "value")
  //     .should("not.contain", this.data.defaultdata);

  //   cy.addDsl(dsl);
  //   cy.reload();
  // });

  it("Input Widget Functionality", function() {
    cy.openPropertyPane("inputwidget");
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
      .click();
    cy.get(widgetsPage.innertext)
      .click({ force: true })
      .type(this.data.para);
    cy.get(widgetsPage.inputWidget + " " + "input")
      .invoke("attr", "value")
      .should("contain", this.data.para);
    //cy.openPropertyPane("inputwidget");
    cy.get(widgetsPage.defaultInput)
      .type(this.data.command)
      .type(this.data.defaultdata);
    cy.get(widgetsPage.inputWidget + " " + "input")
      .invoke("attr", "value")
      .should("contain", this.data.defaultdata);
    cy.get(widgetsPage.placeholder)
      .type(this.data.command)
      .type(this.data.placeholder);
    /**
     * @param{Widget} Widget InnerCss
     */
    cy.get(widgetsPage.innertext)
      .invoke("attr", "placeholder")
      .should("contain", this.data.placeholder);
    cy.get(widgetsPage.Regex)
      .click()
      .type(this.data.regex);
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
  it("Input Widget Functionality To Check Disabled Widget", function() {
    cy.openPropertyPane("inputwidget");
    cy.togglebar(commonlocators.Disablejs + " " + "input");
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input").should("be.disabled");
    cy.get(publish.backToEditor).click({ force: true });
  });
  it("Input Widget Functionality To Check Enabled Widget", function() {
    cy.openPropertyPane("inputwidget");
    cy.togglebarDisable(commonlocators.Disablejs + " " + "input");
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input").should("be.enabled");
    cy.get(publish.backToEditor).click({ force: true });
  });
  it("Input Functionality To Unchecked Visible Widget", function() {
    cy.openPropertyPane("inputwidget");
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input").should("not.exist");
    cy.get(publish.backToEditor).click({ force: true });
  });
  it("Input Functionality To Check Visible Widget", function() {
    cy.openPropertyPane("inputwidget");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.inputWidget + " " + "input").should("be.visible");
    cy.get(publish.backToEditor).click({ force: true });
  });

  it("Input Functionality To check number input type with custom regex", function() {
    cy.openPropertyPane("inputwidget");
    cy.get(commonlocators.dataType)
      .last()
      .click();
    /*cy.get(
      `${commonlocators.dataType} .single-select:contains("Number")`,
    ).click();*/
    cy.get(".t--dropdown-option")
      .children()
      .contains("Number")
      .click();
    cy.testJsontext("regex", "^s*(?=.*[1-9])d*(?:.d{1,2})?s*$");
    cy.get(widgetsPage.innertext)
      .click()
      .clear()
      .type("1.255");
    cy.get(".bp3-popover-content").should(($x) => {
      expect($x).contain("Invalid input");
    });
    cy.get(widgetsPage.innertext)
      .click()
      .clear();
  });
});
afterEach(() => {
  // put your clean up code if any
});
