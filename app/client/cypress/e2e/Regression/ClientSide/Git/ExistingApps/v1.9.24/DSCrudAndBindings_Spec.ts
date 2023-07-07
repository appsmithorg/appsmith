import {
  agHelper,
  dataSources,
  draggableWidgets,
  entityExplorer,
  gitSync,
  homePage,
  jsEditor,
  locators,
  propPane,
  table,
} from "../../../../../../support/Objects/ObjectsCore";

describe("Import and validate older app (app created in older versions of Appsmith) from Gitea", function () {
  let appRepoName = "TestMigration",
    appName = "UpgradeAppToLatestVersion",
    keyId: any,
    workspaceName: any;
  before(() => {
    homePage.NavigateToHome();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      workspaceName = "GitImport_" + uid;
      homePage.CreateNewWorkspace(workspaceName);
    });
    //Import App From Gitea
    gitSync.ImportAppFromGit(workspaceName, appRepoName, true);
    cy.get("@deployKeyId").then((id) => {
      keyId = id;
    });

    //Reconnect datasources
    dataSources.ReconnectDSbyName("MongoDB");
    dataSources.ReconnectDSbyName("MySQL");
    dataSources.ReconnectDSbyName("PostgreSQL");
    homePage.AssertNCloseImport();
  });

  it("1. Validate merge status", () => {
    entityExplorer.AssertEntityPresenceInExplorer("ListingAndReviews");
    homePage.RenameApplication(appName);

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
  });

  it("2. Validate CRUD pages - Mongo , MySql, Postgres pages", () => {
    entityExplorer.AssertEntityPresenceInExplorer("ListingAndReviews");
    entityExplorer.AssertEntityPresenceInExplorer("CountryFlags");
    entityExplorer.AssertEntityPresenceInExplorer("Public.astronauts");

    //Mongo CRUD page validation
    //Assert table data
    agHelper.AssertText(
      locators._widgetInCanvas(draggableWidgets.TEXT),
      "text",
      "listingAndReviews Data",
    );
    agHelper.AssertElementVisible(locators._widgetByName("data_table"));

    //Filter & validate table data
    table.OpenNFilterTable("_id", "is exactly", "15665837");
    table.ReadTableRowColumnData(0, 0).then(($cellData) => {
      expect($cellData).to.eq(
        '["TV","Internet","Wifi","Air conditioning","Wheelchair accessible","Pool","Kitchen","Free parking on premises","Smoking allowed","Pets allowed","Gym","Elevator","Hot tub","Heating","Family/kid friendly","Washer","Dryer","Smoke detector","Fire extinguisher","Essentials"]',
      );
    });

    //MySql CRUD page validation
    entityExplorer.SelectEntityByName("CountryFlags", "Pages");
    //Assert table data
    agHelper.AssertText(
      locators._widgetInCanvas(draggableWidgets.TEXT),
      "text",
      "countryFlags Data",
    );
    agHelper.AssertElementVisible(locators._widgetByName("data_table"));

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
    entityExplorer.SelectEntityByName("Public.astronauts", "Pages");
    agHelper.AssertText(
      locators._widgetInCanvas(draggableWidgets.TEXT),
      "text",
      "public_astronauts Data",
    );
    agHelper.AssertElementVisible(locators._widgetByName("data_table"));

    //Filter & validate table data
    table.OpenNFilterTable("id", "is exactly", "196");
    table.ReadTableRowColumnData(0, 2).then(($cellData) => {
      expect($cellData).to.eq("Ulf Merbold");
    });
    table.RemoveFilter();

    //Update table data
    agHelper.ClearTextField(locators._jsonFormInputField("statusid"));
    agHelper.TypeText(locators._jsonFormInputField("statusid"), "5");
    agHelper.ClearTextField(locators._jsonFormInputField("statusname"));
    agHelper.TypeText(locators._jsonFormInputField("statusname"), "Active");
    agHelper.Sleep(500);
    agHelper.ClickButton("Update");

    //Validate updated values in table
    table.ReadTableRowColumnData(0, 3).then(($cellData) => {
      expect($cellData).to.eq("5");
    });
    table.ReadTableRowColumnData(0, 4).then(($cellData) => {
      expect($cellData).to.eq("Active");
    });
    agHelper.Sleep(500);
  });

  it("3. Validate widgets & bindings", () => {
    agHelper.VisitNAssert(
      "http://localhost/app/upgradeapptolatestversion/listingandreviews-64a83886606eac23c36b7a81/edit?branch=master",
    );
    agHelper.GetNClick(entityExplorer._pageNameDiv("Widgets"));
    agHelper.AssertElementVisible(
      locators._widgetInCanvas(draggableWidgets.AUDIO),
    );
    agHelper.AssertElementVisible(
      locators._widgetInCanvas(draggableWidgets.AUDIORECORDER),
    );
    agHelper.AssertElementVisible(
      locators._widgetInCanvas(draggableWidgets.DOCUMENT_VIEWER),
    );
    agHelper.AssertElementVisible(
      locators._widgetInCanvas(draggableWidgets.CHART),
    );

    //Button
    agHelper.ClickButton("Alert button");
    agHelper.Sleep(500);
    agHelper.WaitUntilToastDisappear("404 hit : invalidApi failed to execute");

    //Checkbox group
    agHelper.AssertElementVisible(
      locators._widgetInCanvas(draggableWidgets.CHECKBOXGROUP),
    );
    agHelper.GetNAssertElementText(
      locators._widgetInCanvas(draggableWidgets.CHECKBOXGROUP),
      "Select AstronautUlf MerboldAndreas MogensenWubbo OckelsThomas ReiterAnil Menon",
      "have.text",
    );
    agHelper
      .GetElement(locators._checkboxGroupOptions("Ulf Merbold"))
      .should("be.checked");
    agHelper.CheckUncheck(locators._checkboxGroupOptions("Anil Menon"));

    //Slider
    agHelper
      .ScrollIntoView(locators._sliderThumb)
      .focus()
      .type("{rightArrow}")
      .wait(500);

    agHelper.Sleep(500);
    agHelper.WaitUntilToastDisappear("Category Value Changed!");

    //Currency input
    agHelper.TypeText(
      locators._widgetInCanvas(draggableWidgets.CURRENCY_INPUT) + " input",
      "10",
    );
    agHelper.WaitUntilToastDisappear(
      '{"countryCode":"IN","currencyCode":"INR","value":10}',
    );

    //Table
    agHelper.TypeText(
      locators._widgetInCanvas("inputwidgetv2") + " input",
      "144",
    );
    table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
      expect($cellData).to.eq("Christina ");
    });

    //Add customer details - Validate Modal & JSON Form
    agHelper.ClickButton("Add customer Details");
    agHelper.AssertElementVisible(locators._modal);

    agHelper.UpdateInput(locators._jsonFormField("customer_name"), "TestUser");
    agHelper.UpdateInput(locators._jsonFormField("customer_number"), "1");
    agHelper.UpdateInput(locators._jsonFormField("phone_number"), "999999999");
    agHelper.ClickButton("Submit", 1);
    agHelper.WaitUntilToastDisappear("Add Customer Successful!");
    agHelper.ClickButton("Submit", 1);
    agHelper.WaitUntilToastDisappear("AddCustomer failed to execute");
    agHelper.ClickButton("Close");

    //Delete customer details
    agHelper.ClickButton("Delete customer details");
    agHelper.AssertElementVisible(locators._modal);
    agHelper.ClickButton("Confirm");
    agHelper.WaitUntilToastDisappear("Delete customer successful!");
    agHelper.ClickButton("Close");

    //Edit existing JS object
    entityExplorer.SelectEntityByName("users", "Queries/JS");
    jsEditor.EditJSObj(`export default {
      fun: async () => {
        return await invalidApi.run().catch((e) => showAlert("404 hit : " + e.message));
      },
      myFun1: async () => {
        //write code here
        const data = await usersApi.run()
        return "myFun1 Data"
      },
      myFun2: async () => {
        //use async-await or promises
        await this.myFun1()
        showAlert("myFun2 Data")
      }
    }`);

    //Update property field & validate new response
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.EnterJSContext("onClick", `{{users.myFun2()}}`, true, false);
    agHelper.ClickButton("Submit");
    agHelper.ValidateToastMessage("myFun2 Data");
    agHelper.WaitUntilAllToastsDisappear();
  });

  after(() => {
    gitSync.DeleteDeployKey(appRepoName, keyId);
    homePage.NavigateToHome();
    homePage.DeleteApplication(appName);
    homePage.DeleteWorkspace(workspaceName);
  });
});
