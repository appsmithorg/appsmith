const dsl = require("../../../../fixtures/slashcommandDsl.json");
const dynamicInputLocators = require("../../../../locators/DynamicInput.json");

describe("Autocomplete using slash command and mustache tests", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Slash command and mustache autocomplete validation for button widget", function() {
    cy.openPropertyPane("buttonwidget");
    cy.testCodeMirror("/");
    cy.get(dynamicInputLocators.input)
      .first()
      .click({ force: true })
      .then(() => {
        cy.get(dynamicInputLocators.hints).should("exist");
        // validates all autocomplete commands on entering / in label field
        cy.get(`${dynamicInputLocators.hints} li`)
          .eq(1)
          .should("have.text", "New Binding");
        cy.get(`${dynamicInputLocators.hints} li`)
          .eq(2)
          .should("have.text", "Insert Snippet");
        cy.get(`${dynamicInputLocators.hints} li`)
          .last()
          .should("have.text", "New Datasource");
      });
    cy.get(dynamicInputLocators.input)
      .first()
      .click({ force: true })
      .type("{uparrow}", { parseSpecialCharSequences: true })
      .type("{ctrl}{shift}{downarrow}", { parseSpecialCharSequences: true })
      .type("{backspace}", { parseSpecialCharSequences: true })
      .then(() => {
        // validates autocomplete binding on entering {{}} in label field
        cy.get(dynamicInputLocators.input)
          .first()
          .type("{shift}{{}{shift}{{}");
        cy.get(`${dynamicInputLocators.hints} li`)
          .eq(1)
          .should("have.text", "Text1.text");
      });
    // makes the onClick js toggle active
    cy.get(".t--property-control-onclick")
      .find(".t--js-toggle")
      .click({ force: true });
    cy.get(".CodeMirror textarea")
      .last()
      .focus()
      .type("/")
      .then(() => {
        cy.get(dynamicInputLocators.hints).should("exist");
        // validates all autocomplete commands on entering / in onClick field
        cy.get(`${dynamicInputLocators.hints} li`)
          .eq(1)
          .should("have.text", "New Binding");
        cy.get(`${dynamicInputLocators.hints} li`)
          .eq(2)
          .should("have.text", "Insert Snippet");
        cy.get(`${dynamicInputLocators.hints} li`)
          .last()
          .should("have.text", "New Datasource");
      });
    cy.get(".CodeMirror textarea")
      .last()
      .focus()
      .type("{ctrl}{shift}{downarrow}")
      .type("{backspace}")
      .type("{shift}{{}{shift}{{}")
      .then(() => {
        cy.get(dynamicInputLocators.hints).should("exist");
        // validates all autocomplete functions on entering {{}} in onClick field
        cy.get(`${dynamicInputLocators.hints} li`)
          .eq(1)
          .should("have.text", "storeValue()");
        cy.get(`${dynamicInputLocators.hints} li`)
          .eq(2)
          .should("have.text", "showModal()");
        cy.get(`${dynamicInputLocators.hints} li`)
          .eq(3)
          .should("have.text", "showAlert()");
      });
  });
  it("Slash command and mustache autocomplete validation for textbox widget", function() {
    cy.openPropertyPane("textwidget");
    cy.testCodeMirror("/");
    cy.get(dynamicInputLocators.input)
      .first()
      .click({ force: true })
      .then(() => {
        cy.get(dynamicInputLocators.hints).should("exist");
        // validates all autocomplete commands on entering / in text field
        cy.get(`${dynamicInputLocators.hints} li`)
          .eq(1)
          .should("have.text", "New Binding");
        cy.get(`${dynamicInputLocators.hints} li`)
          .eq(2)
          .should("have.text", "Insert Snippet");
        cy.get(`${dynamicInputLocators.hints} li`)
          .last()
          .should("have.text", "New Datasource");
      });
    cy.get(dynamicInputLocators.input)
      .first()
      .click({ force: true })
      .type("{uparrow}", { parseSpecialCharSequences: true })
      .type("{ctrl}{shift}{downarrow}", { parseSpecialCharSequences: true })
      .type("{backspace}", { parseSpecialCharSequences: true })
      .then(() => {
        cy.get(dynamicInputLocators.input)
          .first()
          .type("{shift}{{}{shift}{{}");
        // validates autocomplete binding on entering {{}} in text field
        cy.get(`${dynamicInputLocators.hints} li`)
          .eq(1)
          .should("have.text", "Button1.text");
      });
  });
});
