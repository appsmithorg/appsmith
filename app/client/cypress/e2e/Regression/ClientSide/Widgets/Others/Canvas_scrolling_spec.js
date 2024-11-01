import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Modal Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Modal", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("modalScroll");
    });

    it("1. [Bug]- 11415 - Open  Modal from button and test scroll", () => {
      _.deployMode.DeployApp();
      cy.get("span:contains('Submit')").closest("div").click();
      cy.get(".t--modal-widget").should("exist");
      cy.get("span:contains('Close')").closest("div").should("not.be.visible");
      cy.get(".t--modal-widget").then(($el) => $el[0].scrollTo(0, 500));

      cy.get("span:contains('Close')").closest("div").should("be.visible");
      cy.get(".t--modal-widget").then(($el) => $el[0].scrollTo(0, 0));
      cy.get("span:contains('Close')").closest("div").should("not.be.visible");
    });
  },
);
