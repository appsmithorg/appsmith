import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const dynamicInputLocators = require("../../../../../locators/DynamicInput.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Autocomplete using slash command and mustache tests",
  { tags: ["@tag.JS", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("slashcommandDsl");
    });

    it("Slash command and mustache autocomplete validation for button widget", function () {
      cy.openPropertyPane("buttonwidget");
      cy.testCodeMirror("/").then(() => {
        cy.get(dynamicInputLocators.hints).should("exist");
        // validates all autocomplete commands on entering / in label field
        cy.get(`${dynamicInputLocators.hints} li`)
          .eq(0)
          .should("have.text", "Add a binding");
        cy.get(`${dynamicInputLocators.hints} li`)
          .last()
          .should("have.text", "New datasource");
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
      cy.EnableAllCodeEditors();
      cy.get(".t--property-control-onclick .CodeMirror textarea")
        .last()
        .focus()
        .type("{uparrow}", { parseSpecialCharSequences: true })
        .type("{ctrl}{shift}{downarrow}", { parseSpecialCharSequences: true })
        .type("{backspace}", { parseSpecialCharSequences: true })
        .type("/")
        .then(() => {
          cy.get(dynamicInputLocators.hints).should("exist");
          // validates all autocomplete commands on entering / in onClick field
          cy.get(`${dynamicInputLocators.hints} li`)
            .eq(0)
            .should("have.text", "Add a binding");
          cy.get(`${dynamicInputLocators.hints} li`)
            .last()
            .should("have.text", "New datasource");
        });
      cy.EnableAllCodeEditors();
      cy.get(".t--property-control-onclick .CodeMirror textarea")
        .last()
        .focus()
        .type("{ctrl}{shift}{downarrow}")
        .type("{backspace}")
        .type("{shift}{{}{shift}{{}")
        .then(() => {
          cy.get(dynamicInputLocators.hints).should("exist");
          _.agHelper.AssertContains("storeValue");
          _.agHelper.AssertContains("showAlert");
        });
    });

    it(
      "Slash command and mustache autocomplete validation for textbox widget",
      { tags: ["@tag.excludeForAirgap"] },
      function () {
        cy.openPropertyPane("textwidget");
        cy.EnableAllCodeEditors();
        cy.testCodeMirror("/").then(() => {
          cy.get(dynamicInputLocators.hints).should("exist");
          // validates all autocomplete commands on entering / in text field
          cy.get(`${dynamicInputLocators.hints} li`)
            .eq(0)
            .should("have.text", "Add a binding");
          cy.get(`${dynamicInputLocators.hints} li`)
            .last()
            .should("have.text", "New datasource");
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
            _.agHelper.AssertContains("Button1.text");
            _.agHelper.AssertContains("Button1.recaptchaToken");
          });
      },
    );

    it(
      "airgap",
      "Slash command and mustache autocomplete validation for textbox widget for airgap",
      function () {
        cy.openPropertyPane("textwidget");
        cy.EnableAllCodeEditors();
        cy.testCodeMirror("/").then(() => {
          cy.get(dynamicInputLocators.hints).should("exist");
          // validates all autocomplete commands on entering / in text field
          cy.get(`${dynamicInputLocators.hints} li`)
            .eq(0)
            .should("have.text", "Add a binding");
          cy.get(`${dynamicInputLocators.hints} li`)
            .last()
            .should("have.text", "New datasource");
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
      },
    );

    it("Bug 9003: Autocomplete not working for Appsmith specific JS APIs", function () {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      _.propPane.ToggleJSMode("onClick", true);
      _.propPane.TypeTextIntoField("onClick", "{{storeValue", true);
      _.agHelper.GetNAssertElementText(_.locators._hints, "storeValue");
      _.propPane.TypeTextIntoField("onClick", "{{removeValue", true);
      _.agHelper.GetNAssertElementText(_.locators._hints, "removeValue");
      _.propPane.TypeTextIntoField("onClick", "{{showAlert", true);
      _.agHelper.GetNAssertElementText(_.locators._hints, "showAlert");
      _.propPane.TypeTextIntoField("onClick", "{{setInterval", true);
      _.agHelper.GetNAssertElementText(_.locators._hints, "setInterval");
      _.propPane.TypeTextIntoField("onClick", "{{setTimeout", true);
      _.agHelper.GetNAssertElementText(_.locators._hints, "setTimeout");
      _.propPane.TypeTextIntoField("onClick", "{{resetWidget", true);
      _.agHelper.GetNAssertElementText(_.locators._hints, "resetWidget");
      _.propPane.TypeTextIntoField("onClick", "{{showModal", true);
      _.agHelper.GetNAssertElementText(_.locators._hints, "showModal");
      _.propPane.TypeTextIntoField("onClick", "{{copyToClipboard", true);
      _.agHelper.GetNAssertElementText(_.locators._hints, "copyToClipboard");
      _.propPane.TypeTextIntoField("onClick", "{{closeModal", true);
      _.agHelper.GetNAssertElementText(_.locators._hints, "closeModal");
      _.propPane.TypeTextIntoField("onClick", "{{Text1.setDisabled", true);
      _.agHelper.GetNAssertElementText(_.locators._hints, "setDisabled");

      _.propPane.TypeTextIntoField("Label", "{{storeValue", true);
      _.agHelper.AssertElementAbsence(_.locators._hints);
      _.propPane.TypeTextIntoField("Label", "{{Text1.setDisabled", true);
      _.agHelper.AssertElementAbsence(_.locators._hints);
    });
  },
);
