import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Binding the list widget with text widget", function () {
  //const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  before(() => {
    _.agHelper.AddDsl("listRegressionDsl");
  });

  it("1. Validate text widget data based on changes in list widget Data1", function () {
    _.deployMode.DeployApp();
    cy.wait(2000);
    cy.get(".t--widget-textwidget span:contains('Vivek')").should(
      "have.length",
      1,
    );
    cy.get(".t--widget-textwidget span:contains('Pawan')").should(
      "have.length",
      1,
    );
    _.deployMode.NavigateBacktoEditor();
    cy.get(".t--text-widget-container:contains('Vivek')").should(
      "have.length",
      1,
    );
    cy.get(".t--text-widget-container:contains('Vivek')").should(
      "have.length",
      1,
    );
  });

  it("2. Validate text widget data based on changes in list widget Data2", function () {
    _.entityExplorer.SelectEntityByName("List1");

    _.propPane.UpdatePropertyFieldValue(
      "Items",
      '[[{ "name": "pawan"}, { "name": "Vivek" }], [{ "name": "Ashok"}, {"name": "rahul"}]]',
    );
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    _.entityExplorer.ExpandCollapseEntity("List1");
    _.entityExplorer.ExpandCollapseEntity("Container1");
    _.entityExplorer.SelectEntityByName("Text3");

    cy.wait(1000);
    _.propPane.UpdatePropertyFieldValue(
      "Text",
      '{{currentItem.map(item => item.name).join(", ")}}',
    );
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    _.deployMode.DeployApp();
    cy.wait(2000);
    cy.get(".t--widget-textwidget span:contains('pawan, Vivek')").should(
      "have.length",
      1,
    );
    cy.get(".t--widget-textwidget span:contains('Ashok, rahul')").should(
      "have.length",
      1,
    );
    _.deployMode.NavigateBacktoEditor();
  });

  it("3. Validate text widget data based on changes in list widget Data3", function () {
    _.entityExplorer.ExpandCollapseEntity("Widgets");
    _.entityExplorer.SelectEntityByName("List1");

    _.propPane.UpdatePropertyFieldValue(
      "Items",
      '[{ "name": "pawan"}, { "name": "Vivek" }]',
    );
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    _.entityExplorer.ExpandCollapseEntity("List1");
    _.entityExplorer.ExpandCollapseEntity("Container1");
    _.entityExplorer.SelectEntityByName("Text3");

    cy.wait(1000);
    _.propPane.UpdatePropertyFieldValue("Text", "{{currentItem.name}}");
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    _.deployMode.DeployApp();
    cy.wait(2000);
    cy.get(".t--widget-textwidget span:contains('Vivek')").should(
      "have.length",
      2,
    );
    cy.get(".t--widget-textwidget span:contains('pawan')").should(
      "have.length",
      2,
    );
    _.deployMode.NavigateBacktoEditor();
  });

  after(function () {
    //-- Deleting the application by Api---//
    cy.DeleteAppByApi();
    //-- LogOut Application---//
  });
});
