import {
  agHelper,
  assertHelper,
  dataSources,
  deployMode,
  draggableWidgets,
  entityExplorer,
  gitSync,
  homePage,
  jsEditor,
  locators,
  propPane,
  table,
} from "../../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../../../support/Pages/EditorNavigation";

describe(
  "Import and validate older app (app created in older versions of Appsmith) from Gitea",
  { tags: ["@tag.Git", "@tag.Sanity"] },
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
      agHelper.Sleep(3000); //for CI to reconnect successfully
      homePage.AssertNCloseImport();
    });

    it("1. Validate merge status + Bug23822", () => {
      PageLeftPane.assertPresence("ListingAndReviews");
      //Wait for the app to settle
      agHelper.Sleep(3000);
      homePage.RenameApplication(appName);
      assertHelper.AssertNetworkResponseData("gitStatus");
      agHelper.AssertElementExist(gitSync._bottomBarCommit, 0, 30000);
      agHelper.AssertText(gitSync._gitPullCount, "text", "4");
      agHelper.GetNClick(gitSync._bottomBarCommit);
      agHelper.AssertElementVisibility(gitSync._gitSyncModal);

      //This is expected due to Canvas Splitting PR changes in v1.9.24
      agHelper.GetNAssertContains(
        gitSync._gitStatusChanges,
        /[0-9] page(|s) modified/,
      );

      // Commenting it as part of #28012 - to be added back later
      // agHelper.GetNAssertElementText(
      //   gitSync._gitStatusChanges,
      //   "Application settings modified",
      //   "not.contain.text",
      // );
      agHelper.GetNAssertElementText(
        gitSync._gitStatusChanges,
        "Theme modified",
        "not.contain.text",
      );
      agHelper.AssertContains(/[0-9] quer(y|ies) modified/, "not.exist");

      // Commented out due to #25739 - to be fixed by dev later
      // agHelper.GetNAssertElementText(
      //   gitSync._gitStatusChanges,
      //   "datasource modified",
      //   "not.contain.text",
      // );

      agHelper.AssertContains(/[0-9] JS Object(|s) modified/, "not.exist");

      // Commenting it as part of #28012 - to be added back later
      // agHelper.AssertContains(/[0-9] librar(y|ies) modified/, "not.exist");

      // This assertions is commented out due to issue #https://github.com/appsmithorg/appsmith/issues/28563
      // Since we don't want this specific message appearing when we are just migrating the metadata,
      // this assertion is not required.
      // Slack conversation: https://theappsmith.slack.com/archives/C04HERDNZPA/p1698851532418569

      // agHelper.GetNAssertElementText(
      //   gitSync._gitStatusChanges,
      //   "Some of the changes above are due to an improved file structure designed to reduce merge conflicts. You can safely commit them to your repository.",
      //   "contain.text",
      // );
      agHelper.GetNClick(gitSync._commitButton);
      assertHelper.AssertNetworkStatus("@commit", 201);
      gitSync.CloseGitSyncModal();
    });

    it("2. Deploy the app & Validate CRUD pages - Mongo , MySql, Postgres pages", () => {
      //Mongo CRUD page validation
      //Assert table data
      cy.latestDeployPreview();
      agHelper.AssertText(
        locators._widgetInDeployed(draggableWidgets.TEXT),
        "text",
        "listingAndReviews Data",
      );
      agHelper.AssertElementVisibility(locators._widgetByName("data_table"));
      table.WaitUntilTableLoad(0, 0, "v2");

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
      table.WaitUntilTableLoad(0, 0, "v2");

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
      table.WaitUntilTableLoad(0, 0, "v2");

      //Filter & validate table data
      table.OpenNFilterTable("id", "is exactly", "196");
      table.ReadTableRowColumnData(0, 2).then(($cellData) => {
        expect($cellData).to.eq("Ulf Merbold");
      });
      table.RemoveFilter();

      //Update table data
      deployMode.EnterJSONInputValue("Statusid", "5", 0, true);
      deployMode.EnterJSONInputValue("Statusname", "Active", 0, true);
      agHelper.Sleep(500);
      agHelper.ClickButton("Update");
      agHelper.Sleep(2000); //for CI update to be successful
      table.WaitUntilTableLoad(0, 0, "v1");

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

      //Button
      agHelper.ClickButton("Alert button");
      agHelper.Sleep(500);
      agHelper.WaitUntilToastDisappear(
        "404 hit : invalidApi failed to execute",
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
        .type("{rightArrow}")
        .wait(500);

      agHelper.Sleep(500);
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
      agHelper.Sleep(2000);
    });

    it.skip("4. Edit JSObject & Check Updated Data ", () => {
      deployMode.NavigateBacktoEditor();
      //Edit existing JS object
      EditorNavigation.SelectEntityByName("users", EntityType.JSObject);
      jsEditor.EditJSObj(`export default {
      fun: async () => {
        return await invalidApi.run().catch((e) => showAlert("404 hit : " + e.message));
      },
      myFun1: async () => {
        //write code here
        const data = JSON.stringify(await usersApi.run())
        return data
      },
      myFun2: async () => {
        //use async-await or promises
        await this.myFun1()
        return showAlert("myFun2 Data")
      }
    }`);

      //Update property field for button
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext("onClick", `{{users.myFun2()}}`, true, false);

      //Drag n drop text widget & bind it to myFun1
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT);
      propPane.TypeTextIntoField("Text", `{{users.myFun1.data}}`);
      agHelper.ValidateToastMessage(
        "[users.myFun1] will be executed automatically on page load",
      );

      //Commit & push new changes
      gitSync.CommitAndPush();
      cy.latestDeployPreview();

      //Validate new response for button & text widget
      agHelper.GetNClickByContains(locators._deployedPage, "Widgets");
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("myFun2 Data");
      agHelper
        .GetText(locators._widgetInDeployed(draggableWidgets.TEXT), "text")
        .should("not.be.empty");
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
