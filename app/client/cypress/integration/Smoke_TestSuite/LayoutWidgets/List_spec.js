const commonlocators = require("../../../locators/commonlocators.json");
const widgetsPage = require("../../../locators/Widgets.json");
const dsl = require("../../../fixtures/listdsl.json");

describe("Container Widget Functionality", function() {
  const items = JSON.parse(dsl.dsl.children[0].items);

  before(() => {
    cy.addDsl(dsl);
  });

  it("checks if list shows correct no. of items", function() {
    cy.get(commonlocators.containerWidget).then(function($lis) {
      expect($lis).to.have.length(items.length);
    });
  });

  it("checks currentItem binding", function() {
    cy.SearchEntityandOpen("Text1");
    cy.getCodeMirror().then(($cm) => {
      cy.get(".CodeMirror textarea")
        .first()
        .type(`{{currentItem.first_name}}`, {
          force: true,
          parseSpecialCharSequences: false,
        });
    });

    cy.wait(1000);

    cy.get(commonlocators.TextInside).then(function($lis) {
      expect($lis).to.have.length(items.length);
      expect($lis.eq(0)).to.contain(items[0].first_name);
      expect($lis.eq(1)).to.contain(items[1].first_name);
    });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
