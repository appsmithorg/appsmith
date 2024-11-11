const jsonform = require("../../../../../locators/jsonFormWidget.json");
const dslWithoutSchema = require("../../../../../fixtures/jsonFormDslWithoutSchema.json");
const jsonText = require("../../../../../fixtures/jsonTextDsl.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Verify syntax to create Datpicker field type",
  { tags: ["@tag.Widget", "@tag.JSONForm", "@tag.Binding"] },
  () => {
    beforeEach(() => {
      _.agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      _.agHelper.SaveLocalStorageCache();
    });

    it("1. Validate calendar on clicking date field", () => {
      const schema = { Key: "20/03/1992" };
      cy.addDsl(dslWithoutSchema);
      cy.openPropertyPane("jsonformwidget");
      _.propPane.EnterJSContext("Source data", JSON.stringify(schema), true);

      cy.xpath(jsonform.datepickerContainer).click({
        force: true,
      });
      cy.get(jsonform.calendarPopup).should("be.visible");
    });

    it("2. Validate calendar on clicking date field", () => {
      const schema = { Key: true };
      cy.addDsl(dslWithoutSchema);
      cy.openPropertyPane("jsonformwidget");
      _.propPane.EnterJSContext("Source data", JSON.stringify(schema), true);

      cy.get(jsonform.switchStatus).should("be.visible");
      cy.get(jsonform.switchStatus).click({ force: true });
    });

    it("3. Validate email input field in form", () => {
      const schema = { Key: "Value@mail.com" };
      cy.addDsl(dslWithoutSchema);
      cy.openPropertyPane("jsonformwidget");
      _.propPane.EnterJSContext("Source data", JSON.stringify(schema), true);

      cy.xpath(jsonform.emailField).should("be.visible");
      cy.xpath(jsonform.emailField).should("have.value", "Value@mail.com");
    });

    it("4. Validate email input field in form", () => {
      const schema = { Key: "value" };
      cy.addDsl(dslWithoutSchema);
      cy.openPropertyPane("jsonformwidget");
      _.propPane.EnterJSContext("Source data", JSON.stringify(schema), true);

      cy.get(jsonform.keyInput).should("be.visible");
      cy.get(jsonform.keyInput).should("have.value", "value");
    });

    it("5. Verify mandatory field check and also submit button active/inactive", () => {
      const schema = {
        name: "John",
        date_of_birth: "20/02/1990",
        employee_id: 1001,
      };
      cy.addDsl(dslWithoutSchema);
      cy.openPropertyPane("jsonformwidget");
      _.propPane.EnterJSContext("Source data", JSON.stringify(schema), true);

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

    it("6. Checks when mandatory field is blank", () => {
      cy.get(jsonform.jsformInput).clear({ force: true });
      cy.get(jsonform.msg).should("have.text", "This field is required");
      cy.get(jsonform.submit).should("be.disabled");
      cy.get(jsonform.jsformInput).type("test Mandatory");
      cy.get(jsonform.msg).should("not.exist");
      cy.get(jsonform.submit).should("be.enabled");
    });

    it("7. Verify property name change with json/text widget binding - Modify property name and check how the binding value changes", () => {
      cy.addDsl(jsonText);
      cy.openPropertyPane("jsonformwidget");
      cy.get(_.locators._jsToggle("sourcedata")).click({ force: true });
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
        EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
        cy.wait(3000);

    })
    */
  },
);
