const widgetsPage = require("../../../../locators/Widgets.json");
const dsl = require("../../../../fixtures/tableNewDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("prevent duplicate column name in table", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  //todo(yash/tolu/pawan) reverting this test for now
  // it("evaluted value popup should show when focus on duplicate column input", function() {
  //   cy.openPropertyPane("tablewidget");
  //   // Updating the column name ; "id" > "TestUpdated"
  //   cy.tableColumnPopertyUpdate("id", "TestUpdated");
  //   // Updating the column name ; "email" > "TestUpdated"
  //   cy.tableColumnPopertyUpdate("email", "TestUpdated");
  //   cy.wait("@updateLayout");
  //   cy.get(commonlocators.evaluatedTypeTitle).should("exist");

  //   // Updating the column name ; "userName" > "TestUpdated2"
  //   // this will move focus of input to another column input and let popup close
  //   cy.tableColumnPopertyUpdate("userName", "TestUpdated2");

  //   // duplicate column's border should remain red
  //   cy.get("[data-rbd-draggable-id='email'] > div > div").should(
  //     "have.class",
  //     "has-duplicate-label",
  //   );
  // });

  afterEach(() => {
    // put your clean up code if any
  });
});
