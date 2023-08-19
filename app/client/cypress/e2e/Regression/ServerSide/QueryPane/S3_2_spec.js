/// <reference types="Cypress" />

const queryLocators = require("../../../../locators/QueryEditor.json");
const generatePage = require("../../../../locators/GeneratePage.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const formControls = require("../../../../locators/FormControl.json");
import {
  agHelper,
  entityExplorer,
  dataSources,
  entityItems,
  draggableWidgets,
  propPane,
  deployMode,
  locators,
  assertHelper,
  table,
} from "../../../../support/Objects/ObjectsCore";

let datasourceName;

describe("Validate CRUD queries for Amazon S3 along with UI flow verifications", function () {
  let bucketName = "assets-test--appsmith";
  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
    cy.startRoutesForDatasource();
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
  });

  it("1. Bug 9069, 9201, 6975, 9922, 3836, 6492, 11833: Upload/Update query is failing in S3 crud pages", function () {
    cy.NavigateToDSGeneratePage(datasourceName);
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

    cy.VerifyErrorMsgAbsence("Cyclic dependency found while evaluating"); //Verifies 8686
    cy.ClickGotIt();

    deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.BUTTON));

    //Upload: 1- from Deployed page
    cy.get("@guid").then((uid) => {
      let fixturePath = uid + "Globe.jpeg";
      agHelper.ClickButton("Select Files"); //1 files selected

      cy.get(generatePage.uploadFilesS3)
        .first()
        .selectFile("cypress/fixtures/AAAGlobeChristmas.jpeg", {
          force: true,
        });
      cy.wait(2000);
      cy.get(generatePage.uploadBtn).click().wait(1000);

      agHelper.ClearTextField(
        locators._widgetInputSelector(draggableWidgets.INPUT_V2),
        false,
        2,
      );
      agHelper.AssertElementEnabledDisabled(locators._spanButton("Upload")); //Assert that when name is empty, upload button is disabled
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

      const deleteIconButtonXPATH =
        "//button/span[@icon='trash']/ancestor::div[contains(@class,'t--widget-iconbuttonwidget')]/preceding-sibling::div[contains(@class, 't--widget-textwidget')]//span[text()='" +
        fixturePath +
        "']/ancestor::div[contains(@class, 't--widget-textwidget')]/following-sibling::div[contains(@class,'t--widget-iconbuttonwidget')]";

      cy.xpath(deleteIconButtonXPATH)
        .should("exist")
        .last()
        .scrollIntoView()
        .click(); //Verifies 8684

      cy.VerifyErrorMsgAbsence("Cyclic dependency found while evaluating"); //Verifies 8686

      expect(
        cy.xpath("//span[text()='Are you sure you want to delete the file?']"),
      ).to.exist; //verify Delete File dialog appears
      agHelper.ClickButton("Confirm").wait(2000); //wait for Delete operation to be successfull, //Verifies 8684

      assertHelper.AssertNetworkExecutionSuccess("@postExecute", true);

      agHelper.AssertElementAbsence(
        `.t--widget-textwidget span:contains(${fixturePath})`,
      );
      agHelper.AssertElementVisibility(
        locators._visibleTextDiv("No data to display"),
      ); //verify Deletion of file is success from UI also

      //Upload: 2 - Bug verification 9201
      fixturePath = uid + "FlowerVase.jpeg";
      cy.wait(3000);
      agHelper.ClickButton("Select Files"); //1 files selected
      cy.get(generatePage.uploadFilesS3)
        .first()
        .selectFile("cypress/fixtures/AAAFlowerVase.jpeg", {
          force: true,
        });
      cy.wait(2000);
      cy.get(generatePage.uploadBtn).click().wait(1000);

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
      //Verifying DeleteFile icon from UI
      cy.xpath(
        "//button/span[@icon='trash']/ancestor::div[contains(@class,'t--widget-iconbuttonwidget')]/preceding-sibling::div[contains(@class, 't--widget-textwidget')]//span[text()='" +
          fixturePath +
          "']/ancestor::div[contains(@class, 't--widget-textwidget')]/following-sibling::div[contains(@class,'t--widget-iconbuttonwidget')]",
      )
        .should("exist")
        .last()
        .scrollIntoView()
        .click(); //Verifies 8684
      cy.VerifyErrorMsgAbsence("Cyclic dependency found while evaluating"); //Verifies 8686

      expect(
        cy.xpath("//span[text()='Are you sure you want to delete the file?']"),
      ).to.exist; //verify Delete File dialog appears

      agHelper.ClickButton("Confirm").wait(2000); //wait for Delete operation to be successfull, //Verifies 8684

      assertHelper.AssertNetworkExecutionSuccess("@postExecute", true);

      agHelper.AssertElementAbsence(
        `.t--widget-textwidget span:contains(${fixturePath})`,
      );

      agHelper.AssertElementVisibility(
        locators._visibleTextDiv("No data to display"),
      ); //verify Deletion of file is success from UI also

      //Deleting the page://Commenting below since during re-runs the page name can be com2, com3 etc
      // entityExplorer.ActionContextMenuByEntityName(
      //   "Assets-test.appsmith.com",
      //   "Delete",
      // );
      deployMode.NavigateBacktoEditor();
    });
  });

  it("2. Verify 'Add to widget [Widget Suggestion]' functionality - S3", () => {
    entityExplorer.SelectEntityByName("Page1");
    cy.NavigateToActiveDSQueryPane(datasourceName);

    agHelper.GetObjectName().then(($queryName) => {
      dataSources.ValidateNSelectDropdown("Commands", "List files in bucket");
      cy.typeValueNValidate(bucketName, formControls.s3BucketName);
      cy.runQuery();
      cy.xpath(queryLocators.suggestedWidgetDropdown).click().wait(1000);
      cy.get(".t--draggable-selectwidget").validateWidgetExists();

      entityExplorer.SelectEntityByName("Select1", "Widgets");
      agHelper.GetNClick(propPane._deleteWidget);

      entityExplorer.SelectEntityByName($queryName, "Queries/JS");
      cy.get(queryLocators.suggestedTableWidget).click().wait(1000);
      cy.get(commonlocators.TableV2Row).validateWidgetExists();
      entityExplorer.SelectEntityByName("Table1", "Widgets");
      agHelper.GetNClick(propPane._deleteWidget);

      entityExplorer.SelectEntityByName($queryName, "Queries/JS");
      cy.deleteQueryUsingContext(); //exeute actions & 200 response is verified in this method
    });
  });

  it("3. Verify 'Connect Widget [snipping]' functionality - S3 ", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE);
    cy.NavigateToActiveDSQueryPane(datasourceName);
    agHelper.GetObjectName().then(($queryName) => {
      entityExplorer.SelectEntityByName($queryName, "Queries/JS");
      dataSources.ValidateNSelectDropdown("Commands", "List files in bucket");
      cy.typeValueNValidate(bucketName, formControls.s3BucketName);
      dataSources.RunQuery();
      agHelper.ClickButton("Select widget"); //Binding to dragDropped table
      agHelper.AssertElementVisibility(dataSources._snippingBanner);
      agHelper.GetNClick(locators._widgetInDeployed(draggableWidgets.TABLE));
      entityExplorer.SelectEntityByName("Table1", "Widgets");
      agHelper.GetNClick(propPane._deleteWidget);
      entityExplorer.SelectEntityByName($queryName, "Queries/JS");
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      //exeute actions & 200 response is verified in this method
      cy.wait(3000); //waiting for deletion to complete! - else after hook fails
    });
  });

  after("Deletes the datasource", () => {
    dataSources.DeleteDatasouceFromActiveTab(datasourceName, [200 | 409]);
  });
});
