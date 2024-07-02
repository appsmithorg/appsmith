import * as _ from "../../../../../support/Objects/ObjectsCore";

const tableData = `[
    {
        "id": 1,
        "date": "2023-06-01T12:00:00-06:30",
        "email": "saiprabhu@gmail.com",
        "userName": "Saiprabhu",
        "department": "Sales"
      },
      {
        "id": 2,
        "date": "2023-06-02T12:00:00-06:30",
        "email": "saicharan@gmail.com",
        "userName": "Saicharan",
        "department": "Marketing"
      },
      {
        "id": 3,
        "date": "2023-06-03T12:00:00-06:30",
        "email": "varaprasad@gmail.com",
        "userName": "Varaprasad",
        "department": "HR"
      },
      {
        "id": 4,
        "date": "2023-06-04T12:00:00-06:30",
        "email": "shivamkumar@gmail.com",
        "userName": "Shivamkumar",
        "department": "Finance"
      },
      {
        "id": 5,
        "date": "2023-06-05T12:00:00-06:30",
        "email": "madhurendra@gmail.com",
        "userName": "Madhurendra",
        "department": "IT"
      },
      {
        "id": 6,
        "email": "vamshi@gmail.com",
        "userName": "Vamshi",
        "date": "2023-06-06T12:00:00-06:30",
        "department": "Engineering"
      },
      {
        "id": 7,
        "date": "2023-06-07T12:00:00-06:30",
        "email": "yogesh@gmail.com",
        "userName": "Yogesh",
        "department": "Customer Service"
      }
  ]`;

describe("Table row Validation flow", { tags: ["@tag.Widget", "@tag.Table"] }, () => {
  it("1. Saverow button should be disabled when date column is set to required and has no value", () => {
    _.entityExplorer.DragDropWidgetNVerify("tablewidgetv2");
    cy.viewport(1700, 800)
    cy.openPropertyPane("tablewidgetv2");
    _.propPane.EnterJSContext("Table data", tableData);
    _.propPane.TogglePropertyState("Allow adding a row", "On");
    cy.get(".t--add-new-row").click();
    cy.makeColumnEditable("email");
    cy.get('[data-rbd-draggable-id="email"] > :nth-child(1) > .sc-ibVIrx > .sc-jShKGg > .t--edit-column-btn > .sc-hHTYSt')
    .should('be.visible')
    .click();
    _.propPane.TogglePropertyState("Required", "On");
    cy.get('[data-testid="t--property-pane-back-btn"] > .sc-hHTYSt')
    .should('be.visible')
    .click();
    cy.makeColumnEditable("date");
    cy.get('[data-rbd-draggable-id="date"] > :nth-child(1) > .sc-ibVIrx > .sc-jShKGg > .t--edit-column-btn > .sc-hHTYSt')
    .should('be.visible')
    .click();
    _.propPane.TogglePropertyState("Required", "On");
     cy.get('[data-testid="t--property-pane-back-btn"] > .sc-hHTYSt')
    .should('be.visible')
    .click();
    cy.get('[data-colindex="2"] > .sc-JmZxe > .sc-bEzTyZ > [data-testid="input-container"] > .sc-cTVMo > .sc-jeToga > .bp3-popover-wrapper > .bp3-popover-target > .bp3-input-group > .bp3-input')
    .should('be.visible')
    .type('v@gmail.com');
    cy.get('[data-colindex="1"] > .sc-JmZxe > .sc-bEzTyZ > [data-testid="input-container"] > .sc-cTVMo > .sc-jeToga > .bp3-popover-wrapper > .bp3-popover-target > .bp3-input-group > .bp3-input')
    .should('be.visible')
    .type('2024-06-24T12:00:00-06:30');
  });

});