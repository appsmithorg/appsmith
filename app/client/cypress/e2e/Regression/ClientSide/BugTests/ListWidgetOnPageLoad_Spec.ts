import {
  agHelper,
  dataSources,
  deployMode,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  AppSidebar,
  AppSidebarButton,
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "JS Function execution data mutation",
  { tags: ["@tag.Widget", "@tag.List"] },
  function () {
    before(() => {
      agHelper.AddDsl("Listv2/simpleList");
    });

    it("1. List widget gets populated on page load. Bug: 29566", function () {
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(() => {
        dataSources.CreateQueryAfterDSSaved(
          "SELECT id,name FROM public.users LIMIT 10;",
        );
        dataSources.ToggleUsePreparedStatement(false);
        dataSources.RunQuery();
      });
      AppSidebar.navigate(AppSidebarButton.Editor);
      PageLeftPane.switchSegment(PagePaneSegment.UI);
      EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Items", "{{Query1.data}}");
      propPane.TogglePropertyState("Server side pagination", "Off");
      propPane.SelectPropertiesDropDown("Data Identifier", "id");
      agHelper
        .GetText(locators._widgetInCanvas("textwidget") + " span")
        .then((initialTexts: string[]) => {
          deployMode.DeployApp();
          agHelper.AssertElementLength(locators._textWidgetInDeployed, 6);
          agHelper
            .GetText(locators._textWidgetInDeployed)
            .then((deployedTexts: string[]) => {
              expect(deployedTexts).to.deep.equal(initialTexts);
            });
          agHelper.CypressReload();
          agHelper.AssertElementLength(locators._textWidgetInDeployed, 6);
          agHelper
            .GetText(locators._textWidgetInDeployed)
            .then((deployedTexts: string[]) => {
              expect(deployedTexts).to.deep.equal(initialTexts);
            });
        });
    });
  },
);
