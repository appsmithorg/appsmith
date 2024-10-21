import * as _ from "../../../../../support/Objects/ObjectsCore";
import dynamicInputLocators from "../../../../../locators/DynamicInput.json";

const tableData = `[
    {
        "id": 1,
        "date": "2023-06-01T12:00:00-06:30",
        "email": "test1@gmail.com",
        "userName": "test1",
        "department": "Marketing"
      },
      {
        "id": 2,
        "date": "2023-06-02T12:00:00-06:30",
        "email": "test2@gmail.com",
        "userName": "test2",
        "department": "Marketing"
      },
      {
        "id": 3,
        "date": "2023-06-03T12:00:00-06:30",
        "email": "test3@gmail.com",
        "userName": "test3",
        "department": "HR"
      },
      {
        "id": 4,
        "date": "2023-06-04T12:00:00-06:30",
        "email": "test4@gmail.com",
        "userName": "test4",
        "department": "HR"
      },
      {
        "id": 5,
        "date": "2023-06-05T12:00:00-06:30",
        "email": "test5@gmail.com",
        "userName": "test5",
        "department": "IT"
      },
      {
        "id": 6,
        "email": "test6@gmail.com",
        "userName": "test6",
        "date": "2023-06-06T12:00:00-06:30",
        "department": "IT"
      },
      {
        "id": 7,
        "date": "2023-06-07T12:00:00-06:30",
        "email": "test7@gmail.com",
        "userName": "test7",
        "department": "Customer Service"
      }
  ]`;
describe(
  "filteredTableData property in autocomplete suggestions of table widget",
  { tags: ["@tag.Widget", "@tag.Table"] },
  () => {
    it("check 'filteredTableData' property in autocomplete suggestions", () => {
      _.agHelper.AddDsl("tableV2NewDsl");
      cy.openPropertyPane("tablewidgetv2");
      _.propPane.EnterJSContext("Table data", tableData);
      _.propPane.TogglePropertyState("Allow filtering", "On");

      _.table.OpenNFilterTable("department", "contains", "Marketing");
      _.table.CloseFilter();

      cy.openPropertyPane("textwidget");
      cy.testCodeMirror("/");
      cy.get(`${dynamicInputLocators.hints} li`)
        .eq(0)
        .should("have.text", "Add a binding")
        .click();
      _.propPane.TypeTextIntoField("Text", "Table1.", false);
      cy.get(`${dynamicInputLocators.hints} li`)
        .contains("filteredTableData")
        .should("be.visible")
        .click();
    });
  },
);
