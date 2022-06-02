const jsonform = require("../../../../../locators/jsonFormWidget.json");
const dslWithoutSchema = require("../../../../../fixtures/jsonFormDslWithoutSchema.json");
const jsonText = require("../../../../../fixtures/jsonTextDsl.json");

describe("Verify syntax to create Datpicker field type", () => {
  before(() => {
    const schema = { Key: "20/03/1992" };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
  });

  it("Validate calendar on clicking date field", () => {
    cy.xpath(jsonform.datepickerContainer).click({
      force: true,
    });
    cy.get(jsonform.calendarPopup).should("be.visible");
  });
});

describe("Verify syntax to boolean type", () => {
  before(() => {
    const schema = { Key: true };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
  });

  it("Validate calendar on clicking date field", () => {
    cy.get(jsonform.switchStatus).should("be.visible");
    cy.get(jsonform.switchStatus).click({ force: true });
  });
});

describe("Verify syntax to create email type", () => {
  before(() => {
    const schema = { Key: "Value@mail.com" };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
  });

  it("Validate email input field in form", () => {
    cy.xpath(jsonform.emailField).should("be.visible");
    cy.xpath(jsonform.emailField).should("have.value", "Value@mail.com");
  });
});

describe("Verify syntax for Text type", () => {
  before(() => {
    const schema = { Key: "value" };
    cy.addDsl(dslWithoutSchema);
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
  });

  it("Validate email input field in form", () => {
    cy.get(jsonform.keyInput).should("be.visible");
    cy.get(jsonform.keyInput).should("have.value", "value");
  });
});

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
    cy.get(jsonform.settings)
      .first()
      .should("be.visible")
      .click({ force: true });
    cy.wait(3000);
    cy.get(jsonform.mandatoryAsterisk).should("not.exist");
    cy.get(jsonform.mandatoryFieldControl)
      .should("be.visible")
      .click({ force: true });
    cy.wait(5000);
    cy.get(jsonform.mandatoryAsterisk).should("be.visible");
  });

  it("Checks when mandatory field is blank", () => {
    cy.get(jsonform.jsformInput).clear({ force: true });
    cy.get(jsonform.msg).should("have.text", "This field is required");
    cy.get(jsonform.submit).should("be.disabled");
    cy.get(jsonform.jsformInput).type("test Mandatory");
    cy.get(jsonform.msg).should("not.exist");
    cy.get(jsonform.submit).should("be.enabled");
  });
});

describe("Verify property name change with json/text widget binding", () => {
  before(() => {
    cy.addDsl(jsonText);
    cy.openPropertyPane("jsonformwidget");
  });

  it("Modify property name and check how the binding value changes", () => {
    cy.get(jsonform.settings)
      .first()
      .should("be.visible")
      .click({ force: true });
    cy.wait(3000);
    cy.get(jsonform.propertyName)
      .find(".CodeMirror")
      .first()
      .type("NewProperty");
    cy.wait(500);
  });

  /* This part to be uncommented once the existing bug is fixed
    it("Check binding property value in Text widget", () => {
        cy.SearchEntityandOpen("Text1");
        cy.wait(3000);

    })
    */
});
