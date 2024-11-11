import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

const apiwidget = require("../../../../locators/apiWidgetslocator.json");
import {
  entityExplorer,
  dataSources,
} from "../../../../support/Objects/ObjectsCore";

const pageid = "MyPage";
let updatedName;
let datasourceName;

describe(
  "Entity explorer tests related to copy query",
  { tags: ["@tag.IDE", "@tag.PropertyPane"] },
  function () {
    beforeEach(() => {
      dataSources.StartDataSourceRoutes();
    });

    it("1. Create a query with dataSource in explorer, Create new Page", function () {
      cy.Createpage(pageid);
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      dataSources.CreateDataSource("Postgres");

      cy.get("@saveDatasource").then((httpResponse) => {
        datasourceName = httpResponse.response.body.data.name;
        dataSources.CreateQueryAfterDSSaved(datasourceName);
      });

      cy.get("@getPluginForm").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );

      dataSources.EnterQuery("select * from users");

      cy.EvaluateCurrentValue("select * from users");
      cy.get(".t--action-name-edit-field").click({ force: true });
      cy.get("@saveDatasource").then((httpResponse) => {
        datasourceName = httpResponse.response.body.data.name;
        PageLeftPane.switchSegment(PagePaneSegment.Queries);
        entityExplorer.ActionContextMenuByEntityName({
          entityNameinLeftSidebar: "Query1",
          action: "Show bindings",
        });
        cy.get(apiwidget.propertyList).then(function ($lis) {
          expect($lis).to.have.length(5);
          expect($lis.eq(0)).to.contain("{{Query1.isLoading}}");
          expect($lis.eq(1)).to.contain("{{Query1.data}}");
          expect($lis.eq(2)).to.contain("{{Query1.responseMeta}}");
          expect($lis.eq(3)).to.contain("{{Query1.run()}}");
          expect($lis.eq(4)).to.contain("{{Query1.clear()}}");
        });
      });
    });

    it("2. Copy query in explorer to new page & verify Bindings are copied too", function () {
      EditorNavigation.SelectEntityByName("Query1", EntityType.Query);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Query1",
        action: "Copy to page",
        subAction: pageid,
        toastToValidate: "copied to page",
      });
      EditorNavigation.SelectEntityByName("Query1", EntityType.Query);
      cy.runQuery();
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Query1",
        action: "Show bindings",
      });
      cy.get(apiwidget.propertyList).then(function ($lis) {
        expect($lis.eq(0)).to.contain("{{Query1.isLoading}}");
        expect($lis.eq(1)).to.contain("{{Query1.data}}");
        expect($lis.eq(2)).to.contain("{{Query1.responseMeta}}");
        expect($lis.eq(3)).to.contain("{{Query1.run()}}");
        expect($lis.eq(4)).to.contain("{{Query1.clear()}}");
      });
    });
  },
);
