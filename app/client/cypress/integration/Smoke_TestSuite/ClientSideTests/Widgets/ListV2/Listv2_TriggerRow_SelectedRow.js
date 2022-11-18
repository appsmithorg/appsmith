const dsl = require("../../../../../fixtures/Listv2/ListWithInputForSelectedAndTriggerRow.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

const toggleJSButton = (name) => `.t--property-control-${name} .t--js-toggle`;
const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
const containerWidgetSelector = `[type="CONTAINER_WIDGET"]`;

const data = [
  {
    id: "001",
    name: "Blue",
    img: "https://assets.appsmith.com/widgets/default.png",
  },
  {
    id: "002",
    name: "Green",
    img: "https://assets.appsmith.com/widgets/default.png",
  },
  {
    id: "003",
    name: "Red",
    img: "https://assets.appsmith.com/widgets/default.png",
  },
  {
    id: "004",
    name: "Yellow",
    img: "https://assets.appsmith.com/widgets/default.png",
  },
  {
    id: "005",
    name: "Orange",
    img: "https://assets.appsmith.com/widgets/default.png",
  },
  {
    id: "006",
    name: "Indigo",
    img: "https://assets.appsmith.com/widgets/default.png",
  },
];

describe("List widget v2; TriggerRow, SelectedRow, TriggerRowIndex, SelectedRowIndex", () => {
  it("1. TriggerRow, SelectedRow, TriggerRowIndex, SelectedRowIndex", () => {
    cy.openPropertyPane("listwidgetv2");
    cy.testJsontext("items", JSON.stringify(listData));
    cy.wait("@updateLayout");

    // Update widgets with right data
    cy.openPropertyPaneByWidgetName("TriggeredRow", "textwidget");
    cy.testJsontext("text", `{{List1.triggeredRow}}`);

    cy.openPropertyPaneByWidgetName("SelectedRow", "textwidget");
    cy.testJsontext("text", `{{List1.selectedRow}}`);

    cy.openPropertyPaneByWidgetName("SelectedRowIndex", "textwidget");
    cy.testJsontext("text", `{{List1.selectedRowIndex}}`);

    cy.openPropertyPaneByWidgetName("TriggeredRowIndex", "textwidget");
    cy.testJsontext("text", `{{List1.triggeredRowIndex}}`);

    cy.openPropertyPaneByWidgetName("SelectedItem", "textwidget");
    cy.testJsontext("text", `{{List1.selectedItem}}`);

    cy.openPropertyPaneByWidgetName("PageNumber", "textwidget");
    cy.testJsontext("text", `{{List1.pageNumber}}`);

    cy.openPropertyPaneByWidgetName("PageSize", "textwidget");
    cy.testJsontext("text", `{{List1.pageSize}}`);
  });
});
