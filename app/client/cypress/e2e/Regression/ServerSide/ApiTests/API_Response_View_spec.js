import {
  AppSidebar,
  AppSidebarButton,
} from "../../../../support/Pages/EditorNavigation";

const testdata = require("../../../../fixtures/testdata.json");
import { agHelper, apiPage } from "../../../../support/Objects/ObjectsCore";
import BottomTabs from "../../../../support/Pages/IDE/BottomTabs";
const testUrl1 =
  "http://host.docker.internal:5001/v1/dynamicrecords/getstudents";

describe(
  "Bug 14666: Api Response Test Functionality ",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    it("1. Test table loading when data is in array format", function () {
      cy.log("Login Successful");
      apiPage.CreateAndFillApi(testUrl1, "TableTestAPI");
      agHelper.AssertAutoSave();
      apiPage.RunAPI();
      BottomTabs.response.validateTypeInMenu("TABLE", "exist");
      cy.DeleteAPI();
    });

    it("2. Test table loading when data is not in array format", function () {
      AppSidebar.navigate(AppSidebarButton.Editor);
      apiPage.CreateAndFillApi(
        testdata.baseUrl + testdata.echoMethod,
        "TableTestAPI",
      );
      agHelper.AssertAutoSave();
      apiPage.RunAPI();
      BottomTabs.response.validateTypeInMenu("TABLE", "not.exist");
      cy.DeleteAPI();
    });
  },
);
