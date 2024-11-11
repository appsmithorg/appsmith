import * as _ from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Binding the list widget with text widget",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  function () {
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
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);

      _.propPane.UpdatePropertyFieldValue(
        "Items",
        '[[{ "name": "pawan"}, { "name": "Vivek" }], [{ "name": "Ashok"}, {"name": "rahul"}]]',
      );
      PageLeftPane.expandCollapseItem("List1");
      PageLeftPane.expandCollapseItem("Container1");
      EditorNavigation.SelectEntityByName("Text3", EntityType.Widget, [
        "List1",
        "Container1",
      ]);

      cy.wait(1000);
      _.propPane.UpdatePropertyFieldValue(
        "Text",
        '{{currentItem.map(item => item.name).join(", ")}}',
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
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);

      _.propPane.UpdatePropertyFieldValue(
        "Items",
        '[{ "name": "pawan"}, { "name": "Vivek" }]',
      );
      PageLeftPane.expandCollapseItem("List1");
      PageLeftPane.expandCollapseItem("Container1");
      EditorNavigation.SelectEntityByName("Text3", EntityType.Widget, [
        "List1",
        "Container1",
      ]);

      cy.wait(1000);
      _.propPane.UpdatePropertyFieldValue("Text", "{{currentItem.name}}");
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
  },
);
