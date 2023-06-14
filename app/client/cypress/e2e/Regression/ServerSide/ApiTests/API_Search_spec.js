const testdata = require("../../../../fixtures/testdata.json");
import ApiEditor from "../../../../locators/ApiEditor";
import * as _ from "../../../../support/Objects/ObjectsCore";

let APIName;
const testUrl1 =
  "http://host.docker.internal:5001/v1/dynamicrecords/generaterecords?records=10";
const testUrl2 =
  "http://host.docker.internal:5001/v1/dynamicrecords/getstudents";
const testUrl3 =
  "http://host.docker.internal:5001//v1/dynamicrecords/getrecordsArray";

describe("API Panel Test Functionality ", function () {
  it("1. Test Search API fetaure", function () {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.generateUUID().then((uid) => {
      cy.CreateAPI(`FirstAPI_${uid}`);
      cy.log("Creation of FirstAPI Action successful");
      cy.NavigateToAPI_Panel();
      cy.CreateAPI(`SecondAPI_${uid}`);
      cy.CheckAndUnfoldEntityItem("Queries/JS");
      cy.log("Creation of SecondAPI Action successful");
      cy.get(".t--entity-name").contains("FirstAPI");
      cy.get(".t--entity-name").contains("SecondAPI");
      _.entityExplorer.ActionContextMenuByEntityName(
        `FirstAPI_${uid}`,
        "Delete",
        "Are you sure?",
      );
      _.entityExplorer.ActionContextMenuByEntityName(
        `SecondAPI_${uid}`,
        "Delete",
        "Are you sure?",
      );
    });
  });

  it("2. if suggested widgets section alwas appears for all 3 modes", function () {
    cy.log("Login Successful");
    _.apiPage.CreateAndFillApi(testUrl1);
    cy.RunAPI();
    _.apiPage.CreateAndFillApi(testUrl2);
    cy.RunAPI();
    cy.get(ApiEditor.jsonResponseTab).click();
    cy.checkIfApiPaneIsVisible();
    cy.get(ApiEditor.rawResponseTab).click();
    cy.checkIfApiPaneIsVisible();
    cy.get(ApiEditor.tableResponseTab).click();
    cy.checkIfApiPaneIsVisible();
  });
  it("3. Bug 14242: Appsmith crash when create an API pointing to Github hosted json", function () {
    cy.NavigateToAPI_Panel();
    cy.generateUUID().then((uid) => {
      APIName = uid;
      cy.CreateAPI(APIName);
    });
    cy.enterDatasource(testUrl3);
    cy.SaveAndRunAPI();
    cy.ResponseStatusCheck("200");
  });
});
