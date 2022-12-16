const dsl = require("../../../../fixtures/buttonGroupDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Widget Grouping", function () {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Button widgets widget on click info message valdiation with font family", function () {
    cy.get(".t--buttongroup-widget button")
      .contains("Add")
      .click({ force: true });
    cy.get(".t--buttongroup-widget button")
      .contains("More")
      .click({ force: true });
    cy.get(commonlocators.toastmsg).contains("test alert");
    cy.get(commonlocators.toastmsg).invoke("css", "font-family")
    .then((dropdownFont) => {
      expect(dropdownFont).to.equal('-apple-system, "system-ui", "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue"');
    });
    cy.PublishtheApp();
    cy.get(".t--buttongroup-widget button")
      .contains("Add")
      .click({ force: true });
    cy.get(".t--buttongroup-widget button")
      .contains("More")
      .click({ force: true });
    cy.get(commonlocators.toastmsg).contains("test alert");
    cy.goToEditFromPublish();
  });
});
