import {
  agHelper,
  dataSources,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

let dsname;
describe(
  "Chart Widget Skeleton Loading Functionality",
  { tags: ["@tag.All", "@tag.Chart", "@tag.Binding"] },
  function () {
    before(() => {
      agHelper.AddDsl("ChartLoadingDsl");
    });

    it("1. Test case while reloading and on submission", function () {
      dataSources.CreateDataSource("Postgres");
      cy.get("@saveDatasource").then((httpResponse) => {
        dsname = httpResponse.response.body.data.name;
        dataSources.CreateQueryForDS(
          dsname,
          "SELECT * FROM users ORDER BY id LIMIT 10;",
        );
      });
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      agHelper.ClickButton("Submit", { waitAfterClick: false });
      agHelper
        .GetElement(
          ".t--widget-chartwidget div[class*='bp3-skeleton']",
          "noVerify",
        )
        .should("exist");
    });
  },
);
