const commonlocators = require("../../../../locators/commonlocators.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Widget Grouping", { tags: ["@tag.Binding"] }, function () {
  before(() => {
    _.agHelper.AddDsl("buttonGroupDsl");
  });

  it("1. Button widgets widget on click info message valdiation with font family", function () {
    cy.get(".t--buttongroup-widget button")
      .contains("Add")
      .click({ force: true });
    cy.get(".t--buttongroup-widget button")
      .contains("More")
      .click({ force: true });
    cy.get(commonlocators.toastmsg).contains("test alert");
    cy.get(commonlocators.toastmsg)
      .invoke("css", "font-family")
      .then((dropdownFont) => {
        _.deployMode.DeployApp();
        cy.get(".t--buttongroup-widget button")
          .contains("Add")
          .click({ force: true });
        cy.get(".t--buttongroup-widget button")
          .contains("More")
          .click({ force: true });
        cy.get(commonlocators.toastmsg).contains("test alert");
        cy.get(commonlocators.toastmsg)
          .invoke("css", "font-family")
          .then((publishdropdownFont) => {
            expect(dropdownFont).to.equal(publishdropdownFont);
          });
      });
  });
});
