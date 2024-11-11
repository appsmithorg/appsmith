import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Binding - List widget to text widget",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("listRegression2Dsl");
    });

    it("1. Validate text widget data based on changes in list widget data", function () {
      _.deployMode.DeployApp();
      cy.get(".t--widget-textwidget span:contains('pawan,Vivek')").should(
        "have.length",
        1,
      );
      cy.get(".t--widget-textwidget span:contains('Ashok,rahul')").should(
        "have.length",
        1,
      );
      _.deployMode.NavigateBacktoEditor();
      cy.get(".t--text-widget-container:contains('pawan,Vivek')").should(
        "have.length",
        1,
      );
      cy.get(".t--text-widget-container:contains('Ashok,rahul')").should(
        "have.length",
        1,
      );
    });
  },
);
