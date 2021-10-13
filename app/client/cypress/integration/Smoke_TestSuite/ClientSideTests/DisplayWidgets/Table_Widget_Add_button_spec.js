const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/tableNewDsl.json");
const pages = require("../../../../locators/Pages.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Table Widget property pane feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Table widget with Add button test and validation", function() {
    cy.openPropertyPane("tablewidget");
    // Open column details of "id".
    cy.editColumn("id");
    cy.get(widgetsPage.tableBtn).should("not.exist");
    // Changing column data type to "Button"
    cy.changeColumnType("Button");
    // Changing the computed value (data) to "orderAmount"
    cy.updateComputedValue(testdata.currentRowOrderAmt);
    // Selecting button action to show message
    cy.get(widgetsPage.actionSelect).click();
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Show message")
      .click();
    cy.addSuccessMessage("Successful ".concat(testdata.currentRowEmail));
    // Close Property pane
    cy.get(commonlocators.editPropCrossButton).click({ force: true });

    // Validating the button action by clicking
    cy.get(widgetsPage.tableBtn)
      .last()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(3000);
    // Validating the toast message
    cy.get(widgetsPage.toastAction).should("be.visible");
    cy.get(widgetsPage.toastActionText)
      .last()
      .invoke("text")
      .then((text) => {
        const someText = text;
        expect(someText).to.equal("Successful tobias.funke@reqres.in");
      });
  });
  it("Table widget triggeredRow property should be accessible", function() {
    cy.get(commonlocators.TextInside).should("have.text", "Tobias Funke");
  });
  it("Table widget triggeredRow property should be same even after sorting the table", function() {
    //sort table date on second column
    cy.get(".draggable-header ")
      .first()
      .click({ force: true });
    cy.wait(1000);
    cy.get(commonlocators.TextInside).should("have.text", "Tobias Funke");
  });
  it("Table widget add new icon button column", function() {
    cy.openPropertyPane("tablewidget");
    // hide id column
    cy.makeColumnVisible("id");
    cy.wait(1000);
    // click on Add new Column.
    cy.get(".t--add-column-btn").click();

    //Open New Custom Column
    cy.editColumn("customColumn1");
    // Change Column type to icon Button
    cy.changeColumnType("Icon Button");
    // Select Icon from Icon Control
    cy.get(".t--property-control-icon .bp3-icon-caret-down").click({
      force: true,
    });
    cy.get(".bp3-icon-add")
      .first()
      .click({
        force: true,
      });
    cy.get(".t--widget-tablewidget .tbody .bp3-icon-add").should("exist");
    //Delete Column
    cy.get(".t--property-pane-back-btn").click({
      force: true,
    });
    cy.deleteColumn("customColumn1");
    // Close Property pane
    cy.get(commonlocators.editPropCrossButton).click({
      force: true,
    });
  });
  it("Table widget add new menu button column", function() {
    cy.openPropertyPane("tablewidget");
    // click on Add new Column.
    cy.get(".t--add-column-btn").click();

    //Open New Custom Column
    cy.editColumn("customColumn1");
    // Change Column type to icon Button
    cy.changeColumnType("Menu Button");
    //Changing the text on the Menu Button
    cy.testJsontext("label", "Menu button");
    // Select Icon from Icon Control
    cy.get(".t--property-control-icon .bp3-icon-caret-down").click({
      force: true,
    });
    cy.get(".bp3-icon-airplane")
      .first()
      .click({
        force: true,
      });
    // validate icon
    cy.get(".t--widget-tablewidget .tbody .bp3-icon-airplane").should("exist");
    // validate label
    cy.contains("Menu button").should("exist");
    // Add a Menu item
    cy.get(".t--add-menu-item-btn").click({
      force: true,
    });
    // Edit a Menu item
    cy.get(".t--property-pane-section-menuitems .t--edit-column-btn")
      .first()
      .click({
        force: true,
      });
    //  Add action to the menu Item
    cy.get(widgetsPage.actionSelect).click();
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Show message")
      .click();
    cy.addSuccessMessage("Successful ".concat(testdata.currentRowEmail));

    // Close Property pane
    cy.openPropertyPane("tablewidget");

    // Click on the Menu Button
    cy.contains("Menu button").click({
      force: true,
    });
    cy.wait(1000);
    // Click on the Menu Item

    cy.contains("Menu Item 1").click({
      force: true,
    });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(3000);
    // Validating the toast message
    cy.get(widgetsPage.toastAction).should("be.visible");
    cy.get(widgetsPage.toastActionText)
      .last()
      .invoke("text")
      .then((text) => {
        const someText = text;
        expect(someText).to.equal("Successful tobias.funke@reqres.in");
      });
  });
  it("Table widget test on button icon click, row should not get deselected", () => {
    cy.get(widgetsPage.tableIconBtn)
      .last()
      .click({ force: true });
    cy.get(commonlocators.TextInside).should("have.text", "Tobias Funke");
    //click icon button again
    cy.get(widgetsPage.tableIconBtn)
      .last()
      .click({ force: true });
    cy.get(commonlocators.TextInside).should("have.text", "Tobias Funke");
  });
});
