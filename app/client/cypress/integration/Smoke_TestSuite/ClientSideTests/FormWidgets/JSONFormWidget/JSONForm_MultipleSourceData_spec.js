const commonlocators = require("../../../../../locators/commonlocators.json");
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
    cy.xpath("//div[@data-testid='datepicker-container']").click({
      force: true,
    });
    cy.get(".DayPicker-Months").should("be.visible");
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
    cy.get(".t--switch-widget-active").should("be.visible");
    cy.get(".t--switch-widget-active").click({ force: true });
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
    cy.xpath("//input[@type='email']").should("be.visible");
    cy.xpath("//input[@type='email']").should("have.value", "Value@mail.com");
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
    cy.get(".t--jsonformfield-Key input").should("be.visible");
    cy.get(".t--jsonformfield-Key input").should("have.value", "value");
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
    cy.get(".t--jsonformfield-name div :contains('*')").should("be.visible");
  });

  it("Checks when mandatory field is blank", () => {
    cy.get(".t--jsonformfield-name input").clear({ force: true });
    cy.get(".bp3-popover-content").should(
      "have.text",
      "This field is required",
    );
    cy.get("button:contains('Submit')").should("be.disabled");
    cy.get(".t--jsonformfield-name input").type("test Mandatory");
    cy.get(".bp3-popover-content").should("not.exist");
    cy.get("button:contains('Submit')").should("be.enabled");
  });
});

describe("Verify property name change with json/text widget binding", () => {
  before(() => {
    cy.addDsl(jsonText);
    cy.openPropertyPane("jsonformwidget");
  });

  it("Modify property name and check how the binding value changes", () => {
    cy.get(".t--edit-column-btn")
      .first()
      .should("be.visible")
      .click({ force: true });
    cy.wait(3000);
    cy.get(".t--code-editor-wrapper")
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
