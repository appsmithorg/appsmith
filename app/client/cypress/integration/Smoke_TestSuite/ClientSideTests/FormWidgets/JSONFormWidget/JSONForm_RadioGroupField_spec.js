const commonlocators = require("../../../../../locators/commonlocators.json");
const dslWithoutSchema = require("../../../../../fixtures/jsonFormDslWithoutSchema.json");

const fieldPrefix = ".t--jsonformfield";

function selectAndValidateOption(selector, option, expectedFormData) {
  // Select option Zero
  cy.get(selector)
    .contains(option.label)
    .click({
      force: true,
    })
    .wait(1000);

  // Validate form data for Zero option
  cy.get(`.t--widget-textwidget .bp3-ui-text`).then(($el) => {
    const formData = JSON.parse($el.text());
    cy.wrap(formData).should("deep.equal", expectedFormData);
  });

  // Validate selected radio option
  cy.get(`${selector} input:checked`).should(
    "have.value",
    option.value.toString(),
  );
}

function clearOptionsProperty() {
  cy.get(".t--property-control-options .CodeMirror")
    .first()
    .then((editor) => {
      editor[0].CodeMirror.setValue("");
    });
}

describe("JSONForm RadioGroup Field", () => {
  beforeEach(() => {
    cy.addDsl(dslWithoutSchema);

    // Bind formData to Text1 widget text property
    cy.openPropertyPane("textwidget");
    cy.testJsontext("text", "{{JSON.stringify(JSONForm1.formData)}}");
    cy.closePropertyPane();
  });

  it("accepts numeric options value", () => {
    cy.openPropertyPane("jsonformwidget");
    const schema = {
      binary: 1,
    };
    const radioFieldInput = `${fieldPrefix}-binary`;

    const options = [
      {
        label: "Zero",
        value: 0,
      },
      {
        label: "One",
        value: 1,
      },
    ];

    // Apply schema and change the field type to radio group
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("binary");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Radio Group$/);

    clearOptionsProperty();
    cy.testJsontext("options", JSON.stringify(options));

    cy.wait(2000);

    // Validate initial form data
    cy.get(`.t--widget-textwidget .bp3-ui-text`).then(($el) => {
      const formData = JSON.parse($el.text());
      cy.wrap(formData).should("deep.equal", {
        binary: 1,
      });
    });

    // Select Zero Option
    selectAndValidateOption(radioFieldInput, options[0], {
      binary: 0,
    });

    // Select One Option
    selectAndValidateOption(radioFieldInput, options[1], {
      binary: 1,
    });
  });

  it("accepts string options value", () => {
    cy.openPropertyPane("jsonformwidget");
    const schema = {
      accept: "N",
    };

    const radioFieldInput = `${fieldPrefix}-accept`;

    const options = [
      {
        label: "Yes",
        value: "Y",
      },
      {
        label: "No",
        value: "N",
      },
    ];

    // Apply schema and change the field type to radio group
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(schema));
    cy.openFieldConfiguration("accept");
    cy.selectDropdownValue(commonlocators.jsonFormFieldType, /^Radio Group$/);

    clearOptionsProperty();
    cy.testJsontext("options", JSON.stringify(options));

    cy.wait(2000);

    // Validate initial form data
    cy.get(`.t--widget-textwidget .bp3-ui-text`).then(($el) => {
      const formData = JSON.parse($el.text());
      cy.wrap(formData).should("deep.equal", {
        accept: "N",
      });
    });

    // Select Y Option
    selectAndValidateOption(radioFieldInput, options[0], {
      accept: "Y",
    });

    // Select N Option
    selectAndValidateOption(radioFieldInput, options[1], {
      accept: "N",
    });
  });
});
