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

    //Check radio with value=1 is selected
    checkSelectedRadioValue(formWidgetsPage.radioWidget, "1");

    //Change the DSV to {{2}}
    cy.updateCodeInput(".t--property-control-defaultselectedvalue", "{{2}}");
    cy.wait(200);

    //Radio with value=2 is selected
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

    //Check radio with value=1 is selected
    checkSelectedRadioValue(formWidgetsPage.radioWidget, "1");

    //Change the DSV to 2.
    cy.updateCodeInput(".t--property-control-defaultselectedvalue", "2");
    cy.wait(200);

    //Check radio with value=2 is selected
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
        //Case 1.0:When datatypes are not same for value property
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
        //Case 1.1:When datatypes are not same for value property
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
        //Case 3.0:When invalid value is given
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
        //Case 3.1:When invalid value is given
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

  it("Check the value is string or integer for the default value", () => {
    /**
     * Test cases:
     * 1. Object data type should be invalid
     * 2. Boolean should be invalid
     * 3. Integer should be valid
     * 4. String should be valid
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
        //Case 1.0: Object data type should be invalid
        input: "{{[]}}",
        message: "This value does not evaluate to type: string or number",
      },
      {
        //Case 1.1: Object data type should be invalid
        input: "{{{}}}",
        message: `This value does not evaluate to type: string or number`,
      },
      {
        //Case 2: Boolean data type should be invalid
        input: "{{true}}",
        message: `This value does not evaluate to type: string or number`,
      },
      {
        //Case 3:Integer should be valid
        input: "{{1}}",
        message: "",
      },
      {
        //Case 4:String should be valid
        input: "1",
        message: "",
      },
    ];

    inputOutputValues.map((useCase) => {
      cy.updateCodeInput(
        ".t--property-control-defaultselectedvalue",
        useCase.input,
      );
      if (useCase.message === "") {
        cy.wait(200);
        cy.get(".t--evaluatedPopup-error").should("not.exist");
      } else {
        cy.evaluateErrorMessage(useCase.message);
      }
    });
  });
});
