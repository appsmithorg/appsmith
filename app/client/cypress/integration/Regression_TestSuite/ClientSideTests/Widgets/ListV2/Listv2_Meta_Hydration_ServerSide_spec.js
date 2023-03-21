const dsl = require("../../../../../fixtures/Listv2/MetaHydrationDSL.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const datasource = require("../../../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../../../locators/QueryEditor.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");

import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const toggleJSButton = (name) => `.t--property-control-${name} .t--js-toggle`;
let agHelper = ObjectsRegistry.AggregateHelper;
const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
const containerWidgetSelector = `[type="CONTAINER_WIDGET"]`;
const widgetPrefix = ".t--widget-";

function changeValueOfWidget(widgetType, value, index) {
  cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
    .eq(index)
    .within(() => {
      switch (widgetType) {
        case "selectwidget":
          cy.SelectDropDown(value);
          break;
        case "multiselectwidgetv2":
          cy.RemoveAllSelections();
          cy.SelectFromMultiSelect(value);
          break;
        case "inputwidgetv2":
          cy.get(`${widgetPrefix}${widgetType} input`).clear();
          cy.get(`${widgetPrefix}${widgetType} input`).type(value);
          break;
        default:
          break;
      }
    });
}

function verifyValueOfWidget(widgetType, value, index) {
  cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`)
    .eq(index)
    .within(() => {
      switch (widgetType) {
        case "selectwidget":
          cy.get("button span.bp3-button-text")
            .first()
            .invoke("text")
            .then(($selectedValue) => {
              expect($selectedValue).to.eq(value);
            });
          break;
        case "multiselectwidgetv2":
          cy.get(`${widgetPrefix}${widgetType}`)
            .find(`.rc-select-selection-item[title='${value[0]}']`)
            .should("exist");
          break;
        case "inputwidgetv2":
          cy.get(`${widgetPrefix}${widgetType} input`).should(
            "have.value",
            value,
          );
          break;
        default:
          break;
      }
    });
}

function testJsontextClear(endp) {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  cy.get(".t--property-control-" + endp + " .CodeMirror textarea")
    .first()
    .focus({ force: true })
    .type(`{${modifierKey}}{a}`, { force: true })
    .type(`{${modifierKey}}{del}`, { force: true });
}

describe("List widget v2 - meta hydration tests", () => {
  before(() => {
    cy.addDsl(dsl);
  });
  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  it("1. setup serverside data", () => {
    cy.wait(1000);
    cy.NavigateToDatasourceEditor();

    // Click on sample(mock) user database.
    cy.get(datasource.mockUserDatabase).click();

    // Choose the first data source which consists of users keyword & Click on the "New Query +"" button
    // Choose the first data source which consists of users keyword & Click on the "New Query +"" button
    cy.get(`${datasource.datasourceCard}`)
      .filter(":contains('Users')")
      .first()
      .within(() => {
        cy.get(`${datasource.createQuery}`).click({ force: true });
      });
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
    cy.get(queryLocators.query).click({
      force: true,
    });

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

    cy.openPropertyPane("listwidgetv2");

    testJsontextClear("items");

    cy.testJsontext("items", "{{Query1.data}}");

    cy.togglebar(commonlocators.serverSidePaginationCheckbox);

    cy.get(toggleJSButton("onpagechange")).click({ force: true });
    cy.testJsontext("onpagechange", "{{Query1.run()}}");

    cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`).should(
      "have.length",
      3,
    );
  });

  it("2. using server side data", () => {
    //FirstPage
    //   First Row
    cy.get(`${widgetSelector("List1")}`).scrollIntoView();
    changeValueOfWidget("selectwidget", "Green", 0);
    changeValueOfWidget("inputwidgetv2", "First", 0);
    changeValueOfWidget("multiselectwidgetv2", ["Green"], 0);

    //   Second Row
    changeValueOfWidget("selectwidget", "Blue", 1);
    changeValueOfWidget("inputwidgetv2", "Second", 1);
    changeValueOfWidget("multiselectwidgetv2", ["Blue"], 1);

    //   Third Row
    changeValueOfWidget("selectwidget", "Red", 2);
    changeValueOfWidget("inputwidgetv2", "Third", 2);
    changeValueOfWidget("multiselectwidgetv2", ["Red"], 2);

    //   Go to next page
    cy.get(commonlocators.listPaginateNextButton).click({
      force: true,
    });
    cy.wait(200);

    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector(
            "List1",
          )} ${containerWidgetSelector} .t--widget-selectwidget button`,
        )
        .should("have.length", 3),
    );

    //   SecondPage
    //   First Row
    cy.get(`${widgetSelector("List1")}`).scrollIntoView();
    changeValueOfWidget("selectwidget", "Blue", 0);
    changeValueOfWidget("inputwidgetv2", "Fourth", 0);
    changeValueOfWidget("multiselectwidgetv2", ["Blue"], 0);

    //   Second Row
    changeValueOfWidget("selectwidget", "Red", 1);
    changeValueOfWidget("inputwidgetv2", "Fifth", 1);
    changeValueOfWidget("multiselectwidgetv2", ["Red"], 1);

    //   Third Row
    changeValueOfWidget("selectwidget", "Green", 2);
    changeValueOfWidget("inputwidgetv2", "Sixth", 2);
    changeValueOfWidget("multiselectwidgetv2", ["Green"], 2);

    //   Go to previous page
    cy.get(commonlocators.listPaginatePrevButton).click({
      force: true,
    });

    //Validate values in FirstPage
    //   First Row
    cy.wait(300);
    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector(
            "List1",
          )} ${containerWidgetSelector} .t--widget-selectwidget button`,
        )
        .should("have.length", 3),
    );

    cy.waitUntil(
      () =>
        cy
          .get(
            `${widgetSelector(
              "List1",
            )} ${containerWidgetSelector} .t--widget-selectwidget button span.bp3-button-text`,
          )
          .first()
          .invoke("text")
          .then(($selectedValue) => {
            expect($selectedValue).to.eq("Green");
          }),
      {
        timeout: 10000,
      },
    );
    cy.get(`${widgetSelector("List1")}`).scrollIntoView();
    verifyValueOfWidget("selectwidget", "Green", 0);
    verifyValueOfWidget("inputwidgetv2", "First", 0);
    verifyValueOfWidget("multiselectwidgetv2", ["Green"], 0);

    //   Second Row
    verifyValueOfWidget("selectwidget", "Blue", 1);
    verifyValueOfWidget("inputwidgetv2", "Second", 1);
    verifyValueOfWidget("multiselectwidgetv2", ["Blue"], 1);

    //   Third Row
    verifyValueOfWidget("selectwidget", "Red", 2);
    verifyValueOfWidget("inputwidgetv2", "Third", 2);
    verifyValueOfWidget("multiselectwidgetv2", ["Red"], 2);

    //   Go to next page
    cy.get(commonlocators.listPaginateNextButton).click({
      force: true,
    });
    cy.wait(300);

    //Validate values in SecondPage
    //   First Row
    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector(
            "List1",
          )} ${containerWidgetSelector} .t--widget-selectwidget button`,
        )
        .should("have.length", 3),
    );

    cy.waitUntil(
      () =>
        cy
          .get(
            `${widgetSelector(
              "List1",
            )} ${containerWidgetSelector} .t--widget-selectwidget button span.bp3-button-text`,
          )
          .first()
          .invoke("text")
          .then(($selectedValue) => {
            expect($selectedValue).to.eq("Blue");
          }),
      {
        timeout: 10000,
      },
    );
    cy.get(`${widgetSelector("List1")}`).scrollIntoView();
    verifyValueOfWidget("selectwidget", "Blue", 0);
    verifyValueOfWidget("inputwidgetv2", "Fourth", 0);
    verifyValueOfWidget("multiselectwidgetv2", ["Blue"], 0);

    //   Second Row
    verifyValueOfWidget("selectwidget", "Red", 1);
    verifyValueOfWidget("inputwidgetv2", "Fifth", 1);
    verifyValueOfWidget("multiselectwidgetv2", ["Red"], 1);

    //   Third Row
    verifyValueOfWidget("selectwidget", "Green", 2);
    verifyValueOfWidget("inputwidgetv2", "Sixth", 2);
    verifyValueOfWidget("multiselectwidgetv2", ["Green"], 2);
  });

  it("3. using server side data in view mode", () => {
    cy.PublishtheApp();
    cy.get(`${widgetSelector("List1")} ${containerWidgetSelector}`).should(
      "have.length",
      3,
    );
    //FirstPage
    //   First Row
    changeValueOfWidget("selectwidget", "Green", 0);
    changeValueOfWidget("inputwidgetv2", "First", 0);
    changeValueOfWidget("multiselectwidgetv2", ["Green"], 0);

    //   Second Row
    changeValueOfWidget("selectwidget", "Blue", 1);
    changeValueOfWidget("inputwidgetv2", "Second", 1);
    changeValueOfWidget("multiselectwidgetv2", ["Blue"], 1);

    //   Third Row
    changeValueOfWidget("selectwidget", "Red", 2);
    changeValueOfWidget("inputwidgetv2", "Third", 2);
    changeValueOfWidget("multiselectwidgetv2", ["Red"], 2);

    //   Go to next page
    cy.get(commonlocators.listPaginateNextButton).click({
      force: true,
    });
    cy.wait(200);

    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector(
            "List1",
          )} ${containerWidgetSelector} .t--widget-selectwidget button`,
        )
        .should("have.length", 3),
    );

    //   SecondPage
    //   First Row
    changeValueOfWidget("selectwidget", "Blue", 0);
    changeValueOfWidget("inputwidgetv2", "Fourth", 0);
    changeValueOfWidget("multiselectwidgetv2", ["Blue"], 0);

    //   Second Row
    changeValueOfWidget("selectwidget", "Red", 1);
    changeValueOfWidget("inputwidgetv2", "Fifth", 1);
    changeValueOfWidget("multiselectwidgetv2", ["Red"], 1);

    //   Third Row
    changeValueOfWidget("selectwidget", "Green", 2);
    changeValueOfWidget("inputwidgetv2", "Sixth", 2);
    changeValueOfWidget("multiselectwidgetv2", ["Green"], 2);

    //   Go to previous page
    cy.get(commonlocators.listPaginatePrevButton).click({
      force: true,
    });

    //Validate values in FirstPage
    //   First Row
    cy.wait(300);
    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector(
            "List1",
          )} ${containerWidgetSelector} .t--widget-selectwidget button`,
        )
        .should("have.length", 3),
    );

    cy.waitUntil(
      () =>
        cy
          .get(
            `${widgetSelector(
              "List1",
            )} ${containerWidgetSelector} .t--widget-selectwidget button span.bp3-button-text`,
          )
          .first()
          .invoke("text")
          .then(($selectedValue) => {
            expect($selectedValue).to.eq("Green");
          }),
      {
        timeout: 10000,
      },
    );
    cy.get(`${widgetSelector("List1")}`).scrollIntoView();
    verifyValueOfWidget("selectwidget", "Green", 0);
    verifyValueOfWidget("inputwidgetv2", "First", 0);
    verifyValueOfWidget("multiselectwidgetv2", ["Green"], 0);

    //   Second Row
    verifyValueOfWidget("selectwidget", "Blue", 1);
    verifyValueOfWidget("inputwidgetv2", "Second", 1);
    verifyValueOfWidget("multiselectwidgetv2", ["Blue"], 1);

    //   Third Row
    verifyValueOfWidget("selectwidget", "Red", 2);
    verifyValueOfWidget("inputwidgetv2", "Third", 2);
    verifyValueOfWidget("multiselectwidgetv2", ["Red"], 2);

    //   Go to next page
    cy.get(commonlocators.listPaginateNextButton).click({
      force: true,
    });

    //Validate values in SecondPage
    //   First Row
    cy.wait(300);
    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector(
            "List1",
          )} ${containerWidgetSelector} .t--widget-selectwidget button`,
        )
        .should("have.length", 3),
    );

    cy.waitUntil(
      () =>
        cy
          .get(
            `${widgetSelector(
              "List1",
            )} ${containerWidgetSelector} .t--widget-selectwidget button span.bp3-button-text`,
          )
          .first()
          .invoke("text")
          .then(($selectedValue) => {
            expect($selectedValue).to.eq("Blue");
          }),
      {
        timeout: 10000,
      },
    );
    cy.get(`${widgetSelector("List1")}`).scrollIntoView();
    verifyValueOfWidget("selectwidget", "Blue", 0);
    verifyValueOfWidget("inputwidgetv2", "Fourth", 0);
    verifyValueOfWidget("multiselectwidgetv2", ["Blue"], 0);

    //   Second Row
    verifyValueOfWidget("selectwidget", "Red", 1);
    verifyValueOfWidget("inputwidgetv2", "Fifth", 1);
    verifyValueOfWidget("multiselectwidgetv2", ["Red"], 1);

    //   Third Row
    verifyValueOfWidget("selectwidget", "Green", 2);
    verifyValueOfWidget("inputwidgetv2", "Sixth", 2);
    verifyValueOfWidget("multiselectwidgetv2", ["Green"], 2);

    cy.get(publishPage.backToEditor).click({ force: true });
  });
});
