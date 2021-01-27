const commonlocators = require("../../../locators/commonlocators.json");
const widgetsPage = require("../../../locators/Widgets.json");
const dsl = require("../../../fixtures/listdsl.json");

describe("Container Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("checks if list shows correct no. of items", function() {
    cy.openPropertyPane("listwidget");
    const items = JSON.parse(dsl.dsl.children[0].items);

    cy.get(commonlocators.containerWidget).then(function($lis) {
      expect($lis).to.have.length(items.length);
    });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
