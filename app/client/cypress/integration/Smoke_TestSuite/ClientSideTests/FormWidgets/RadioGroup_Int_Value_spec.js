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
});
