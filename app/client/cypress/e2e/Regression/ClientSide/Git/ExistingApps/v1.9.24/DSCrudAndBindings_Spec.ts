import {
  agHelper,
  assertHelper,
  dataSources,
  deployMode,
  draggableWidgets,
  gitSync,
  homePage,
  locators,
  table,
} from "../../../../../../support/Objects/ObjectsCore";
import PageList from "../../../../../../support/Pages/PageList";

describe(
  "Import and validate older app (app created in older versions of Appsmith) from Gitea",
  { tags: ["@tag.Git", "@tag.Sanity", "@tag.TedMigration"] },
  function () {
    let appRepoName = "TED-migration-test-1",
      appName = "UpgradeAppToLatestVersion",
      keyId: any,
      workspaceName: any;
    before(() => {
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        workspaceName = "GitImport_" + uid;
        homePage.CreateNewWorkspace(workspaceName, true);
        //Import App From Gitea
        gitSync.ImportAppFromGit(workspaceName, appRepoName, true);
        cy.get("@deployKeyId").then((id) => {
          keyId = id;
        });
      });

      //Reconnect datasources
      dataSources.ReconnectDSbyType("MongoDB");
      dataSources.ReconnectDSbyType("MySQL");
      dataSources.ReconnectDSbyType("PostgreSQL");
      homePage.AssertNCloseImport();
      homePage.RenameApplication(appName);
      PageList.assertPresence("ListingAndReviews");

      // this logic will have to be removed after decimal issue with auto-commit is resolved
      assertHelper.AssertNetworkResponseData("gitStatus");
      agHelper.AssertElementExist(gitSync._bottomBarCommit, 0, 30000);
      agHelper.GetNClick(gitSync._bottomBarCommit);
      agHelper.AssertElementVisibility(gitSync._gitSyncModal);
      agHelper.GetNClick(gitSync._commitButton);
      assertHelper.AssertNetworkStatus("@commit", 201);
      gitSync.CloseGitSyncModal();
    });

    it("Deploy the app & Validate CRUD pages - Mongo , MySql, Postgres pages", () => {
      //Mongo CRUD page validation
      //Assert table data
      cy.latestDeployPreview();
      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.TEXT),
        "text",
        "listingAndReviews Data",
      );
      agHelper.AssertElementVisibility(locators._widgetByName("data_table"));
      table.WaitUntilTableLoad(0, 0);

      //Filter & validate table data
      table.OpenNFilterTable("_id", "is exactly", "15665837");
      table.ReadTableRowColumnData(0, 0).then(($cellData) => {
        expect($cellData).to.eq(
          '["TV","Internet","Wifi","Air conditioning","Wheelchair accessible","Pool","Kitchen","Free parking on premises","Smoking allowed","Pets allowed","Gym","Elevator","Hot tub","Heating","Family/kid friendly","Washer","Dryer","Smoke detector","Fire extinguisher","Essentials"]',
        );
      });

      //MySql CRUD page validation
      agHelper.GetNClickByContains(locators._deployedPage, "CountryFlags");
      //Assert table data
      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.TEXT),
        "text",
        "countryFlags Data",
      );
      agHelper.AssertElementVisibility(locators._widgetByName("data_table"));
      table.WaitUntilTableLoad(0, 0);

      //Filter & validate table data
      table.OpenNFilterTable("Country", "starts with", "Ba");
      table.ReadTableRowColumnData(2, 0).then(($cellData) => {
        expect($cellData).to.eq("Bangladesh");
      });
      table.CloseFilter();

      //Download table data
      table.DownloadFromTable("Download as CSV");
      table.ValidateDownloadNVerify("data_table.csv", "Bangladesh");

      //Postgres CRUD page validation
      agHelper.GetNClickByContains(locators._deployedPage, "Public.astronauts");
      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.TEXT),
        "text",
        "public_astronauts Data",
      );
      agHelper.AssertElementVisibility(locators._widgetByName("data_table"));
      table.WaitUntilTableLoad(0, 0);

      //Filter & validate table data
      table.OpenNFilterTable("id", "is exactly", "196");
      table.ReadTableRowColumnData(0, 2).then(($cellData) => {
        expect($cellData).to.eq("Ulf Merbold");
      });
      table.RemoveFilter();

      //Update table data
      deployMode.EnterJSONInputValue("Statusid", "5", 0, true);
      deployMode.EnterJSONInputValue("Statusname", "Active", 0, true);
      agHelper.ClickButton("Update");
      table.WaitUntilTableLoad(0, 0);

      //Validate updated values in table
      table.ReadTableRowColumnData(0, 3).then(($cellData) => {
        expect($cellData).to.eq("5");
      });
      table.ReadTableRowColumnData(0, 4).then(($cellData) => {
        expect($cellData).to.eq("Active");
      });
    });

    it("Validate widgets & bindings", () => {
      agHelper.GetNClickByContains(locators._deployedPage, "Widgets");
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.AUDIO),
      );
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.AUDIORECORDER),
      );
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.DOCUMENT_VIEWER),
      );
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.CHART),
      );

      //Checkbox group
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.CHECKBOXGROUP),
      );
      agHelper.GetNAssertElementText(
        locators._widgetInDeployed(draggableWidgets.CHECKBOXGROUP),
        "Select AstronautUlf MerboldAndreas MogensenWubbo OckelsThomas ReiterAnil Menon",
        "have.text",
      );
      agHelper
        .GetElement(locators._checkboxTypeByOption("Ulf Merbold"))
        .should("be.checked");
      agHelper.CheckUncheck(locators._checkboxTypeByOption("Anil Menon"));

      //Slider
      agHelper
        .ScrollIntoView(locators._sliderThumb)
        .focus()
        .type("{rightArrow}");

      agHelper.WaitUntilToastDisappear("Category Value Changed!");

      //Currency input
      agHelper.TypeText(
        locators._widgetInDeployed(draggableWidgets.CURRENCY_INPUT) + " input",
        "10",
      );
      agHelper.WaitUntilToastDisappear(
        '{"countryCode":"IN","currencyCode":"INR","value":10}',
      );

      //Table
      agHelper.TypeText(
        locators._widgetInDeployed("inputwidgetv2") + " input",
        "144",
      );
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.eq("Christina ");
      });

      //Add customer details - Validate Modal & JSON Form
      agHelper.ClickButton("Add customer Details");
      agHelper.AssertElementVisibility(locators._modal);

      deployMode.EnterJSONInputValue("Customer Name", "TestUser", 0, true);
      deployMode.EnterJSONInputValue("Customer Number", "1", 0, true);
      deployMode.EnterJSONInputValue("Phone Number", "999999999", 0, true);
      agHelper.ClickButton("Submit", 1);
      agHelper.WaitUntilToastDisappear("Add Customer Successful!");
      agHelper.ClickButton("Close");

      //Delete customer details
      agHelper.ClickButton("Delete customer details");
      agHelper.AssertElementVisibility(locators._modal);
      agHelper.ClickButton("Confirm");
      agHelper.WaitUntilToastDisappear("Delete customer successful!");
      agHelper.ClickButton("Close");
      agHelper.AssertElementAbsence(locators._modal);
    });

    after(() => {
      gitSync.DeleteDeployKey(appRepoName, keyId);
      agHelper.WaitUntilAllToastsDisappear();
      deployMode.NavigateToHomeDirectly();
      homePage.DeleteApplication(appName);
      homePage.DeleteWorkspace(workspaceName);
    });
  },
);
