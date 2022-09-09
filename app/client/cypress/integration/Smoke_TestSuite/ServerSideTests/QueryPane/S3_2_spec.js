/// <reference types="Cypress" />

const queryLocators = require("../../../../locators/QueryEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const generatePage = require("../../../../locators/GeneratePage.json");
const dsl = require("../../../../fixtures/snippingTableDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const formControls = require("../../../../locators/FormControl.json");

let datasourceName;

describe("Validate CRUD queries for Amazon S3 along with UI flow verifications", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
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

  it("1. Creates a new Amazon S3 datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.AmazonS3)
      .click({ force: true })
      .wait(1000);

    cy.generateUUID().then((uid) => {
      datasourceName = `Amazon S3 CRUD ds ${uid}`;
      cy.renameDatasource(datasourceName);
      cy.wrap(datasourceName).as("dSName");
    });

    cy.fillAmazonS3DatasourceForm();
    cy.testSaveDatasource();
  });

  it("2. Bug 9069, 9201, 6975, 9922, 3836, 6492, 11833: Upload/Update query is failing in S3 crud pages", function() {
    cy.NavigateToDSGeneratePage(datasourceName);
    cy.wait(3000);
    //Verifying List of Files from UI
    cy.get(generatePage.selectTableDropdown).click();
    cy.get(generatePage.dropdownOption)
      .contains("assets-test.appsmith.com")
      .scrollIntoView()
      .should("be.visible")
      .click();
    cy.get(generatePage.generatePageFormSubmitBtn).click();
    cy.wait("@replaceLayoutWithCRUDPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.wait("@getActions");
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );

    cy.VerifyErrorMsgAbsence("Cyclic dependency found while evaluating"); //Verifies 8686
    cy.ClickGotIt();

    //Upload: 1
    let fixturePath = "AAAGlobeChristmas.jpeg";
    cy.wait(3000);
    cy.clickButton("Select Files"); //1 files selected
    cy.get(generatePage.uploadFilesS3).attachFile(fixturePath);
    cy.wait(2000);
    cy.get(generatePage.uploadBtn).click();
    cy.wait(3000);
    cy.clickButton("Upload");
    cy.wait(1000);
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.data.isExecutionSuccess",
      true,
    );

    cy.get(commonlocators.toastAction)
      .should("have.length", 1)
      .should("contain.text", "File Uploaded"); //Verifies bug # 6975

    //Verifying Searching File from UI
    cy.xpath(queryLocators.searchFilefield)
      .type("AAAGlobeChri")
      .wait(7000); //for search to finish

    cy.get(`.t--widget-textwidget span:contains(${fixturePath})`)
      .should("have.length", 1)
      .scrollIntoView();

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
    cy.clickButton("Confirm").wait(1000); //wait for Delete operation to be successfull, //Verifies 8684
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
    });

    cy.get(`.t--widget-textwidget span:contains(${fixturePath})`).should(
      "not.exist",
    );
    //verify Deletion of file is success from UI also

    //Upload: 2 - Bug verification 9201
    fixturePath = "AAAFlowerVase.jpeg";
    cy.wait(3000);
    cy.clickButton("Select Files"); //1 files selected
    cy.get(generatePage.uploadFilesS3).attachFile(fixturePath);
    cy.wait(2000);
    cy.get(generatePage.uploadBtn).click();
    cy.wait(3000);
    cy.clickButton("Upload");
    cy.wait("@postExecute").should(
      "have.nested.property",
      "response.body.data.isExecutionSuccess",
      true,
    );

    cy.get(commonlocators.toastAction)
      .should("have.length", 1)
      .should("contain.text", "File Uploaded"); //Verifies bug # 6975

    //Verifying Searching File from UI
    cy.xpath(queryLocators.searchFilefield)
      .clear()
      .wait(500)
      .type("AAAFlower")
      .wait(7000); //for search to finish

    cy.get(`.t--widget-textwidget span:contains(${fixturePath})`)
      .should("have.length", 1)
      .scrollIntoView();
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
    cy.clickButton("Confirm").wait(3000); //wait for Delete operation to be successfull, //Verifies 8684
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
    });
    cy.get(`.t--widget-textwidget span:contains(${fixturePath})`).should(
      "not.exist",
    );
    //verify Deletion of file is success from UI also

    //Deleting the page:
    cy.actionContextMenuByEntityName(
      "Assets-test.appsmith.com",
      "Delete",
      "Are you sure?",
    );
  });

  it("3. Verify 'Add to widget [Widget Suggestion]' functionality - S3", () => {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "List files in bucket",
    );
    cy.typeValueNValidate(
      "assets-test.appsmith.com",
      formControls.s3BucketName,
    );
    cy.getEntityName().then((entity) => {
      cy.wrap(entity).as("entity");
    });
    cy.runQuery();
    cy.xpath(queryLocators.suggestedWidgetDropdown)
      .click()
      .wait(1000);
    cy.get(".t--draggable-selectwidget").validateWidgetExists();

    cy.get("@entity").then((entityN) => cy.selectEntityByName(entityN));
    cy.get(queryLocators.suggestedTableWidget)
      .click()
      .wait(1000);
    cy.get(commonlocators.TableV2Row).validateWidgetExists();

    cy.get("@entity").then((entityN) => cy.selectEntityByName(entityN));
    cy.xpath(queryLocators.suggestedWidgetText)
      .click()
      .wait(1000);
    cy.get(commonlocators.textWidget).validateWidgetExists();

    cy.get("@entity").then((entityN) => cy.selectEntityByName(entityN));
    cy.deleteQueryUsingContext(); //exeute actions & 200 response is verified in this method
  });

  it("4. Verify 'Connect Widget [snipping]' functionality - S3 ", () => {
    cy.addDsl(dsl);
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.getEntityName().then((entity) => {
      cy.wrap(entity).as("entity");
    });
    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "List files in bucket",
    );
    cy.typeValueNValidate(
      "assets-test.appsmith.com",
      formControls.s3BucketName,
    );
    cy.runQuery();
    cy.clickButton("Select Widget");
    cy.xpath(queryLocators.snipeableTable)
      .click()
      .wait(1500); //wait for table to load!

    cy.get(commonlocators.TableRow).validateWidgetExists();
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    cy.get("@entity").then((entityN) => {
      cy.log(entityN);
      cy.selectEntityByName(entityN);
    });
    cy.deleteQueryUsingContext(); //exeute actions & 200 response is verified in this method
    cy.CheckAndUnfoldEntityItem("Widgets");
    cy.actionContextMenuByEntityName("Table1");
    cy.wait(3000); //waiting for deletion to complete! - else next case fails
  });

  it("5. Deletes the datasource", () => {
    cy.NavigateToQueryEditor();
    cy.NavigateToActiveTab();
    cy.contains(".t--datasource-name", datasourceName).click({ force: true });
    cy.get(".t--delete-datasource").click();
    cy.get(".t--delete-datasource")
      .contains("Are you sure?")
      .click();

    // cy.wait("@deleteDatasource").should(
    //   "have.nested.property",
    //   "response.body.responseMeta.status",
    //   200,
    // );

    cy.wait("@deleteDatasource").should((response) => {
      expect(response.status).to.be.oneOf([200, 409]);
    });
  });
});
