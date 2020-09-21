const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const dsl = require("../../../fixtures/MultipleInput.json");
const pages = require("../../../locators/Pages.json");
const widgetsPage = require("../../../locators/Widgets.json");
const publish = require("../../../locators/publishWidgetspage.json");

describe("Binding the Datepicker and Text Widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("DatePicker-Text, Validate selectedDate functionality", function() {
    cy.openPropertyPane("inputwidget");
    cy.get(widgetsPage.defaultInput)
      .type(this.data.command)
      .type(this.data.defaultdata);
    cy.get(commonlocators.editPropCrossButton).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", this.data.defaultdata);

    //cy.get(commonlocators.toastmsg).contains("Cyclic dependency")
  });

  it("DatePicker-Text, Validate selectedDate functionality", function() {
    cy.SearchEntityandOpen("Input2");
    cy.get(widgetsPage.defaultInput)
      .type(this.data.command)
      .type(this.data.defaultMoustacheData);
    cy.get(commonlocators.editPropCrossButton).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.SearchEntityandOpen("Input3");
    cy.get(widgetsPage.defaultInput)
      .type(this.data.command)
      .type(this.data.defaultMoustacheData);
    cy.get(commonlocators.editPropCrossButton).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.PublishtheApp();

    cy.get(publish.inputWidget + " " + "input")
      .last()
      .invoke("attr", "value")
      .should("contain", this.data.defaultdata);

    cy.get(".t--draggable-inputwidget input").then(function($list) {
      expect($list).to.have.length(3);
      expect($list.eq(0))
        .invoke("attr", "value")
        .to.contain(this.data.defaultdata);
      expect($list.eq(1))
        .invoke("attr", "value")
        .to.contain(this.data.defaultdata);
      expect($list.eq(2))
        .invoke("attr", "value")
        .to.contain(this.data.defaultdata);
    });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
