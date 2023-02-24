const publishLocators = require("../../../../../locators/publishWidgetspage.json");
const dslWithServerSide = require("../../../../../fixtures/Listv2/listWithServerSideData.json");
const datasource = require("../../../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../../../locators/QueryEditor.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

const toggleJSButton = (name) => `.t--property-control-${name} .t--js-toggle`;

describe("List widget v2 - Basic server side data tests", () => {
  before(() => {
    cy.addDsl(dslWithServerSide);
    // Open Datasource editor
    cy.wait(2000);
    cy.NavigateToDatasourceEditor();

    // Click on sample(mock) user database.
    cy.get(datasource.mockUserDatabase).click();

    // Choose the first data source which consists of users keyword & Click on the "New Query +"" button
    cy.get(`${datasource.datasourceCard}`)
      .contains("Users")
      .get(`${datasource.createQuery}`)
      .last()
      .click({ force: true });

    // Click the editing field
    cy.get(".t--action-name-edit-field").click({ force: true });

    // Click the editing field
    cy.get(queryLocators.queryNameField).type("Query1");

    // switching off Use Prepared Statement toggle
    cy.get(queryLocators.switch)
      .last()
      .click({ force: true });

    //.1: Click on Write query area
    cy.get(queryLocators.templateMenu).click();
    cy.get(queryLocators.query).click({ force: true });

    // writing query to get the schema
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type(
        "SELECT * FROM users OFFSET {{List1.pageNo * List1.pageSize}} LIMIT {{List1.pageSize}};",
        {
          force: true,
          parseSpecialCharSequences: false,
        },
      );
    cy.WaitAutoSave();

    cy.runQuery();

    cy.get('.t--entity-name:contains("Page1")').click({ force: true });

    cy.wait(1000);
  });

  it("1. shows correct number of items and binding texts", () => {
    cy.get(publishLocators.containerWidget).should("have.length", 3);
    cy.get(publishLocators.imageWidget).should("have.length", 3);
    cy.get(publishLocators.textWidget).should("have.length", 6);

    cy.get(publishLocators.containerWidget).each(($containerEl) => {
      cy.wrap($containerEl)
        .get(publishLocators.textWidget)
        .eq(1)
        .find("span")
        .invoke("text")
        .should("have.length.gt", 0);
    });
  });

  it("2. next page shows correct number of items and binding text", () => {
    cy.get(".t--list-widget-next-page.rc-pagination-next")
      .find("button")
      .click({ force: true });

    cy.get(".rc-pagination-item").contains(2);

    /**
     * isLoading of the widget does not work properly so for a moment
     * the previous data are visible which can cause the test to pass/fail.
     * Adding a wait makes sure the next page data is loaded.
     */
    cy.wait(3000);

    cy.get(publishLocators.containerWidget).should("have.length", 3);
    cy.get(publishLocators.imageWidget).should("have.length", 3);
    cy.get(publishLocators.textWidget).should("have.length", 6);

    cy.get(publishLocators.containerWidget).each(($containerEl) => {
      cy.wrap($containerEl)
        .get(publishLocators.textWidget)
        .eq(1)
        .find("span")
        .invoke("text")
        .should("have.length.gt", 0);
    });
  });

  it("3. re-runs query of page 1 when reset", () => {
    // Modify onPageChange
    cy.openPropertyPane("listwidgetv2");
    cy.get(toggleJSButton("onpagechange")).click({ force: true });
    cy.testJsontext(
      "onpagechange",
      "{{Query1.run(() => {showAlert(`Query Ran ${new Date().getTime()}`)}, () => {})}}",
    );

    cy.openPropertyPane("buttonwidget");

    cy.get(toggleJSButton("onclick")).click({ force: true });

    cy.testJsontext("onclick", "{{resetWidget('List1',true)}}");

    // Verify if page 2
    cy.get(".rc-pagination-item").contains(2);

    // Go to next page
    cy.get(".t--list-widget-next-page.rc-pagination-next")
      .find("button")
      .click({ force: true });

    // Verify if page 3
    cy.get(".rc-pagination-item").contains(3);

    /**
     *  Note: Waiting for toastmsg and verifying it can cause flakyness
     * as the APIs could take time to respond and by the response comes,
     * the cypress tests might timeout.
     *  */
    // Represents query fired
    cy.get(commonlocators.toastmsg).should("exist");
    // Represents the toast message is closed
    cy.get(commonlocators.toastmsg).should("not.exist");

    // Reset List widget
    cy.get(".t--draggable-buttonwidget")
      .find("button")
      .click({ force: true });

    // Verify if page 1
    cy.get(".rc-pagination-item").contains(1);

    // Verify if Query fired once
    cy.get(commonlocators.toastmsg)
      .should("exist")
      .should("have.length", 1);
  });

  it("4. retains input values when pages are switched", () => {
    // Type a number in each of the item's input widget
    cy.get(".t--draggable-inputwidgetv2").each(($inputWidget, index) => {
      cy.wrap($inputWidget)
        .find("input")
        .type(index + 1);
    });

    // Verify the typed value
    cy.get(".t--draggable-inputwidgetv2").each(($inputWidget, index) => {
      cy.wrap($inputWidget)
        .find("input")
        .should("have.value", index + 1);
    });

    // Go to page 2
    cy.get(".t--list-widget-next-page.rc-pagination-next")
      .find("button")
      .click({ force: true });

    cy.get(".rc-pagination-item").contains(2);

    /**
     * isLoading of the widget does not work properly so for a moment
     * the previous data are visible which can cause the test to pass/fail.
     * Adding a wait makes sure the next page data is loaded.
     */
    cy.wait(5000);

    // Type a number in each of the item's input widget
    cy.get(".t--draggable-inputwidgetv2").each(($inputWidget, index) => {
      cy.wrap($inputWidget)
        .find("input")
        .type(index + 4);
    });

    // Verify the typed value
    cy.get(".t--draggable-inputwidgetv2").each(($inputWidget, index) => {
      cy.wrap($inputWidget)
        .find("input")
        .should("have.value", index + 4);
    });

    // Go to page 1
    cy.get(".t--list-widget-prev-page.rc-pagination-prev")
      .find("button")
      .click({ force: true });

    cy.get(".rc-pagination-item")
      .contains(1)
      .wait(5000);

    // Verify if previously the typed values are retained
    cy.get(".t--draggable-inputwidgetv2").each(($inputWidget, index) => {
      cy.wrap($inputWidget)
        .find("input")
        .should("have.value", index + 1);
    });
  });

  it("5. no of items rendered should be equal to page size", () => {
    cy.NavigateToDatasourceEditor();

    // Click on sample(mock) user database.
    cy.get(datasource.mockUserDatabase).click();

    // Choose the first data source which consists of users keyword & Click on the "New Query +"" button
    cy.get(`${datasource.datasourceCard}`)
      .filter(":contains('Users')")
      .first()
      .within(() => {
        cy.get(`${datasource.createQuery}`).click({
          force: true,
        });
      });

    // Click the editing field
    cy.get(".t--action-name-edit-field").click({
      force: true,
    });

    // Click the editing field
    cy.get(queryLocators.queryNameField).type("Query2");

    // switching off Use Prepared Statement toggle
    cy.get(queryLocators.switch)
      .last()
      .click({
        force: true,
      });

    //.1: Click on Write query area
    cy.get(queryLocators.templateMenu).click();
    cy.get(queryLocators.query).click({
      force: true,
    });

    // writing query to get the schema
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type("SELECT * FROM users LIMIT 20;", {
        force: true,
        parseSpecialCharSequences: false,
      });
    cy.WaitAutoSave();

    cy.runQuery();

    cy.get('.t--entity-name:contains("Page1")').click({
      force: true,
    });

    cy.wait(1000);

    cy.openPropertyPane("listwidgetv2");

    cy.testJsontext("items", "{{Query2.data}}");

    cy.wait(1000);

    // Check if container no of containers are still 3
    cy.get(publishLocators.containerWidget).should("have.length", 3);
  });
});
