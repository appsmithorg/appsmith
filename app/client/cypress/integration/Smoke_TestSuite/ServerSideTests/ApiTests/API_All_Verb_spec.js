const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper,
  apiPage = ObjectsRegistry.ApiPage,
  dataSources = ObjectsRegistry.DataSources;

describe("API Panel Test Functionality", function() {
  afterEach(function() {
    agHelper.ActionContextMenuWithInPane("Delete");
  });

  it("1. PUT Action test API fetaure", function() {
    apiPage.CreateAndFillApi(
      testdata.baseUrl + testdata.methodput,
      "",
      10000,
      "PUT",
    );
    apiPage.EnterHeader(testdata.headerKey, testdata.headerValue);
    cy.readFile("cypress/fixtures/putjson.txt").then((json) => {
      apiPage.SelectPaneTab("Body");
      dataSources.EnterQuery(json);
      agHelper.AssertAutoSave();
      apiPage.RunAPI();
      cy.validateRequest(
        "Api1",
        testdata.baseUrl,
        testdata.methodput,
        testdata.Put,
      );
    });
    cy.ResponseStatusCheck("200 OK");
    cy.ResponseCheck("updatedAt");
  });

  it("2. Post Action test API fetaure", function() {
    apiPage.CreateAndFillApi(
      testdata.baseUrl + testdata.methodpost,
      "",
      10000,
      "POST",
    );
    apiPage.EnterHeader(testdata.headerKey, testdata.headerValue);
    cy.readFile("cypress/fixtures/postjson.txt").then((json) => {
      apiPage.SelectPaneTab("Body");
      dataSources.EnterQuery(json);
      agHelper.AssertAutoSave();
      apiPage.RunAPI();
      cy.validateRequest(
        "Api1",
        testdata.baseUrl,
        testdata.methodpost,
        testdata.Post,
      );
    });
    cy.ResponseStatusCheck("201 CREATED");
    cy.ResponseCheck("createdAt");
  });

  it("3. PATCH Action test API fetaure", function() {
    apiPage.CreateAndFillApi(
      testdata.baseUrl + testdata.methodpatch,
      "",
      10000,
      "PATCH",
    );
    apiPage.EnterHeader(testdata.headerKey, testdata.headerValue);
    cy.readFile("cypress/fixtures/patchjson.txt").then((json) => {
      apiPage.SelectPaneTab("Body");
      dataSources.EnterQuery(json);
      agHelper.AssertAutoSave();
      apiPage.RunAPI();
      cy.validateRequest(
        "Api1",
        testdata.baseUrl,
        testdata.methodpatch,
        testdata.Patch,
      );
    });
    cy.ResponseStatusCheck("200 OK");
    cy.ResponseCheck("updatedAt");
  });

  it("4. Delete Action test API fetaure", function() {
    apiPage.CreateAndFillApi(
      testdata.baseUrl + testdata.methoddelete,
      "",
      10000,
      "DELETE",
    );
    apiPage.EnterHeader(testdata.headerKey, testdata.headerValue);
    agHelper.AssertAutoSave();
    apiPage.RunAPI();
    cy.validateRequest(
      "Api1",
      testdata.baseUrl,
      testdata.methoddelete,
      testdata.Delete,
    );
    cy.ResponseStatusCheck("200");
  });

  it("5. Test GET Action for mock API with header and pagination", function() {
    //const apiname = "SecondAPI";
    apiPage.CreateAndFillApi(testdata.baseUrl + testdata.methods);
    apiPage.EnterHeader(testdata.headerKey, testdata.headerValue);
    agHelper.AssertAutoSave();
    apiPage.RunAPI();
    cy.validateRequest(
      "Api1",
      testdata.baseUrl,
      testdata.methods,
      testdata.Get,
    );
    cy.ResponseStatusCheck(testdata.successStatusCode);
    cy.ResponseCheck(testdata.responsetext);
    cy.switchToPaginationTab();
    cy.selectPaginationType(apiwidget.paginationWithUrl);
    cy.enterUrl("Api1", apiwidget.panigationNextUrl, testdata.nextUrl);
    cy.clickTest(apiwidget.TestNextUrl);
    cy.validateRequest(
      "Api1",
      testdata.baseUrl,
      testdata.methods.concat(testdata.next),
      testdata.Get,
    );
    cy.ResponseStatusCheck(testdata.successStatusCode);
    cy.ResponseCheck("Josh M Krantz");
    cy.switchToPaginationTab();
    cy.enterUrl("Api1", apiwidget.panigationPrevUrl, testdata.prevUrl);
    cy.clickTest(apiwidget.TestPreUrl);
    cy.validateRequest(
      "Api1",
      testdata.baseUrl,
      testdata.methods.concat(testdata.prev),
      testdata.Get,
    );
    cy.ResponseStatusCheck(testdata.successStatusCode);
    cy.ResponseCheck(testdata.responsetext);
  });

  it("6. API check with query params test API fetaure", function() {
    apiPage.CreateAndFillApi(testdata.baseUrl + testdata.queryAndValue);
    apiPage.EnterHeader(testdata.headerKey, testdata.headerValue);
    agHelper.AssertAutoSave();
    apiPage.RunAPI();
    cy.validateRequest(
      "Api1",
      testdata.baseUrl,
      testdata.queryAndValue,
      testdata.Get,
    );
    cy.ResponseStatusCheck("200 OK");
    cy.ResponseCheck(testdata.responsetext3);
  });

  it("7. API check with Invalid Header", function() {
    apiPage.CreateAndFillApi(testdata.baseUrl + testdata.methods);
    apiPage.EnterHeader(testdata.headerKey, testdata.invalidValue);
    agHelper.AssertAutoSave();
    apiPage.RunAPI(false);
    cy.validateRequest(
      "Api1",
      testdata.baseUrl,
      testdata.methods,
      testdata.Get,
      true,
    );
    cy.ResponseStatusCheck("5000");
    cy.ResponseCheck("Invalid value for Content-Type");
  });
});
