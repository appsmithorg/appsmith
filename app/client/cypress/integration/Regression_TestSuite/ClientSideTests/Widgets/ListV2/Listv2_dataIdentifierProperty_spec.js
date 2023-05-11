const simpleListDSL = require("../../../../../fixtures/Listv2/simpleList.json");
const simpleListWithLargeDataDSL = require("../../../../../fixtures/Listv2/simpleListWithLargeData.json");
const ListV2WithNullPrimaryKeyDSL = require("../../../../../fixtures/Listv2/ListV2WithNullPrimaryKey.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

const propertyControl = ".t--property-control";

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
    _.agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    _.agHelper.SaveLocalStorageCache();
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
    _.apiPage.CreateAndFillApi(
      "https://api.punkapi.com/v2/beers?page={{List1.pageNo}}&per_page={{List1.pageSize}}",
    );
    _.apiPage.RunAPI();
    _.entityExplorer.ExpandCollapseEntity("Widgets");
    _.entityExplorer.ExpandCollapseEntity("List1");
    _.entityExplorer.ExpandCollapseEntity("Container1");
    _.entityExplorer.SelectEntityByName("Text2");
    _.propPane.UpdatePropertyFieldValue("Text", "{{currentIndex}}");

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
    _.entityExplorer.ExpandCollapseEntity("Widgets");
    _.entityExplorer.ExpandCollapseEntity("List2");
    _.entityExplorer.ExpandCollapseEntity("Container2");
    _.entityExplorer.SelectEntityByName("Text4");
    _.propPane.UpdatePropertyFieldValue("Text", "{{currentIndex}}");

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
    _.entityExplorer.SelectEntityByName("List2");
    _.propPane.UpdatePropertyFieldValue("Items", JSON.stringify(data));
    _.propPane.UpdatePropertyFieldValue("Data Identifier", "");
    // clicking on the data identifier dropdown
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

    cy.get(".debugger-list").contains(
      "This data identifier is evaluating to a duplicate value. Please use an identifier that evaluates to a unique value.",
    );
  });
});
