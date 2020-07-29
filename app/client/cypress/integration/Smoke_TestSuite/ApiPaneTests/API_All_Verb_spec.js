const testdata = require("../../../fixtures/testdata.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");

describe("API Panel Test Functionality", function() {
  afterEach(function() {
    cy.get(".t--apiFormDeleteBtn").click();
    cy.wait("@deleteAction").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("PUT Action test API fetaure", function() {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateAPI("FirstAPI");
    cy.log("Creation of FirstAPI Action successful");
    cy.SelectAction(testdata.putAction);
    cy.EnterSourceDetailsWithbody(
      testdata.baseUrl2,
      testdata.methodput,
      testdata.headerKey,
      testdata.headerValue,
    );
    cy.readFile("cypress/fixtures/putjson.txt").then(json => {
      cy.log(json);
      cy.xpath(apiwidget.postbody)
        .click({ force: true })
        .focus()
        .type(json, { force: true });
      cy.WaitAutoSave();
      cy.RunAPI();
      cy.validateRequest(testdata.baseUrl2, testdata.methodput, testdata.Put);
    });
    cy.ResponseStatusCheck("200 OK");
    cy.log("Response code check successful");
    cy.ResponseCheck("updatedAt");
    cy.log("Response data check successful");
  });

  it("Post Action test API fetaure", function() {
    cy.CreateAPI("FirstAPI");
    cy.log("Creation of FirstAPI Action successful");
    cy.SelectAction(testdata.postAction);
    cy.EnterSourceDetailsWithbody(
      testdata.baseUrl2,
      testdata.methodpost,
      testdata.headerKey,
      testdata.headerValue,
    );
    cy.readFile("cypress/fixtures/postjson.txt").then(json => {
      cy.log(json);
      cy.xpath(apiwidget.postbody)
        .click({ force: true })
        .focus()
        .type(json, { force: true });
      cy.WaitAutoSave();
      cy.RunAPI();
      cy.validateRequest(testdata.baseUrl2, testdata.methodpost, testdata.Post);
    });
    cy.ResponseStatusCheck("201 CREATED");
    cy.log("Response code check successful");
    cy.ResponseCheck("createdAt");
    cy.log("Response data check successful");
  });

  it("PATCH Action test API fetaure", function() {
    cy.CreateAPI("FirstAPI");
    cy.log("Creation of FirstAPI Action successful");
    cy.SelectAction(testdata.patchAction);
    cy.EnterSourceDetailsWithbody(
      testdata.baseUrl2,
      testdata.methodpatch,
      testdata.headerKey,
      testdata.headerValue,
    );
    cy.readFile("cypress/fixtures/patchjson.txt").then(json => {
      cy.log(json);
      cy.xpath(apiwidget.postbody)
        .click({ force: true })
        .focus()
        .type(json, { force: true });
      cy.WaitAutoSave();
      cy.RunAPI();
      cy.validateRequest(
        testdata.baseUrl2,
        testdata.methodpatch,
        testdata.Patch,
      );
    });
    cy.ResponseStatusCheck("200 OK");
    cy.log("Response code check successful");
    cy.ResponseCheck("updatedAt");
    cy.log("Response data check successful");
  });

  it("Delete Action test API fetaure", function() {
    cy.CreateAPI("FirstAPI");
    cy.log("Creation of FirstAPI Action successful");
    cy.SelectAction(testdata.deleteAction);
    cy.EnterSourceDetailsWithbody(
      testdata.baseUrl2,
      testdata.methodpatch,
      testdata.headerKey,
      testdata.headerValue,
    );
    cy.WaitAutoSave();
    cy.RunAPI();
    cy.validateRequest(
      testdata.baseUrl2,
      testdata.methodpatch,
      testdata.Delete,
    );
    cy.ResponseStatusCheck("204 NO_CONTENT");
    cy.log("Response code check successful");
  });

  it("Test GET Action for mock API with header and pagination", function() {
    const apiname = "SecondAPI";
    cy.CreateAPI(apiname);
    cy.log("Creation of API Action successful");
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);
    cy.WaitAutoSave();
    cy.RunAPI();
    cy.validateRequest(testdata.baseUrl, testdata.methods, testdata.Get);
    cy.ResponseStatusCheck(testdata.successStatusCode);
    cy.log("Response code check successful");
    cy.ResponseCheck(testdata.responsetext);
    cy.log("Response data check successful");
    cy.switchToPaginationTab();
    cy.selectPaginationType(apiwidget.paginationWithUrl);
    cy.enterUrl(apiname, apiwidget.panigationNextUrl, testdata.nextUrl);
    cy.clickTest(apiwidget.TestNextUrl);
    cy.validateRequest(
      testdata.baseUrl,
      testdata.methods.concat(testdata.next),
      testdata.Get,
    );
    cy.ResponseStatusCheck(testdata.successStatusCode);
    cy.log("Response code check successful");
    cy.ResponseCheck("Josh M Krantz");
    cy.log("Response data check successful");
    cy.enterUrl(apiname, apiwidget.panigationPrevUrl, testdata.prevUrl);
    cy.clickTest(apiwidget.TestPreUrl);
    cy.validateRequest(
      testdata.baseUrl,
      testdata.methods.concat(testdata.prev),
      testdata.Get,
    );
    cy.ResponseStatusCheck(testdata.successStatusCode);
    cy.log("Response code check successful");
    cy.ResponseCheck(testdata.responsetext);
    cy.log("Response data check successful");
  });

  it("API check with query params test API fetaure", function() {
    cy.CreateAPI("ThirdAPI");
    cy.log("Creation of API Action successful");
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.queryAndValue);
    cy.WaitAutoSave();
    cy.RunAPI();
    cy.validateRequest(testdata.baseUrl, testdata.queryAndValue, testdata.Get);
    cy.ResponseStatusCheck("200 OK");
    cy.log("Response code check successful");
    cy.ResponseCheck(testdata.responsetext3);
    cy.log("Response data check successful");
  });

  it("API check with Invalid Header", function() {
    cy.CreateAPI("FourthAPI");
    cy.log("Creation of API Action successful");
    cy.EnterSourceDetailsWithQueryParam(
      testdata.baseUrl,
      testdata.methods,
      testdata.headerKey,
      testdata.invalidValue,
      testdata.queryKey,
      testdata.queryValue,
    );
    cy.WaitAutoSave();
    cy.RunAPI();
    cy.validateRequest(testdata.baseUrl, testdata.methods, testdata.Get);
    cy.ResponseStatusCheck("5000");
    cy.log("Response code check successful");
    cy.ResponseCheck("Invalid value for Content-Type");
    cy.log("Response data check successful");
  });
});
