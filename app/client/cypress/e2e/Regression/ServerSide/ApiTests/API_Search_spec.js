import ApiEditor from "../../../../locators/ApiEditor";
import {
  entityExplorer,
  apiPage,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";
import {
  AppSidebar,
  AppSidebarButton,
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";

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
    cy.generateUUID().then((uid) => {
      AppSidebar.navigate(AppSidebarButton.Editor);
      cy.CreateAPI(`FirstAPI_${uid}`);
      cy.log("Creation of FirstAPI Action successful");
      AppSidebar.navigate(AppSidebarButton.Editor);
      cy.CreateAPI(`SecondAPI_${uid}`);
      cy.CheckAndUnfoldEntityItem("Queries/JS");
      cy.log("Creation of SecondAPI Action successful");
      PageLeftPane.assertPresence(`FirstAPI_${uid}`);
      PageLeftPane.assertPresence(`SecondAPI_${uid}`);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: `FirstAPI_${uid}`,
        action: "Delete",
        entityType: entityItems.Api,
      });
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: `SecondAPI_${uid}`,
        action: "Delete",
        entityType: entityItems.Api,
      });
    });
  });

  it("2. if suggested widgets section alwas appears for all 3 modes", function () {
    cy.log("Login Successful");
    apiPage.CreateAndFillApi(testUrl1);
    cy.RunAPI();
    apiPage.CreateAndFillApi(testUrl2);
    cy.RunAPI();
    cy.get(ApiEditor.jsonResponseTab).click();
    cy.checkIfApiPaneIsVisible();
    cy.get(ApiEditor.rawResponseTab).click();
    cy.checkIfApiPaneIsVisible();
    cy.get(ApiEditor.tableResponseTab).click();
    cy.checkIfApiPaneIsVisible();
  });
  it("3. Bug 14242: Appsmith crash when create an API pointing to Github hosted json", function () {
    cy.generateUUID().then((uid) => {
      APIName = uid;
      cy.CreateAPI(APIName);
    });
    cy.enterDatasource(testUrl3);
    cy.SaveAndRunAPI();
    cy.ResponseStatusCheck("200");
  });
});
