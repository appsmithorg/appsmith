import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation", function () {
  it("1. Validate change with auto height width for widgets", function () {
    cy.fixture("dynamicHeightContainerScrolldsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
    cy.wait(3000); //for dsl to settle
    cy.openPropertyPane("containerwidget");
    cy.get(".t--widget-textwidget").trigger("mouseover", { force: true }); // Scroll 'sidebar' to its bottom
    cy.openPropertyPane("textwidget");
    //_.deployMode.DeployApp();
    //cy.wait(5000);
    //cy.get(".t--widget-containerwidget").trigger("mouseover",{force:true}) // Scroll 'sidebar' to its bottom
    cy.wait(5000);
  });
});
