import {
  AppSidebarButton,
  AppSidebar,
} from "../../../../support/Pages/EditorNavigation";

const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

import {
  agHelper,
  apiPage,
  dataSources,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";

describe("API Panel Test Functionality", function () {
  afterEach(function () {
    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      entityType: entityItems.Api,
    });
    AppSidebar.navigate(AppSidebarButton.Editor);
  });

  it("1. PUT Action test API feature", function () {
    apiPage.CreateAndFillApi(
      testdata.baseUrl + testdata.echoMethod,
      "",
      10000,
      "PUT",
    );
    cy.readFile("cypress/fixtures/putjson.txt").then((json) => {
      apiPage.SelectPaneTab("Body");
      apiPage.SelectSubTab("JSON");
      dataSources.EnterQuery(json);
      agHelper.AssertAutoSave();
      apiPage.RunAPI();
      apiPage.ResponseStatusCheck("200 OK");
      cy.validateRequest(
        "Executed successfully",
        testdata.baseUrl,
        testdata.echoMethod,
        testdata.Put,
      );
    });
    cy.ResponseCheck("updatedAt");
  });

  it("2. Post Action test API feature", function () {
    apiPage.CreateAndFillApi(
      testdata.baseUrl + testdata.echoMethod,
      "",
      10000,
      "POST",
    );
    cy.readFile("cypress/fixtures/postjson.txt").then((json) => {
      apiPage.SelectPaneTab("Body");
      apiPage.SelectSubTab("JSON");
      dataSources.EnterQuery(json);
      agHelper.AssertAutoSave();
      apiPage.RunAPI();
      apiPage.ResponseStatusCheck("200 OK");
      cy.validateRequest(
        "Executed successfully",
        testdata.baseUrl,
        testdata.echoMethod,
        testdata.Post,
      );
    });
    cy.ResponseCheck("createdAt");
  });

  it("3. PATCH Action test API feature", function () {
    apiPage.CreateAndFillApi(
      testdata.baseUrl + testdata.echoMethod,
      "",
      10000,
      "PATCH",
    );
    cy.readFile("cypress/fixtures/patchjson.txt").then((json) => {
      apiPage.SelectPaneTab("Body");
      apiPage.SelectSubTab("JSON");
      dataSources.EnterQuery(json);
      agHelper.AssertAutoSave();
      apiPage.RunAPI();
      apiPage.ResponseStatusCheck("200 OK");
      cy.validateRequest(
        "Executed successfully",
        testdata.baseUrl,
        testdata.echoMethod,
        testdata.Patch,
      );
    });
    cy.ResponseCheck("updatedAt");
  });

  it("4. Delete Action test API feature", function () {
    apiPage.CreateAndFillApi(
      testdata.baseUrl + testdata.echoMethod,
      "",
      10000,
      "DELETE",
    );
    cy.readFile("cypress/fixtures/patchjson.txt").then((json) => {
      apiPage.SelectPaneTab("Body");
      apiPage.SelectSubTab("JSON");
      dataSources.EnterQuery(json);
      agHelper.AssertAutoSave();
      apiPage.RunAPI();
      apiPage.ResponseStatusCheck("200 OK");
      cy.validateRequest(
        "Executed successfully",
        testdata.baseUrl,
        testdata.echoMethod,
        testdata.Delete,
      );
    });
  });

  it("5. Test GET Action for mock API with header and pagination", function () {
    //const apiname = "SecondAPI";
    apiPage.CreateAndFillApi(testdata.baseUrl + testdata.methods);
    agHelper.AssertAutoSave();
    apiPage.RunAPI();
    apiPage.ResponseStatusCheck("200 OK");
    cy.ResponseCheck(testdata.responsetext);
    cy.validateRequest(
      "Executed successfully",
      testdata.baseUrl,
      testdata.methods,
      testdata.Get,
    );

    apiPage.SelectPaneTab("Pagination");
    agHelper.GetNClick(apiwidget.paginationWithUrl);
    cy.enterUrl(
      testdata.baseUrl,
      apiwidget.panigationNextUrl,
      testdata.nextUrl,
    );
    cy.clickTest(apiwidget.TestNextUrl);
    apiPage.ResponseStatusCheck("200 OK");
    cy.ResponseCheck("Josh M Krantz");
    cy.validateRequest(
      "Executed successfully",
      testdata.baseUrl,
      testdata.next,
      testdata.Get,
    );

    apiPage.SelectPaneTab("Pagination");
    cy.enterUrl(
      testdata.baseUrl,
      apiwidget.panigationPrevUrl,
      testdata.prevUrl,
    );
    cy.clickTest(apiwidget.TestPreUrl);
    apiPage.ResponseStatusCheck("200 OK");
    cy.ResponseCheck(testdata.responsetext);
    cy.validateRequest(
      "Executed successfully",
      testdata.baseUrl,
      testdata.prev,
      testdata.Get,
    );
  });

  it("6. API check with query params test API feature", function () {
    apiPage.CreateAndFillApi(testdata.baseUrl + testdata.queryAndValue);
    agHelper.AssertAutoSave();
    apiPage.RunAPI();
    apiPage.ResponseStatusCheck("200 OK");
    cy.ResponseCheck(testdata.responsetext3);
    cy.validateRequest(
      "Executed successfully",
      testdata.baseUrl,
      testdata.queryAndValue,
      testdata.Get,
    );
  });

  it("7. API check with Invalid Header", function () {
    apiPage.CreateAndFillApi(testdata.baseUrl + testdata.methods);
    apiPage.EnterHeader(testdata.headerKey, testdata.invalidValue);
    agHelper.AssertAutoSave();
    apiPage.RunAPI(false);
    apiPage.ResponseStatusCheck("5000");
    cy.validateRequest(
      "Execution failed",
      testdata.baseUrl,
      testdata.methods,
      testdata.Get,
      true,
    );
    cy.ResponseCheck("Invalid value for Content-Type");
  });
});
