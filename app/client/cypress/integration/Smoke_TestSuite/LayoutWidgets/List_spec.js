const commonlocators = require("../../../locators/commonlocators.json");
const widgetsPage = require("../../../locators/Widgets.json");
const dsl = require("../../../fixtures/listdsl.json");
const publishPage = require("../../../locators/publishWidgetspage.json");

describe("Container Widget Functionality", function() {
  const items = JSON.parse(dsl.dsl.children[0].listData);

  before(() => {
    cy.addDsl(dsl);
  });

  it("checks if list shows correct no. of items", function() {
    cy.get(commonlocators.containerWidget).then(function($lis) {
      expect($lis).to.have.length(2);
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

    cy.closePropertyPane();

    cy.get(commonlocators.TextInside).then(function($lis) {
      expect($lis.eq(0)).to.contain(items[0].first_name);
      expect($lis.eq(1)).to.contain(items[1].first_name);
    });
  });

  it("checks button action", function() {
    cy.SearchEntityandOpen("Button1");
    cy.getCodeMirror().then(($cm) => {
      cy.get(".CodeMirror textarea")
        .first()
        .type(`{{currentItem.first_name}}`, {
          force: true,
          parseSpecialCharSequences: false,
        });
    });
    cy.addAction("{{currentItem.first_name}}");

    cy.PublishtheApp();

    cy.get(`${widgetsPage.widgetBtn}`)
      .first()
      .click();

    cy.get(commonlocators.toastmsg).contains(items[0].first_name);
  });

  it("it checks onListItem click action", function() {
    cy.get(publishPage.backToEditor).click({ force: true });

    cy.SearchEntityandOpen("List1");
    cy.addAction("{{currentItem.first_name}}");

    cy.PublishtheApp();

    cy.get(
      "div[type='LIST_WIDGET'] .t--widget-containerwidget:first-child",
    ).click();

    cy.get(commonlocators.toastmsg).contains(items[0].first_name);
  });

  it("it checks pagination", function() {
    // clicking on second pagination button
    cy.get(`${commonlocators.paginationButton}-2`).click();

    // now we are on the second page which shows first the 3rd item in the list
    cy.get(commonlocators.TextInside).then(function($lis) {
      expect($lis.eq(0)).to.contain(items[2].first_name);
    });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
