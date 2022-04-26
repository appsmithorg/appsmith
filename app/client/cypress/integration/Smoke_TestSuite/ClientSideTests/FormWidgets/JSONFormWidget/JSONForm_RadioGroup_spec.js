const jsonFormDslWithSchemaAndWithoutSourceData = require("../../../../../fixtures/jsonFormDslWithSchemaAndWithoutSourceData.json");

const fieldPrefix = ".t--jsonformfield";

function checkSelectedRadioValue(selector, value) {
  /**
   * This function checks if the radio button is checked.
   * It also checks the value of the checked radio button.
   */
  cy.get(`${selector} input`).should("be.checked");
  cy.get(`${selector} input:checked`).should("have.value", value);
}

describe("JSON Form radio button", () => {
  beforeEach(() => {
    cy.addDsl(jsonFormDslWithSchemaAndWithoutSourceData);
  });

  it("can select radio button when value is number type", () => {
    cy.openPropertyPane("jsonformwidget");

    // click on Add new Column.
    cy.get(".t--add-column-btn").click();

    //Open New Custom Column
    cy.openFieldConfiguration("customField1");

    // Change Column type to radio group
    cy.changeFieldType("Radio Group");

    // Add new radio buttons, one with number value
    let radioButtonsSchema = [
      {
        label: "Yes",
        value: "Y",
      },
      {
        label: "No",
        value: 122,
      },
    ];
    cy.get(".t--property-control-options .CodeMirror")
      .first()
      .first()
      .then((editor) => {
        editor[0].CodeMirror.setValue("");
      });
    cy.get(".t--property-control-options .CodeMirror-code").type(
      JSON.stringify(radioButtonsSchema).replaceAll("{", "{{}"),
    );

    // Go back to property pane
    cy.get(".t--property-pane-back-btn").click({
      force: true,
    });

    //ensure both radio buttons are being selected
    let radioEl = `.t--jsonformfield-customField1`;
    cy.get(`${radioEl} input`).check("Y", {
      force: true,
    });
    checkSelectedRadioValue(radioEl, "Y");

    cy.get(`${radioEl} input`).check("122", {
      force: true,
    });
    checkSelectedRadioValue(radioEl, "122");
  });
});
