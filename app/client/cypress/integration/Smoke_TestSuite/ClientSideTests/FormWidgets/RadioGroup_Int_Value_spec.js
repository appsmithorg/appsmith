const dsl = require("../../../../fixtures/radioGroup_int_value_dsl.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");

function checkSelectedRadioValue(selector, value) {
  /**
   * This function checks if the radio button is checked.
   * It also checks the value of the checked radio button.
   */
  cy.get(`${selector} input`).should("be.checked");
  cy.get(`${selector} input:checked`).should("have.value", value);
}

describe("RadioGroup widget testing", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Radio widget check selection with value property as integer", function() {
    cy.openPropertyPane("radiogroupwidget");

    //Check the DSV is {{1}} on page load and radio with value=1 is selected
    cy.validateCodeEditorContent(
      ".t--property-control-defaultselectedvalue",
      "{{1}}",
    );
    checkSelectedRadioValue(formWidgetsPage.radioWidget, "1");

    //Change the DSV to {{2}}
    cy.updateCodeInput(".t--property-control-defaultselectedvalue", "{{2}}");
    cy.wait(200);

    //Check the DSV if {{2}} and radio with value=2 is selected
    cy.validateCodeEditorContent(
      ".t--property-control-defaultselectedvalue",
      "{{2}}",
    );
    cy.wait(200);
    checkSelectedRadioValue(formWidgetsPage.radioWidget, "2");

    //Check option 1 and then check it's value:
    cy.get(`${formWidgetsPage.radioWidget} input`).check("1", { force: true });
    checkSelectedRadioValue(formWidgetsPage.radioWidget, "1");

    //Check option 2 and then check it's value:
    cy.get(`${formWidgetsPage.radioWidget} input`).check("2", { force: true });
    checkSelectedRadioValue(formWidgetsPage.radioWidget, "2");
  });

  it("Radio widget check selection with value property as string", function() {
    cy.openPropertyPane("radiogroupwidget");

    cy.updateCodeInput(
      ".t--property-control-options",
      `[
        {
          "label": "Yes",
          "value": "1"
        },
        {
          "label": "No",
          "value": "2"
        }
      ]`,
    );

    //Change the DSV to 1.
    cy.updateCodeInput(".t--property-control-defaultselectedvalue", "1");

    //Check if the DSV=1 and radio with value=1 is selected
    cy.validateCodeEditorContent(
      ".t--property-control-defaultselectedvalue",
      "1",
    );
    checkSelectedRadioValue(formWidgetsPage.radioWidget, "1");

    //Change the DSV to 2.
    cy.updateCodeInput(".t--property-control-defaultselectedvalue", "2");
    cy.wait(200);

    //Check if the DSV=2 and radio with value=2 is selected
    cy.validateCodeEditorContent(
      ".t--property-control-defaultselectedvalue",
      "2",
    );
    checkSelectedRadioValue(formWidgetsPage.radioWidget, "2");

    //Check option 1 and then check it's value:
    cy.get(`${formWidgetsPage.radioWidget} input`).check("1", { force: true });
    checkSelectedRadioValue(formWidgetsPage.radioWidget, "1");

    //Check option 2 and then check it's value:
    cy.get(`${formWidgetsPage.radioWidget} input`).check("2", { force: true });
    checkSelectedRadioValue(formWidgetsPage.radioWidget, "2");
  });

  it("Check the custom validations for the options property", function() {
    /**
     * Test case defs, an error should be thrown when:
     * 1. When datatypes are not same for value property
     * 2. When duplicate values is given
     * 3. When invalid value is given
     */

    //Base-line scenario
    cy.openPropertyPane("radiogroupwidget");

    cy.updateCodeInput(
      ".t--property-control-options",
      `[
        {
          "label": "Yes",
          "value": 1
        },
        {
          "label": "No",
          "value": 2
        }
      ]`,
    );

    cy.updateCodeInput(".t--property-control-defaultselectedvalue", "{{1}}");
    cy.wait(200);

    const inputOutputValues = [
      {
        //Case 1:When datatypes are not same for value property
        input: `[
          {
            "label": "Yes",
            "value": "1"
          },
          {
            "label": "No",
            "value": 2
          }
        ]`,
        message: "All value properties in options must have the same type",
      },
      {
        //Case 2:When duplicate values is given
        input: `[
          {
            "label": "Yes",
            "value": 2
          },
          {
            "label": "No",
            "value": 2
          }
        ]`,
        message: "path:value must be unique. Duplicate values found",
      },
      {
        //Case 3:When invalid value is given
        input: `[
          {
            "label": "Yes",
            "value": 
          },
          {
            "label": "No",
            "value": 2
          }
        ]`,
        message: `This value does not evaluate to type Array<{ "label": "string", "value": "string" | number }>`,
      },
      {
        //Case 3:When invalid value is given
        input: `[
          {
            "label": "Yes",
            "value": ""
          },
          {
            "label": "No",
            "value": 2
          }
        ]`,
        message: `All value properties in options must have the same type`,
      },
      {
        //Case 3:When invalid value is given
        input: `[
          {
            "label": "Yes",
            "value": "
          },
          {
            "label": "No",
            "value": 2
          }
        ]`,
        message: `This value does not evaluate to type Array<{ "label": "string", "value": "string" | number }>`,
      },
    ];

    inputOutputValues.map((useCase) => {
      cy.updateCodeInput(".t--property-control-options", useCase.input);
      cy.evaluateErrorMessage(useCase.message);
    });
  });
});
