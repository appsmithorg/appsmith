const commonlocators = require("../../../../../locators/commonlocators.json");
const dslWithoutSchema = require("../../../../../fixtures/jsonFormDslWithoutSchema.json");

const fieldPrefix = ".t--jsonformfield";

/*
describe("Verify syntax to create Datpicker field type", () => {
  before(() => {
    const schema = {"Key": "20/03/1992"};
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
  });

  it("Validate calendar on clicking date field", () => {
    cy.xpath("//div[@data-testid='datepicker-container']").click({force:true});
    cy.get(".DayPicker-Months").should("be.visible");
  });

});

describe("Verify syntax to boolean type", () => {
    before(() => {
      const schema = {"Key": true} ;
      cy.addDsl(dslWithoutSchema);
      cy.openPropertyPane("jsonformwidget");
      cy.testJsontext("sourcedata", JSON.stringify(schema));
    });
  
    it("Validate calendar on clicking date field", () => {
      cy.get(".t--switch-widget-active").should("be.visible");
      cy.get(".t--switch-widget-active").click({force:true});

    });
  
  });

  describe("Verify syntax to create email type", () => {
    before(() => {
      const schema = {"Key" : "Value@mail.com"};
      cy.addDsl(dslWithoutSchema);
      cy.openPropertyPane("jsonformwidget");
      cy.testJsontext("sourcedata", JSON.stringify(schema));
    });
  
    it("Validate email input field in form", () => {
      cy.xpath("//input[@type='email']").should("be.visible");
      cy.xpath("//input[@type='email']").should("have.value","Value@mail.com");
    });
  
  });



  describe("Verify syntax for Text type", () => {
    before(() => {
      const schema = {"Key": "value"};
      cy.addDsl(dslWithoutSchema);
      cy.openPropertyPane("jsonformwidget");
      cy.testJsontext("sourcedata", JSON.stringify(schema));
    });
  
    it("Validate email input field in form", () => {
      cy.get(".t--jsonformfield-Key input").should("be.visible");
      cy.get(".t--jsonformfield-Key input").should("have.value","value");
    });
*/

describe("Verify mandatory field check and also submit button active/inactive", () => {
  before(() => {
    const schema = {
      name: "John",
      date_of_birth: "20/02/1990",
      employee_id: 1001,
    };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
  });

  it("Modify a field to be mandatory", () => {
    cy.get(".t--edit-column-btn")
      .first()
      .should("be.visible")
      .click({ force: true });
    cy.wait(3000);
    cy.get(".t--jsonformfield-name div :contains(" * ")").should("not.exist");
    cy.get(".t--property-control-required .bp3-control-indicator")
      .should("be.visible")
      .click({ force: true });
    cy.wait(5000);
    cy.wait("@updateLayout");
    cy.get(".t--jsonformfield-name div :contains('*')").should("be.visible");
  });
});
