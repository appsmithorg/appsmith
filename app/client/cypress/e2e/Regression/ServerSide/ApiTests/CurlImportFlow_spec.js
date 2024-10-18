import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

const apiwidget = require("../../../../locators/apiWidgetslocator.json");
import ApiEditor from "../../../../locators/ApiEditor";

import {
  agHelper,
  apiPage,
  dataSources,
  entityItems,
  dataManager,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Test curl import flow",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    it("1. Test curl import flow Run and Delete", function () {
      localStorage.setItem("ApiPaneV2", "ApiPaneV2");
      apiPage.FillCurlNImport(
        "curl -X GET " +
          dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
      );
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Api,
      });
    });

    it("2. Bug:15175 Creating new cURL import query from entity explorer crashes the app", function () {
      cy.fixture("datasources").then((datasourceFormData) => {
        EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
        apiPage.FillCurlNImport(
          'curl -d \'{"name":"morpheus","job":"leader"}\' -H Content-Type:application/json -X POST ' +
            datasourceFormData["echoApiUrl"],
        );
      });
    });

    it("3. Bug:19214 Test curl import flow for request without any headers", function () {
      cy.fixture("datasources").then((datasourceFormData) => {
        apiPage.FillCurlNImport(
          "curl -X GET " + datasourceFormData["echoApiUrl"],
        );
        apiPage.AssertEmptyHeaderKeyValuePairsPresent(0);
        apiPage.AssertEmptyHeaderKeyValuePairsPresent(1);
      });
    });
  },
);
