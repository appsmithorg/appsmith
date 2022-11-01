const simpleListDSL = require("../../../../../fixtures/Listv2/simpleList.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

const propertyControl = ".t--property-control";

describe("List v2 - Primary Key property", () => {
  it("1. is present in the property pane", () => {
    cy.addDsl(simpleListDSL);

    cy.openPropertyPane("listwidgetv2");

    cy.get(`${propertyControl}-primarykey`)
      .should("exist")
      .contains("No selection.");
  });

  it("2. shows list of keys present in list data", () => {
    const keys = ["id", "name", "img"];
    cy.openPropertyPane("listwidgetv2");

    // clicking on the primary key dropdown
    cy.get(`${propertyControl}-primarykey`)
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

    // clicking on the primary key dropdown
    cy.get(`${propertyControl}-primarykey`)
      .find(".bp3-popover-target")
      .last()
      .click({ force: true });
    cy.wait(250);

    cy.get(".t--dropdown-option")
      .last()
      .click({ force: true });

    cy.wait(1000);

    cy.get(widgetsPage.containerWidget).should("have.length", 3);
  });

  it("4. when given composite key, should produce a valid array", () => {
    const keys = ["001_Blue_0_ABC", "002_Green_1_ABC", "003_Red_2_ABC"];

    cy.get(`${propertyControl}-primarykey`)
      .find(".t--js-toggle")
      .click({ force: true });

    cy.testJsontext(
      "primarykey",
      "{{currentItem.id + '_' + currentItem.name + '_' + currentIndex }}_ABC",
    );

    cy.wait(1000);

    keys.forEach((key) => {
      cy.validateEvaluatedValue(key);
    });
  });
});
