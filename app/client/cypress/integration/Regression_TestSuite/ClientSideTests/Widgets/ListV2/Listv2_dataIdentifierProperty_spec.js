const simpleListDSL = require("../../../../../fixtures/Listv2/simpleList.json");
const simpleListWithLargeDataDSL = require("../../../../../fixtures/Listv2/simpleListWithLargeData.json");
const ListV2WithNullPrimaryKeyDSL = require("../../../../../fixtures/Listv2/ListV2WithNullPrimaryKey.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const propertyControl = ".t--property-control";
const agHelper = ObjectsRegistry.AggregateHelper;

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;

function testJsontextClear(endp) {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  cy.get(".t--property-control-" + endp + " .CodeMirror textarea")
    .first()
    .focus({ force: true })
    .type(`{${modifierKey}}{a}`, { force: true })
    .type(`{${modifierKey}}{del}`, { force: true });
}

const data = [
  {
    id: "001",
    name: "Blue",
    img: "https://assets.appsmith.com/widgets/default.png",
    same: "1",
  },
  {
    id: "002",
    name: "Green",
    img: "https://assets.appsmith.com/widgets/default.png",
    same: "01",
  },
  {
    id: "003",
    name: "Red",
    img: "https://assets.appsmith.com/widgets/default.png",
    same: 1,
  },
];

describe("List v2 - Data Identifier property", () => {
  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  it("1. is present in the property pane", () => {
    cy.addDsl(simpleListDSL);

    cy.openPropertyPane("listwidgetv2");

    cy.get(`${propertyControl}-dataidentifier`)
      .should("exist")
      .contains("No selection.");
  });

  it("2. shows list of keys present in list data", () => {
    const keys = ["id", "name", "img"];
    cy.openPropertyPane("listwidgetv2");

    // clicking on the data identifier dropdown
    cy.get(`${propertyControl}-dataidentifier`)
      .find(".bp3-popover-target")
      .last()
      .click({ force: true });
    cy.wait(250);

    // check if all the keys are present
    cy.get(".t--dropdown-option > span")
      .should("have.length", 3)
      .then(($el) => {
        // we get a list of jQuery elements
        // convert the jQuery object into a plain array
        return (
          Cypress.$.makeArray($el)
            // extract inner text from each
            .map((el) => el.innerText)
        );
      })
      .should("deep.equal", keys);
  });

  it("3. on selection of key from dropdown, it should show same number of rows", () => {
    cy.openPropertyPane("listwidgetv2");

    // clicking on the data identifier dropdown
    cy.get(`${propertyControl}-dataidentifier`)
      .find(".bp3-popover-target")
      .last()
      .click({ force: true });
    cy.wait(250);

    cy.get(".t--dropdown-option").first().click({ force: true });

    cy.wait(1000);

    cy.get(widgetsPage.containerWidget).should("have.length", 3);
  });

  it("4. enabling the JS mode, it should prefill with currentItem", () => {
    cy.get(`${propertyControl}-dataidentifier`)
      .find(".t--js-toggle")
      .click({ force: true });

    cy.get(`${propertyControl}-dataidentifier`)
      .find(".CodeMirror .CodeMirror-code")
      .contains(`{{ currentItem["id"] }}`);
  });

  it("5. when given composite key, should produce a valid array", () => {
    const keys = ["001_Blue_0_ABC", "002_Green_1_ABC", "003_Red_2_ABC"];

    cy.get(`${propertyControl}-dataidentifier`)
      .find(".t--js-toggle")
      .click({ force: true });

    cy.testJsontext(
      "dataidentifier",
      "{{currentItem.id + '_' + currentItem.name + '_' + currentIndex }}_ABC",
    );

    cy.wait(1000);

    keys.forEach((key) => {
      cy.validateEvaluatedValue(key);
    });
  });

  it("6. with large data set and data identifier set, the rows should render", () => {
    cy.addDsl(simpleListWithLargeDataDSL);

    cy.openPropertyPane("listwidgetv2");

    // clicking on the data identifier dropdown
    cy.get(`${propertyControl}-dataidentifier`)
      .find(".bp3-popover-target")
      .last()
      .click({ force: true });
    cy.wait(250);

    cy.get(".t--dropdown-option").first().click({ force: true });

    cy.get(widgetsPage.containerWidget).should("have.length", 2);

    cy.get(".rc-pagination").find("a").contains("2").click({ force: true });

    cy.get(widgetsPage.containerWidget).should("have.length", 2);
  });

  it("7. non unique data identifier should throw error", () => {
    cy.openPropertyPane("listwidgetv2");

    // clicking on the data identifier dropdown
    cy.get(`${propertyControl}-dataidentifier`)
      .find(".bp3-popover-target")
      .last()
      .click({ force: true });
    cy.wait(250);

    cy.get(".t--dropdown-option").last().click({ force: true });

    cy.get(widgetsPage.containerWidget).should("have.length", 2);

    // click on debugger icon
    cy.get(commonlocators.debugger).should("be.visible").click({ force: true });
    cy.get(".debugger-list").contains(
      "This data identifier is evaluating to a duplicate value. Please use an identifier that evaluates to a unique value.",
    );
  });

  it("8. pagination should work for non unique data identifier", () => {
    cy.get(".rc-pagination").find("a").contains("2").click({ force: true });

    cy.get(widgetsPage.containerWidget).should("have.length", 2);
  });

  it("9. Widgets get displayed when PrimaryKey doesn't exist - SSP", () => {
    cy.addDsl(ListV2WithNullPrimaryKeyDSL);
    cy.createAndFillApi(
      "https://api.punkapi.com/v2/beers?page={{List1.pageNo}}&per_page={{List1.pageSize}}",
      "",
    );
    cy.RunAPI();
    cy.SearchEntityandOpen("List1");
    cy.openPropertyPaneByWidgetName("Text2", "textwidget");

    cy.testJsontext("text", "{{currentIndex}}");

    cy.get(`${widgetSelector("Text2")} ${commonlocators.bodyTextStyle}`)
      .first()
      .should("have.text", `0`);

    cy.get(commonlocators.listPaginateNextButton).first().click({
      force: true,
    });
    cy.wait(1000);

    cy.get(`${widgetSelector("Text2")} ${commonlocators.bodyTextStyle}`)
      .first()
      .should("have.text", "0");
  });

  it("10. Widgets get displayed when PrimaryKey doesn't exist - Client-Side Pagination", () => {
    cy.openPropertyPaneByWidgetName("Text4", "textwidget");

    cy.testJsontext("text", "{{currentIndex}}");

    cy.get(`${widgetSelector("Text4")} ${commonlocators.bodyTextStyle}`)
      .first()
      .should("have.text", `0`);

    cy.get(commonlocators.listPaginateNextButton).eq(1).click({
      force: true,
    });

    cy.get(`${widgetSelector("Text4")} ${commonlocators.bodyTextStyle}`)
      .first()
      .should("have.text", `1`);

    cy.get(commonlocators.listPaginateNextButton).eq(1).click({
      force: true,
    });

    cy.get(`${widgetSelector("Text4")} ${commonlocators.bodyTextStyle}`)
      .first()
      .should("have.text", `2`);
  });

  it("11. Non unique data identifier should throw error- (data type issue)", () => {
    cy.openPropertyPaneByWidgetName("List2", "listwidgetv2");

    testJsontextClear("items");

    cy.testJsontext("items", JSON.stringify(data));

    // clicking on the data identifier dropdown
    testJsontextClear("dataidentifier");
    cy.get(`${propertyControl}-dataidentifier`)
      .find(".t--js-toggle")
      .click({ force: true });
    cy.wait(250);

    cy.get(`${propertyControl}-dataidentifier`)
      .find(".bp3-popover-target")
      .last()
      .click({
        force: true,
      });
    cy.wait(250);

    cy.get(".t--dropdown-option").contains("same").last().click({});
    cy.get(`${widgetSelector("List2")} ${widgetsPage.containerWidget}`).should(
      "have.length",
      1,
    );

    // click on debugger icon
    cy.get(commonlocators.debugger).should("be.visible").click({
      force: true,
    });
    cy.get(".debugger-list").contains(
      "This data identifier is evaluating to a duplicate value. Please use an identifier that evaluates to a unique value.",
    );
  });
});
