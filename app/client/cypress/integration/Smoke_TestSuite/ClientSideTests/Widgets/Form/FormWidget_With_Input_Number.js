const dsl = require("../../../../../fixtures/formWidgetWithInputValCheckDsl.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
var appId = " ";

describe("Form Widget with Input Functionality", function() {
   before(() => {
    appId = localStorage.getItem("applicationId");
    cy.log("appID:"+appId);
    cy.addDsl(dsl, appId);
  });

  it("Check if the default value of text input is 0", function() {
    //Check if the Input widget is visible
    cy.get(widgetsPage.inputWidget).should("be.visible");

    //Check if the submit button is visible;
    cy.get(widgetsPage.formButtonWidget)
      .contains("Submit")
      .scrollIntoView()
      .should("be.visible");

    //Do Submission
    cy.get(widgetsPage.formButtonWidget)
      .contains("Submit")
      .closest("div")
      .click();

    //Check if on submission if the notification toast appears with text containing input1: 0
    cy.get(widgetsPage.toastActionText)
      .last()
      .invoke("text")
      .then((text) => {
        expect(text).to.equal('{"Text1":"Form","Input1":0}');
      });

    cy.get(widgetsPage.formButtonWidget)
      .contains("Reset")
      .scrollIntoView()
      .should("be.visible");
  });
});
