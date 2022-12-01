const jsonFormInModalDsl = require("../../../../../fixtures/jsonFormInModalDsl.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");

const fieldPrefix = ".t--jsonformfield";

const checkFormModalValues = (value) => {
  // Check if modal present
  cy.get(".t--modal-widget").should("exist");

  cy.get(`${fieldPrefix}-step label`).contains("Step");
  cy.get(`${fieldPrefix}-step input`).then((input) => {
    cy.wrap(input).should("have.value", value.step);
    cy.wrap(input)
      .invoke("attr", "type")
      .should("contain", "text");
  });

  cy.get(`${fieldPrefix}-task label`).contains("Task");
  cy.get(`${fieldPrefix}-task input`).then((input) => {
    cy.wrap(input).should("have.value", value.task);
    cy.wrap(input)
      .invoke("attr", "type")
      .should("contain", "text");
  });

  cy.get(`${fieldPrefix}-status label`).contains("Status");
  cy.get(`${fieldPrefix}-status input`).then((input) => {
    cy.wrap(input).should("have.value", value.status);
    cy.wrap(input)
      .invoke("attr", "type")
      .should("contain", "text");
  });

  // Close the modal
  cy.get(".t--widget-iconbuttonwidget button").click({ force: true });

  // Check if modal closed
  cy.get(".t--modal-widget").should("not.exist");
};

describe("JSONForm in Modal", () => {
  it("should show the JSONForm with default values from Table widget", () => {
    const tableData = [
      {
        step: "#1",
        task: "Drop a table",
        status: "Done",
        action: "",
      },
      {
        step: "#2",
        task: "Create a query fetch_users with the Mock DB",
        status: "Pending",
        action: "",
      },
      {
        step: "#3",
        task: "Bind the query using => fetch_users.data",
        status: "New",
        action: "",
      },
    ];
    cy.addDsl(jsonFormInModalDsl);

    cy.PublishtheApp();

    // Click action button of first row
    cy.get(".t--widget-tablewidget .tableWrap")
      .find("button")
      .first()
      .click({ force: true });
    // Check the contents of the form
    checkFormModalValues(tableData[0]);

    // Click action button of third row
    cy.get(".t--widget-tablewidget .tableWrap")
      .find("button")
      .last()
      .click({ force: true });
    checkFormModalValues(tableData[2]);

    cy.get(publishPage.backToEditor).click({ force: true });
  });
});
