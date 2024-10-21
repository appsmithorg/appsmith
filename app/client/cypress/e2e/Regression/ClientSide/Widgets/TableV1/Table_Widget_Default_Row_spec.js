import * as _ from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Table Widget property pane deafult feature validation",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("defaultTableDsl");
    });

    it("Verify default table row Data", function () {
      // Open property pane
      cy.openPropertyPane("tablewidget");
      cy.wait(2000);
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);

      cy.wait(2000);
      cy.readTabledataFromSpecificIndex("2", "0", 1).then((tabData) => {
        const tabValue = tabData;
        cy.log("the table is" + tabValue);
        cy.get(".bp3-ui-text span").eq(0).should("have.text", tabData);
      });
    });
  },
);
