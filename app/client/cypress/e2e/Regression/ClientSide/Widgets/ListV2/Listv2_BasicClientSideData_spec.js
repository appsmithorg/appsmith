const publishLocators = require("../../../../../locators/publishWidgetspage.json");
const commonlocators = require("../../../../../locators/commonlocators.json");

import * as _ from "../../../../../support/Objects/ObjectsCore";

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
const containerWidgetSelector = `[type="CONTAINER_WIDGET"]`;

const simpleListData1 = [
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
];

describe("List widget v2 - Basic client side data tests", () => {
  beforeEach(() => {
    _.agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    _.agHelper.SaveLocalStorageCache();
  });

  it("1. shows correct number of items", () => {
    _.agHelper.AddDsl("Listv2/simpleList");
    cy.get(publishLocators.containerWidget).should("have.length", 3);
    cy.get(publishLocators.imageWidget).should("have.length", 3);
    cy.get(publishLocators.textWidget).should("have.length", 6);
  });

  it("2. shows correct text from binding", () => {
    cy.get(publishLocators.containerWidget).each(($containerEl, index) => {
      cy.wrap($containerEl)
        .find(publishLocators.textWidget)
        .eq(0)
        .should("have.text", simpleListData1[index].name);
      cy.wrap($containerEl)
        .find(publishLocators.textWidget)
        .eq(1)
        .should("have.text", simpleListData1[index].id);
    });
  });

  it("3. retains input values when pages are switched", () => {
    _.agHelper.AddDsl("Listv2/simpleListWithInputAndButton");

    cy.get(publishLocators.inputWidget).should("have.length", 2);

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

    // Change to page 2
    cy.get(".rc-pagination-item")
      .find("a")
      .contains("2")
      .click({ force: true })
      .wait(500);

    cy.get(".rc-pagination-item-active").contains(2);

    cy.get(publishLocators.inputWidget).should("have.length", 2);

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
    cy.get(".rc-pagination-item")
      .find("a")
      .contains("1")
      .click({ force: true })
      .wait(500);

    cy.get(".rc-pagination-item-active").contains(1);

    cy.get(publishLocators.inputWidget).should("have.length", 2);

    // Verify if previously the typed values are retained
    cy.get(".t--draggable-inputwidgetv2").each(($inputWidget, index) => {
      cy.wrap($inputWidget)
        .find("input")
        .should("have.value", index + 1);
    });
  });

  it("4. Reset pageNo when serverside pagination is enabled", () => {
    cy.get(`${widgetSelector("List1")} .rc-pagination-item-3`).click({
      force: true,
    });

    cy.waitUntil(() =>
      cy.get(commonlocators.listPaginateActivePage).should("have.text", "3"),
    );

    cy.waitUntil(() =>
      cy
        .get(
          `${widgetSelector(
            "List1",
          )} ${containerWidgetSelector} .t--widget-imagewidget`,
        )
        .should("have.length", 2),
    );

    cy.openPropertyPane("listwidgetv2");
    cy.togglebar(commonlocators.serverSidePaginationCheckbox);

    // Page number resets
    cy.waitUntil(() =>
      cy.get(commonlocators.listPaginateActivePage).should("have.text", "1"),
    );

    cy.togglebarDisable(commonlocators.serverSidePaginationCheckbox);
  });
});
