import reconnectDatasourceModal from "../../../../../locators/ReconnectLocators";
import {
  agHelper,
  dataSources,
  entityExplorer,
  gitSync,
  homePage,
  locators,
  table,
} from "../../../../../support/Objects/ObjectsCore";

describe("Import and validate older app (app created in older versions of Appsmith) from Gitea", function () {
  let repoName = "TestMigration",
    workspaceName: any;
  before(() => {
    homePage.NavigateToHome();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      workspaceName = "GitImport_" + uid;
      homePage.CreateNewWorkspace(workspaceName);
    });
  });

  it("1. Import app from Gitea , reconnect datasources & validate merge status", () => {
    gitSync.ImportAppFromGit(workspaceName, repoName, true);
    agHelper.AssertElementVisible(reconnectDatasourceModal.Modal);

    dataSources.ReconnectDataSourceForOldApp("mongo-TED", "MongoDB");
    dataSources.ReconnectDataSourceForOldApp("mysql-TED", "MySQL");
    dataSources.ReconnectDataSourceForOldApp("postgres-TED", "PostgreSQL");
    agHelper.AssertElementVisible(reconnectDatasourceModal.ImportSuccessModal);
    agHelper.ContainsNClick("Got it");
    agHelper.AssertContains("ListingAndReviews", "be.visible");

    agHelper.AssertElementVisible(gitSync._bottomBarCommit);
    agHelper.AssertText(gitSync._gitPullCount, "text", "4");
    agHelper.GetNClick(gitSync._bottomBarCommit);
    agHelper.AssertElementVisible(gitSync._gitSyncModal);
    agHelper.GetNAssertElementText(
      gitSync._gitStatusChanges,
      "4 pages modified",
      "contain.text",
    );
    agHelper.GetNAssertElementText(
      gitSync._gitStatusChanges,
      "Some of the changes above are due to an improved file structure designed to reduce merge conflicts. You can safely commit them to your repository.",
      "contain.text",
    );
    gitSync.CloseGitSyncModal();
    agHelper.AssertContains("ListingAndReviews", "be.visible");
    agHelper.AssertContains("CountryFlags", "be.visible");
    agHelper.AssertContains("Public.astronauts", "be.visible");
    agHelper.AssertContains("Widgets", "be.visible");

    agHelper.AssertText(
      locators._widgetInCanvas("textwidget"),
      "text",
      "listingAndReviews Data",
    );
    agHelper.AssertElementVisible(locators._widgetByName("data_table"));
    table.OpenNFilterTable("_id", "is exactly", "15665837");
    table.ReadTableRowColumnData(0, 0).then(($cellData) => {
      expect($cellData).to.eq(
        '["TV","Internet","Wifi","Air conditioning","Wheelchair accessible","Pool","Kitchen","Free parking on premises","Smoking allowed","Pets allowed","Gym","Elevator","Hot tub","Heating","Family/kid friendly","Washer","Dryer","Smoke detector","Fire extinguisher","Essentials"]',
      );
    });

    agHelper.GetNClick(entityExplorer._pageNameDiv("CountryFlags"));
    agHelper.AssertText(
      locators._widgetInCanvas("textwidget"),
      "text",
      "countryFlags Data",
    );
    agHelper.AssertElementVisible(locators._widgetByName("data_table"));
    table.OpenNFilterTable("Country", "starts with", "Ba");
    table.ReadTableRowColumnData(2, 0).then(($cellData) => {
      expect($cellData).to.eq("Bangladesh");
    });
    table.CloseFilter();
    agHelper.ClearTextField(locators._jsonFormInputField("File_Name"));
    agHelper.TypeText(locators._jsonFormInputField("File_Name"), "test.svg");
    agHelper.ClearTextField(locators._jsonFormInputField("Flag"));
    agHelper.TypeText(
      locators._jsonFormInputField("Flag"),
      "https://test.com/",
    );
    agHelper.ClickButton("Update");
    // table.ReadTableRowColumnData(0, 1).then(($cellData) => {
    //   expect($cellData).to.eq("test.svg");
    // });
    // table.ReadTableRowColumnData(0, 2).then(($cellData) => {
    //   expect($cellData).to.eq("https://test.com/");
    // });

    agHelper.GetNClick(entityExplorer._pageNameDiv("Public.astronauts"));
    agHelper.AssertText(
      locators._widgetInCanvas("textwidget"),
      "text",
      "public_astronauts Data",
    );
    agHelper.AssertElementVisible(locators._widgetByName("data_table"));
    table.OpenNFilterTable("id", "is exactly", "196");
    table.ReadTableRowColumnData(0, 2).then(($cellData) => {
      expect($cellData).to.eq("Ulf Merbold");
    });
    table.CloseFilter();
    table.ValidateDownloadNVerify("data_table.csv", "Ulf Merbold");
  });

  after(() => {
    gitSync.DeleteDeployKey(repoName);
    homePage.NavigateToHome();
    homePage.DeleteApplication("TestMigration");
    homePage.DeleteWorkspace(workspaceName);
  });
});
