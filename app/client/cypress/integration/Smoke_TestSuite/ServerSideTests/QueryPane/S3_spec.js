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

  it("2. Validate List Files in bucket (all existing files) command, run and then delete the query", () => {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "List files in bucket",
    );
    cy.onlyQueryRun();
    cy.wait("@postExecute").should(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.contains(
        "Mandatory parameter 'Bucket Name' is missing.",
      );
    });
    cy.typeValueNValidate("AutoTest", formControls.s3BucketName);
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body.split("(")[0].trim()).to.be.oneOf([
        "The specified bucket does not exist",
        "The specified bucket is not valid.",
      ]);
    });
    cy.typeValueNValidate(
      "assets-test.appsmith.com",
      formControls.s3BucketName,
    );
    cy.runAndDeleteQuery();
  });

  it("3. Validate Create/List Files/Read files in bucket command for new file, Verify possible error msgs, run & delete the query", () => {
    //Create File
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.setQueryTimeout(30000);
    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "List files in bucket",
      "Create a new file",
    );

    cy.onlyQueryRun();
    cy.wait("@postExecute").should(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.contains(
        "Mandatory parameter 'Bucket Name' is missing.",
      );
    });
    cy.typeValueNValidate("AutoTest", formControls.s3BucketName);

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.contains(
        "Required parameter 'File Path' is missing.",
      );
    });
    cy.typeValueNValidate("AutoFile", formControls.s3FilePath);

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.eq(
        "Unable to parse content. Expected to receive an object with `data` and `type`",
      );
    });

    cy.typeValueNValidate("Hi", formControls.rawBody);
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.eq(
        "Unable to parse content. Expected to receive an object with `data` and `type`",
      );
    });

    cy.typeValueNValidate(
      '{"data": "Hi, this is Automation script adding File!"}',
      formControls.rawBody,
    );

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.contains(
        "File content is not base64 encoded.",
      );
    });
    cy.ValidateAndSelectDropdownOption(
      formControls.s3CreateFileDataType,
      "Base64",
      "Text",
    );

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      //expect(['The specified bucket does not exist', 'The specified bucket is not valid.']).to.include(response.body.data.body)
      expect(response.body.data.body.split("(")[0].trim()).to.be.oneOf([
        "The specified bucket does not exist",
        "The specified bucket is not valid.",
      ]);
    });

    cy.typeValueNValidate(
      "assets-test.appsmith.com",
      formControls.s3BucketName,
    );

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
    });

    //List file
    //  cy.NavigateToActiveDSQueryPane(datasourceName);
    //   cy.setQueryTimeout(30000);
    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "Create a new file",
      "List files in bucket",
    );

    // cy.onlyQueryRun();
    // cy.wait("@postExecute").should(({ response }) => {
    //   expect(response.body.data.isExecutionSuccess).to.eq(false);
    //   expect(response.body.data.body).to.contains(
    //     "Mandatory parameter 'Bucket Name' is missing.",
    //   );
    // });
    // cy.typeValueNValidate("assets-test.appsmith.com", "Bucket Name");

    cy.typeValueNValidate("Auto", formControls.s3ListPrefix);
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body[0].fileName).to.contains("Auto");
      expect(response.body.data.body[0].url).to.exist;
    });

    cy.typeValueNValidate("AutoFile", formControls.s3ListPrefix);
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body[0].fileName).to.contains("Auto");
      expect(response.body.data.body[0].url).to.exist;
      expect(response.body.data.body[0].signedUrl).not.to.exist;
    });

    cy.ValidateAndSelectDropdownOption(
      formControls.s3ListSignedUrl,
      "No",
      "Yes",
    );
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body[0].fileName).to.contains("Auto");
      expect(response.body.data.body[0].signedUrl).to.exist;
      expect(response.body.data.body[0].url).to.exist;
    });

    cy.ValidateAndSelectDropdownOption(
      formControls.s3ListUnSignedUrl,
      "Yes",
      "No",
    );
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body[0].fileName).to.contains("Auto");
      expect(response.body.data.body[0].signedUrl).to.exist;
      expect(response.body.data.body[0].url).to.not.exist;
    });
    //cy.deleteQueryUsingContext(); //exeute actions & 200 response is verified in this method

    //Read File

    //cy.NavigateToActiveDSQueryPane(datasourceName);
    //cy.setQueryTimeout(30000);
    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "List files in bucket",
      "Read file",
    );

    // cy.onlyQueryRun();
    // cy.wait("@postExecute").should(({ response }) => {
    //   expect(response.body.data.isExecutionSuccess).to.eq(false);
    //   expect(response.body.data.body).to.contains(
    //     "Mandatory parameter 'Bucket Name' is missing.",
    //   );
    // });
    // cy.typeValueNValidate("AutoTest", "Bucket Name");

    // cy.onlyQueryRun();
    // cy.wait("@postExecute").then(({ response }) => {
    //   expect(response.body.data.isExecutionSuccess).to.eq(false);
    //   expect(response.body.data.body).to.contains(
    //     "Required parameter 'File Path' is missing.",
    //   );
    // });
    cy.typeValueNValidate("Auto", formControls.s3FilePath);

    // cy.onlyQueryRun();
    // cy.wait("@postExecute").then(({ response }) => {
    //   expect(response.body.data.isExecutionSuccess).to.eq(false);
    //   expect(response.body.data.body.split("(")[0].trim()).to.be.oneOf([
    //     "The specified bucket does not exist",
    //     "The specified bucket is not valid.",
    //   ]);
    // });

    // cy.typeValueNValidate("assets-test.appsmith.com", "Bucket Name");

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.contain(
        "The specified key does not exist.",
      );
    });

    cy.typeValueNValidate("Autofile", formControls.s3FilePath);

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.contain(
        "The specified key does not exist.",
      );
    });

    cy.typeValueNValidate("AutoFile", formControls.s3FilePath);

    //Commenting below since below dropdown is removed from Read
    //cy.validateNSelectDropdown("File Data Type", "Base64", "Text");

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body.fileData).to.not.eq(
        "Hi, this is Automation script adding File!",
      );
    });

    cy.ValidateAndSelectDropdownOption(
      formControls.s3ReadFileDataType,
      "Yes",
      "No",
    );
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body.fileData).to.eq(
        "Hi, this is Automation script adding File!",
      );
    });
    cy.deleteQueryUsingContext(); //exeute actions & 200 response is verified in this method
  });

  it("4. Validate Delete file command for new file & Validating List Files in bucket command after new file is deleted, Verify possible error msgs, run & delete the query", () => {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    //cy.renameWithInPane(queryName);
    cy.setQueryTimeout(30000);
    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "List files in bucket",
      "Delete file",
    );

    cy.onlyQueryRun();
    cy.wait("@postExecute").should(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.contains(
        "Mandatory parameter 'Bucket Name' is missing.",
      );
    });
    cy.typeValueNValidate("AutoTest", formControls.s3BucketName);

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.contains(
        "Required parameter 'File Path' is missing.",
      );
    });
    cy.typeValueNValidate("Auto", formControls.s3FilePath);
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body.split("(")[0].trim()).to.be.oneOf([
        "The specified bucket does not exist",
        "The specified bucket is not valid.",
      ]);
    });
    cy.typeValueNValidate(
      "assets-test.appsmith.com",
      formControls.s3BucketName,
    );
    cy.typeValueNValidate("AutoFile", formControls.s3FilePath);
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body.status).to.eq("File deleted successfully");
    });

    //cy.selectEntityByName("Query1");
    //cy.deleteQueryUsingContext(); //exeute actions & 200 response is verified in this method

    //Validating List Files in bucket command after new file is deleted
    //cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "Delete file",
      "List files in bucket",
    );
    //cy.typeValueNValidate("assets-test.appsmith.com", "Bucket Name");
    cy.typeValueNValidate("Auto", formControls.s3ListPrefix);
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body.length).to.eq(0); //checking that body is empty array
    });
    cy.deleteQueryUsingContext(); //exeute actions & 200 response is verified in this method
  });

  it("5. Create new file in bucket for UI Operations & Verify Search, Delete operations from NewPage UI created in S3 ds & Bug 8686, 8684", function() {
    //Creating new file in bucket
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "List files in bucket",
      "Create a new file",
    );
    cy.typeValueNValidate(
      "assets-test.appsmith.com",
      formControls.s3BucketName,
    );
    cy.typeValueNValidate("CRUDNewPageFile", formControls.s3FilePath);
    cy.ValidateAndSelectDropdownOption(
      formControls.s3CreateFileDataType,
      "Base64",
      "Text",
    );
    cy.typeValueNValidate(
      '{"data": "Hi, this is Automation script adding file for S3 CRUD New Page validation!"}',
      formControls.rawBody,
    );

    cy.setQueryTimeout(30000);

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
    });
    cy.deleteQueryUsingContext(); //exeute actions & 200 response is verified in this method

    // cy.wrap(Cypress.automation('remote:debugger:protocol', {
    //   command: 'Browser.grantPermissions',
    //   params: {
    //     permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
    //     // make the permission tighter by allowing the current origin only
    //     // like "http://localhost:56978"
    //     origin: window.location.origin,
    //   },
    // }))

    //Generate page & other UI ops
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
    ); //This verifies the Select on the table, ie page is created fine

    cy.VerifyErrorMsgAbsence("Cyclic dependency found while evaluating"); //Verifies 8686

    cy.ClickGotIt();

    //Verifying Searching File from UI
    cy.xpath(queryLocators.searchFilefield)
      .type("CRUD")
      .wait(7000); //for search to finish

    cy.get(".t--widget-textwidget span:contains('CRUDNewPageFile')")
      .should("have.length", 1)
      .scrollIntoView();

    //Verifying CopyFile URL icon from UI - Browser pop up appearing
    // cy.xpath(queryLocators.copyURLicon).click()
    // cy.window().its('navigator.clipboard').invoke('readText').should('contain', 'CRUDNewPageFile')

    //Verifying DeleteFile icon from UI
    cy.xpath(queryLocators.deleteFileicon)
      .eq(0)
      .click(); //Verifies 8684
    cy.VerifyErrorMsgAbsence("Cyclic dependency found while evaluating"); //Verifies 8686

    expect(
      cy.xpath("//span[text()='Are you sure you want to delete the file?']"),
    ).to.exist; //verify Delete File dialog appears
    cy.clickButton("Confirm").wait(1000); //wait for Delete operation to be successfull, //Verifies 8684
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
    });
    cy.get("span:contains('CRUDNewPageFile')").should("not.exist"); //verify Deletion of file is success from UI also
  });

  it("6. Validate Deletion of the Newly Created Page", () => {
    cy.NavigateToQueryEditor();
    cy.NavigateToActiveTab();
    cy.contains(".t--datasource-name", datasourceName).click();
    cy.get(".t--delete-datasource").click();
    cy.get(".t--delete-datasource")
      .contains("Are you sure?")
      .click();
    cy.wait("@deleteDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      409,
    );
    cy.actionContextMenuByEntityName(
      "Assets-test.appsmith.com",
      "Delete",
      "Are you sure?",
    );
  });

  it("7. Bug 9069, 9201, 6975, 9922, 3836, 6492, 11833: Upload/Update query is failing in S3 crud pages", function() {
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

  it("8. Verify 'Add to widget [Widget Suggestion]' functionality - S3", () => {
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

  it("9. Verify 'Connect Widget [snipping]' functionality - S3 ", () => {
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
    cy.CheckAndUnfoldEntityItem("QUERIES/JS");
    cy.get("@entity").then((entityN) => {
      cy.log(entityN);
      cy.selectEntityByName(entityN);
    });
    cy.deleteQueryUsingContext(); //exeute actions & 200 response is verified in this method
    cy.CheckAndUnfoldEntityItem("WIDGETS");
    cy.actionContextMenuByEntityName("Table1");
    cy.wait(3000); //waiting for deletion to complete! - else next case fails
  });

  it("10. Deletes the datasource", () => {
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
