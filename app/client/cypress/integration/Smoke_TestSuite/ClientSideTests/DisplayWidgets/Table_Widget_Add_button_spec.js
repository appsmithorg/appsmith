const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/tableNewDsl.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Table Widget property pane feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Table widget with Add button test and validation", function() {
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
    cy.get(commonlocators.editPropBackButton).click({
      force: true,
    });
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
  it("2. Table Button color validation", function() {
    cy.openPropertyPane("tablewidget");
    // Open column details of "id".
    cy.editColumn("id");
    // Changing column data type to "Button"
    /* cy.get(commonlocators.changeColType)
      .last()
      .click();
    cy.get(".t--dropdown-option")
      .children()
      .contains("Plain Text")
      .click();
    cy.changeColumnType("Button"); */
    const color1 = "rgb(255, 0, 0)";
    cy.get(widgetsPage.buttonColor)
      .click({ force: true })
      .clear()
      .type(color1);
    cy.get(widgetsPage.tableBtn).should("have.css", "background-color", color1);

    // Changing the color again to reproduce issue #9526
    const color2 = "rgb(255, 255, 0)";
    cy.get(widgetsPage.buttonColor)
      .click({ force: true })
      .clear()
      // following wait is required to reproduce #9526
      .wait(600)
      .type(color2);
    cy.get(widgetsPage.tableBtn).should("have.css", "background-color", color2);
  });

  it("3. Table Button label color validation", function() {
    const color1 = "rgb(255, 255, 0)";
    cy.get(widgetsPage.labelColor)
      .click({ force: true })
      .clear()
      .type(color1);
    cy.get(widgetsPage.tableBtn).should("have.css", "color", color1);

    // Changing the color again to reproduce issue #9526
    const color2 = "rgb(0, 0, 255)";
    cy.get(widgetsPage.labelColor)
      .click({ force: true })
      .clear()
      // following wait is required to reproduce #9526
      .wait(600)
      .type(color2);
    cy.get(widgetsPage.tableBtn).should("have.css", "color", color2);
  });

  it("4. Table widget triggeredRow property should be accessible", function() {
    cy.get(commonlocators.TextInside).should("have.text", "Tobias Funke");
  });

  it("5. Table widget triggeredRow property should be same even after sorting the table", function() {
    //sort table date on second column
    cy.get(".draggable-header ")
      .first()
      .click({ force: true });
    cy.wait(1000);
    cy.get(commonlocators.TextInside).should("have.text", "Tobias Funke");
  });

  it("6. Table widget add new icon button column", function() {
    cy.get(".t--property-pane-back-btn").click({ force: true });
    // hide id column
    cy.makeColumnVisible("id");
    cy.wait(1000);
    // click on Add new Column.
    //cy.get(".t--property-pane-back-btn").click({ force: true });
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

    // disabled icon btn
    cy.CheckWidgetProperties(commonlocators.disableCheckbox);
    cy.getTableDataSelector("0", "4").then((selector) => {
      cy.get(selector + " button.bp3-disabled").should("exist");
    });
    cy.UncheckWidgetProperties(commonlocators.disableCheckbox);

    //Delete Column
    cy.get(".t--property-pane-back-btn").click({
      force: true,
    });
    cy.deleteColumn("customColumn1");
    // Close Property pane
    /*
    cy.get(commonlocators.editPropCrossButton).click({
      force: true,
    });
    */
  });

  it("7. Table widget add new menu button column", function() {
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

    const color1 = "rgb(255, 255, 0)";
    cy.get(widgetsPage.menuColor)
      .click({ force: true })
      .clear()
      .type(color1);
    cy.get(widgetsPage.tableBtn).should("have.css", "background-color", color1);

    // Changing the color again to reproduce issue #9526
    const color2 = "rgb(255, 0, 0)";
    cy.get(widgetsPage.menuColor)
      .click({ force: true })
      .clear()
      // following wait is required to reproduce #9526
      .wait(500)
      .type(color2);
    cy.get(widgetsPage.tableBtn).should("have.css", "background-color", color2);

    // Add a Menu item 1
    cy.get(".t--add-menu-item-btn").click({
      force: true,
    });
    // Edit a Menu item
    cy.get(".t--property-pane-section-menuitems .t--edit-column-btn")
      .first()
      .click({
        force: true,
      });
    // update menu item background color
    cy.get(widgetsPage.backgroundcolorPickerNew)
      .type("#03b365", {
        force: true,
      })
      .wait(500);
    //  Add action to the menu Item
    cy.get(widgetsPage.actionSelect).click();
    cy.get(commonlocators.chooseAction)
      .children()
      .contains("Show message")
      .click();
    cy.addSuccessMessage("Successful ".concat(testdata.currentRowEmail));
    // Go back to table property pane
    cy.get(".t--property-pane-back-btn").click({ force: true });

    // Add a Menu item 2
    cy.get(".t--add-menu-item-btn").click({
      force: true,
    });
    // Edit a Menu item
    cy.get(".t--property-pane-section-menuitems .t--edit-column-btn")
      .last()
      .click({
        force: true,
      });
    // update menu item background color
    cy.get(widgetsPage.backgroundcolorPickerNew)
      .clear()
      .type("#FFC13D", {
        force: true,
      })
      .wait(500);
    // Go back to table property pane
    cy.get(".t--property-pane-back-btn").click({ force: true });

    // Add a Menu item 3
    cy.get(".t--add-menu-item-btn").click({
      force: true,
    });
    // Edit a Menu item
    cy.get(".t--property-pane-section-menuitems .t--edit-column-btn")
      .last()
      .click({
        force: true,
      });
    // update menu item background color
    cy.get(widgetsPage.backgroundcolorPickerNew)
      .clear()
      .type("#3366FF", {
        force: true,
      })
      .wait(500);
    // Go back to table property pane
    cy.get(".t--property-pane-back-btn").click({ force: true });

    // Close Property pane
    cy.openPropertyPane("tablewidget");
    // Click on the Menu Button
    cy.contains("Menu button").click({
      force: true,
    });
    cy.wait(1000);

    //Commenting below verification until fixed to overide flakiness
    // // verify menu items background color
    // cy.get(".bp3-menu-item")
    //   .eq(0)
    //   .should("have.css", "background-color", "rgb(3, 179, 101)");
    // cy.get(".bp3-menu-item")
    //   .eq(1)
    //   .should("have.css", "background-color", "rgb(51, 102, 255)"); //"rgb(255, 193, 61)");
    // cy.get(".bp3-menu-item")
    //   .eq(2)
    //   .should("have.css", "background-color", "rgb(255, 255, 255)");//"rgb(51, 102, 255)");

    //cy.closePropertyPane();

    // disable menu item 3
    //cy.openPropertyPane("tablewidget");

    //cy.editColumn("customColumn1");
    // Edit a Menu item
    cy.get(".t--property-pane-section-menuitems .t--edit-column-btn")
      .last()
      .click({
        force: true,
      });
    cy.wait(1000);
    cy.get(".t--property-control-disabled label.bp3-switch.unchecked").click({
      force: true,
    });
    //cy.closePropertyPane();

    // Click on the Menu Button
    cy.clickButton("Menu button").wait(1000);

    // check Menu Item 3 is disable
    cy.get(".bp3-menu-item")
      .eq(2)
      .should("have.css", "background-color", "rgb(250, 250, 250)");
    cy.get(".bp3-menu-item")
      .eq(2)
      .should("have.class", "bp3-disabled");

    // Click on the Menu Item
    cy.get(".bp3-menu-item")
      .eq(0)
      .click({
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

  it("8. Table widget test on button icon click, row should not get deselected", () => {
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
