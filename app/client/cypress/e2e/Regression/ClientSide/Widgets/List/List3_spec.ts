import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Binding the list widget with text widget",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("listRegression3Dsl");
    });

    it("Validate text widget data based on changes in list widget Data3", function () {
      _.deployMode.DeployApp();
      cy.wait(5000);
      cy.get(".t--widget-textwidget span:contains('Vivek')").should(
        "have.length",
        2,
      );
      cy.get(".t--widget-textwidget span:contains('pawan')").should(
        "have.length",
        2,
      );
      _.deployMode.NavigateBacktoEditor();
      cy.get(".t--text-widget-container:contains('Vivek')").should(
        "have.length",
        2,
      );
      cy.get(".t--text-widget-container:contains('pawan')").should(
        "have.length",
        2,
      );
    });
  },
);
