/// <reference types="Cypress" />

import generatePage from "../../../../locators/GeneratePage.json";
import formControls from "../../../../locators/FormControl.json";
import {
  agHelper,
  assertHelper,
  dataSources,
  deployMode,
  draggableWidgets,
  entityExplorer,
  entityItems,
  locators,
  propPane,
  table,
} from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Validate CRUD queries for Amazon S3 along with UI flow verifications",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    let bucketName = "assets-test--appsmith",
      uid: any,
      datasourceName: any;
    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
      dataSources.StartDataSourceRoutes();
    });

    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    // afterEach(function() {
    //   if (this.currentTest.state === "failed") {
    //     Cypress.runner.stop();
    //   }
    // });

    // afterEach(() => {
    //   if (queryName)
    //     cy.actionContextMenuByEntityName(queryName);
    // });

    before("Creates a new Amazon S3 datasource", function () {
      dataSources.CreateDataSource("S3");
      cy.get("@dsName").then((dsName) => {
        datasourceName = dsName;
      });
      agHelper.GenerateUUID();

      cy.get("@guid").then((guid) => {
        uid = guid;
      });
    });

    it("1. Bug 9069, 9201, 6975, 9922, 3836, 6492, 11833: Upload/Update query is failing in S3 crud pages", function () {
      dataSources.GeneratePageForDS(datasourceName);
      cy.wait(3000);
      //Verifying List of Files from UI
      cy.get(generatePage.selectTableDropdown).click();
      cy.get(generatePage.dropdownOption)
        .contains(bucketName)
        .scrollIntoView()
        .should("be.visible")
        .click();
      cy.get(generatePage.generatePageFormSubmitBtn).click();
      assertHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
      assertHelper.AssertNetworkStatus("@getActions");
      assertHelper.AssertNetworkStatus("@postExecute");

      agHelper.AssertElementAbsence(
        locators._specificToast("Cyclic dependency found while evaluating"),
      ); //Verifies 8686
      agHelper.ClickButton("Got it");

      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.BUTTON));

      //Upload: 1- from Deployed page
      let imageNameToUpload = "AAAGlobeChristmas.jpeg";

      let fixturePath = uid + "Globe.jpeg";
      agHelper.ClickButton("Select Files"); //1 files selected

      agHelper.UploadFile(imageNameToUpload);

      agHelper.ClearTextField(
        locators._widgetInputSelector(draggableWidgets.INPUT_V2),
        false,
        2,
      );
      agHelper.AssertElementEnabledDisabled(locators._buttonByText("Upload")); //Assert that when name is empty, upload button is disabled
      agHelper.TypeText(
        locators._widgetInputSelector(draggableWidgets.INPUT_V2),
        fixturePath,
        2,
      );
      agHelper.Sleep(2000); //time for file to be uploaded
      agHelper.ClickButton("Upload");
      cy.wait(1000);
      assertHelper.AssertNetworkExecutionSuccess("@postExecute", true);

      agHelper.ValidateToastMessage("File Uploaded"); //Verifies bug # 6975

      agHelper.Sleep(2000); //time for file to be uploaded

      //Verifying Searching File from UI
      agHelper.ClearNType(
        locators._widgetInputSelector(draggableWidgets.INPUT_V2),
        uid,
      );
      agHelper.Sleep(5000); //for search to be successful
      agHelper.GetNAssertElementText(
        locators._textWidgetInDeployed,
        fixturePath,
        "have.text",
        1,
      );
      agHelper.Sleep(2000);

      //Verifying DeleteFile icon from UI

      DeleteS3FileFromUI(fixturePath);

      //Upload: 2 - Bug verification 9201
      imageNameToUpload = "AAAFlowerVase.jpeg";
      fixturePath = uid + "FlowerVase.jpeg";
      cy.wait(3000);
      agHelper.ClickButton("Select Files"); //1 files selected
      agHelper.UploadFile(imageNameToUpload);

      agHelper.ClearNType(
        locators._widgetInputSelector(draggableWidgets.INPUT_V2),
        fixturePath,
        2,
      );
      agHelper.Sleep(2000); //time for file to be uploaded
      agHelper.ClickButton("Upload");

      assertHelper.AssertNetworkExecutionSuccess("@postExecute", true);
      agHelper.ValidateToastMessage("File Uploaded"); //Verifies bug # 6975

      //Verifying Searching File from UI

      // agHelper.ClearNType(
      //   locators._widgetInputSelector(draggableWidgets.INPUT_V2),
      //   uid,
      // );//as already uid is present in search box
      agHelper.Sleep(2000); //for search to be successful

      agHelper.GetNAssertElementText(
        locators._textWidgetInDeployed,
        fixturePath,
        "have.text",
        1,
      );

      //Verifies bug # 9922

      cy.wait(3000);
      //Verifying DeleteFile from UI
      DeleteS3FileFromUI(fixturePath);

      //Deleting the page://Commenting below since during re-runs the page name can be com2, com3 etc
      // entityExplorer.ActionContextMenuByEntityName(
      //   "Assets-test.appsmith.com",
      //   "Delete",
      // );
      agHelper.ClearTextField(
        locators._widgetInputSelector(draggableWidgets.INPUT_V2),
      );
    });

    it("2. Edit from S3 Deployed crud page", function () {
      let imageNameToUpload = "Datatypes/Bridge.jpg"; //Massachusetts
      let fixturePath = uid + imageNameToUpload;
      agHelper.ClickButton("Select Files"); //1 files selected
      agHelper.UploadFile(imageNameToUpload);

      agHelper.AssertElementAbsence(locators._buttonByText("Select Files")); //verifying buttons are changed
      agHelper.AssertElementVisibility(
        locators._buttonByText("1 files selected"),
      );

      agHelper.ClearTextField(
        locators._widgetInputSelector(draggableWidgets.INPUT_V2),
        false,
        2,
      );
      agHelper.AssertElementEnabledDisabled(locators._buttonByText("Upload")); //Assert that when name is empty, upload button is disabled
      agHelper.TypeText(
        locators._widgetInputSelector(draggableWidgets.INPUT_V2),
        fixturePath,
        2,
      );
      agHelper.Sleep(2000); //time for file to be uploaded
      agHelper.ClickButton("Upload", { sleepTime: 2000 });
      assertHelper.AssertNetworkExecutionSuccess("@postExecute", true);

      agHelper.AssertElementVisibility(locators._buttonByText("Select Files"));
      agHelper.AssertElementAbsence(locators._buttonByText("1 files selected"));

      agHelper.ValidateToastMessage("File Uploaded"); //Verifies bug # 6975

      agHelper.Sleep(2000); //time for file to be uploaded

      //Verifying Searching File from UI
      agHelper.ClearNType(
        locators._widgetInputSelector(draggableWidgets.INPUT_V2),
        uid,
      );
      agHelper.Sleep(5000); //for search to be successful
      agHelper.GetNAssertElementText(
        locators._textWidgetInDeployed,
        fixturePath,
        "have.text",
        1,
      );
      agHelper.Sleep(2000);

      //Verifying Edit file from UI
      imageNameToUpload = "Datatypes/Massachusetts.jpeg";

      agHelper.GetNClick(dataSources._s3CrudIcons(fixturePath, "Edit"));
      agHelper.AssertElementVisibility(
        locators._visibleTextSpan("Update File"),
      ); //verifying Update File dialog appears
      agHelper.ClickButton("Cancel");
      agHelper.AssertElementAbsence(locators._visibleTextSpan("Update File")); //verifying Update File dialog is closed

      agHelper.GetNClick(dataSources._s3CrudIcons(fixturePath, "Edit"));
      agHelper.ClickButton("Select File"); //1 files selected
      agHelper.UploadFile(imageNameToUpload, true, 2);

      agHelper.AssertElementEnabledDisabled(dataSources._s3EditFileName);
      agHelper.AssertText(
        dataSources._s3EditFileName + " ** " + locators._inputField,
        "val",
        fixturePath,
      ); //Assert that file name is original name
      agHelper.ClickButton("Update", { sleepTime: 2000 }); //for the update to refelct in UI

      agHelper.GetNAssertElementText(
        locators._textWidgetInDeployed,
        fixturePath,
        "have.text",
        1,
      );

      //Only Asserting icons are present
      agHelper.AssertElementVisibility(
        dataSources._s3CrudIcons(fixturePath, "CopyURL"),
      );
      agHelper.AssertElementVisibility(
        dataSources._s3CrudIcons(fixturePath, "Download"),
      );

      // //Browser pop up appearing, unable to handle it in Cypress, below not working
      // cy.on("window:confirm", (text) => {
      //   // Handle the confirm dialog as needed
      //   // For example, you can assert the dialog message
      //   expect(text).contains(fixturePath);
      //   // Respond to the confirm dialog
      //   cy.window().then((win) => win.confirm(true)); // Accept the dialog
      //   // cy.window().then(win => win.confirm(false)); // Dismiss the dialog
      // });
      // agHelper.GiveChromeCopyPermission();
      // agHelper.GetNClick(dataSources._s3CrudIcons(fixturePath, "CopyURL"));
      // cy.window()
      //   .its("navigator.clipboard")
      //   .invoke("readText")
      //   .should("contain", fixturePath);

      //Attempt Delete & Cancel from UI
      agHelper.GetNClick(dataSources._s3CrudIcons(fixturePath, "Delete")); //Verifies 8684

      agHelper.ClickButton("Cancel");
      agHelper.GetNAssertElementText(
        locators._textWidgetInDeployed,
        fixturePath,
        "have.text",
        1,
      );

      //Attempt Delete & Confirm from UI
      DeleteS3FileFromUI(fixturePath);

      agHelper.ClearTextField(
        locators._widgetInputSelector(draggableWidgets.INPUT_V2),
      );
    });

    it("3. Uploading maximum files from UI - S3 Deployed Crud page", () => {
      let imageNameToUpload = "Datatypes/Georgia.jpeg",
        bulkyId = "BulkUpload/" + uid;
      // Datatypes/Maine.jpeg,

      agHelper.ClickButton("Select Files"); //1 files selected
      agHelper.UploadFile(imageNameToUpload, false);

      agHelper.ClickButton("Add more");
      imageNameToUpload = "Datatypes/Maine.jpeg";
      agHelper.UploadFile(imageNameToUpload, false);

      agHelper.ClickButton("Add more");
      imageNameToUpload = "Datatypes/NewJersey.jpeg";
      agHelper.UploadFile(imageNameToUpload, false);

      agHelper.AssertElementAbsence(locators._buttonByText("Add more")); //verifying Add more button is not present after max files are uploaded

      agHelper.ClickButton("Upload 3 files");
      agHelper.AssertElementVisibility(
        locators._buttonByText("3 files selected"),
      );

      agHelper.ClearNType(
        locators._widgetInputSelector(draggableWidgets.INPUT_V2),
        "BulkUpload/" + uid,
        1,
      );
      agHelper.ClearNType(
        locators._widgetInputSelector(draggableWidgets.INPUT_V2),
        "Georgia.jpeg",
        2,
      ); //Since previous name is retained in input field
      agHelper.Sleep(2000); //time for file to be uploaded
      agHelper.ClickButton("Upload");
      agHelper.ValidateToastMessage("File Uploaded", 0, 3); //Verifies for all 3 files

      //Verifying Searching Folder from UI
      agHelper.ClearNType(
        locators._widgetInputSelector(draggableWidgets.INPUT_V2),
        bulkyId,
      );
      agHelper.Sleep(5000); //for search to be successful
      agHelper.GetNAssertElementText(
        locators._textWidgetInDeployed,
        "Georgia.jpeg",
        "contain.text",
        1,
      );
      agHelper.GetNAssertElementText(
        locators._textWidgetInDeployed,
        "Maine.jpeg",
        "contain.text",
        2,
      );
      agHelper.GetNAssertElementText(
        locators._textWidgetInDeployed,
        "NewJersey.jpeg",
        "contain.text",
        3,
      );

      DeleteS3FileFromUI(bulkyId + "/Georgia.jpeg", false);
      DeleteS3FileFromUI(bulkyId + "/Maine.jpeg", false);
      DeleteS3FileFromUI(bulkyId + "/NewJersey.jpeg", true);

      deployMode.NavigateBacktoEditor();
    });

    it("4. Verifying Max file size - 'Base64' file - CRUD page - Bug #18245 - 10 Mb & 40 Mb", function () {
      let video = "Videos/defaultVideo.y4m";

      EditorNavigation.SelectEntityByName("FilePicker", EntityType.Widget, {}, [
        "Container6",
      ]);
      propPane.UpdatePropertyFieldValue("Max no. of files", "2");

      propPane.UpdatePropertyFieldValue("Max file size(Mb)", "10");

      deployMode.DeployApp();
      agHelper.ClickButton("Select Files");

      agHelper.UploadFile(video, false);
      agHelper.AssertText(
        dataSources._s3MaxFileSizeAlert,
        "text",
        "This file exceeds maximum allowed size of 10 MB ",
      );
      agHelper.ClickButton("Close");
      deployMode.NavigateBacktoEditor();

      EditorNavigation.SelectEntityByName("FilePicker", EntityType.Widget, {}, [
        "Container6",
      ]);
      propPane.UpdatePropertyFieldValue("Max file size(Mb)", "40");
      deployMode.DeployApp();
      video = "Videos/rotatedQRCode.y4m";

      agHelper.ClickButton("Select Files");
      agHelper.UploadFile(video, false);
      agHelper.AssertText(
        dataSources._s3MaxFileSizeAlert,
        "text",
        "This file exceeds maximum allowed size of 40 MB ",
      );

      video = "Videos/defaultVideo.y4m";
      agHelper.UploadFile(video, false);
      agHelper.AssertElementVisibility(dataSources._s3MaxFileSizeAlert, false);

      video = "Videos/webCamVideo.y4m";
      agHelper.ClickButton("Add more");
      agHelper.UploadFile(video, false);
      agHelper.AssertElementVisibility(dataSources._s3MaxFileSizeAlert, false);

      agHelper.ClickButton("Upload 2 files");
      agHelper.ClickButton("2 files selected");

      agHelper.ClickButton("Remove file");
      agHelper.ClickButton("Remove file");

      agHelper.ClickButton("Close");
      agHelper.AssertElementVisibility(locators._buttonByText("Select Files"));
      deployMode.NavigateBacktoEditor();
    });

    it("5. Verify 'Add to widget [Widget Suggestion]' functionality - S3", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      dataSources.CreateQueryForDS(datasourceName);

      agHelper.GetObjectName().then(($queryName) => {
        dataSources.ValidateNSelectDropdown("Command", "List files in bucket");
        agHelper.UpdateCodeInput(formControls.s3BucketName, bucketName);

        dataSources.RunQuery();
        dataSources.AddSuggestedWidget(Widgets.Dropdown);
        propPane.DeleteWidgetDirectlyFromPropertyPane();

        EditorNavigation.SelectEntityByName($queryName, EntityType.Query);
        dataSources.AddSuggestedWidget(Widgets.Table);
        table.WaitUntilTableLoad(0, 0, "v2");
        propPane.DeleteWidgetDirectlyFromPropertyPane();

        EditorNavigation.SelectEntityByName($queryName, EntityType.Query);
        agHelper.ActionContextMenuWithInPane({
          action: "Delete",
          entityType: entityItems.Query,
        });
      });
    });

    it("6. Verify Adding Suggested widget with already present widget - S3 ", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE);
      agHelper.Sleep(2500); //allowing sometime for widget to settle down
      dataSources.CreateQueryForDS(datasourceName);
      agHelper.GetObjectName().then(($queryName) => {
        EditorNavigation.SelectEntityByName($queryName, EntityType.Query);
        dataSources.ValidateNSelectDropdown("Command", "List files in bucket");
        agHelper.UpdateCodeInput(formControls.s3BucketName, bucketName);
        dataSources.RunQuery();
        agHelper.Sleep(); //for CI runs
        dataSources.AddSuggestedWidget(
          Widgets.Table,
          dataSources._addSuggestedExisting,
        );
        propPane.DeleteWidgetDirectlyFromPropertyPane();
        EditorNavigation.SelectEntityByName($queryName, EntityType.Query);
        agHelper.ActionContextMenuWithInPane({
          action: "Delete",
          entityType: entityItems.Query,
        });
        //exeute actions & 200 response is verified in this method
        cy.wait(3000); //waiting for deletion to complete! - else after hook fails
      });
    });

    after("Deletes the datasource", () => {
      dataSources.DeleteDatasourceFromWithinDS(datasourceName, 409); //since crud page is still active
    });

    function DeleteS3FileFromUI(
      fileNameToDelete = "",
      toAssertNoDataToDisplay = true,
    ) {
      agHelper.GetNClick(dataSources._s3CrudIcons(fileNameToDelete, "Delete")); //Verifies 8684
      agHelper.AssertElementAbsence(
        locators._specificToast("Cyclic dependency found while evaluating"),
      ); //Verifies 8686
      agHelper.AssertElementVisibility(
        locators._visibleTextSpan("Are you sure you want to delete the file?"),
      ); //verify Delete File dialog appears
      agHelper.ClickButton("Confirm", { sleepTime: 3000 }); //wait for Delete operation to be successfull, //Verifies 8684
      assertHelper.AssertNetworkExecutionSuccess("@postExecute", true);
      agHelper.Sleep(2000); //for the delete to reflect in UI for CI runs
      agHelper.GetNAssertElementText(
        locators._textWidgetInDeployed,
        fileNameToDelete,
        "not.have.text",
        1,
      );
      toAssertNoDataToDisplay &&
        agHelper.AssertElementVisibility(
          locators._visibleTextDiv("No data to display"),
        );
    }
  },
);
