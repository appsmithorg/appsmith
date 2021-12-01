const queryLocators = require("../../../../locators/QueryEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const generatePage = require("../../../../locators/GeneratePage.json");
const dsl = require("../../../../fixtures/snippingTableDsl.json");

let datasourceName;

describe("Validate CRUD queries for Amazon S3 along with UI flow verifications", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

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
    cy.renameWithInPane("ListFilesQuery");
    cy.validateNSelectDropdown("Commands", "List files in bucket");
    cy.onlyQueryRun();
    cy.wait("@postExecute").should(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.contains(
        "Mandatory parameter 'Bucket Name' is missing.",
      );
    });
    cy.typeValueNValidate("AutoTest", "Bucket Name");
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body.split("(")[0].trim()).to.be.oneOf([
        "The specified bucket does not exist",
        "The specified bucket is not valid.",
      ]);
    });
    cy.typeValueNValidate("assets-test.appsmith.com", "Bucket Name");
    cy.runQuery(); //exeute actions & 200 response is verified in this method
    cy.deleteEntitybyName("ListFilesQuery");
  });

  it("3. Validate Create a new file in bucket command, Verify possible error msgs, run & delete the query", () => {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.renameWithInPane("CreateFileQuery");
    cy.validateNSelectDropdown(
      "Commands",
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
    cy.typeValueNValidate("AutoTest", "Bucket Name");

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.contains(
        "Required parameter 'File Path' is missing.",
      );
    });
    cy.typeValueNValidate("AutoFile", "File Path");

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.eq(
        "Unable to parse content. Expected to receive an object with `data` and `type`",
      );
    });

    cy.typeValueNValidate("Hi", "Content");
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.eq(
        "Unable to parse content. Expected to receive an object with `data` and `type`",
      );
    });

    cy.typeValueNValidate(
      '{"data": "Hi, this is Automation script adding File!"}',
      "Content",
    );

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.contains(
        "File content is not base64 encoded.",
      );
    });
    cy.validateNSelectDropdown("File Data Type", "Base64", "Text / Binary");

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      //expect(['The specified bucket does not exist', 'The specified bucket is not valid.']).to.include(response.body.data.body)
      expect(response.body.data.body.split("(")[0].trim()).to.be.oneOf([
        "The specified bucket does not exist",
        "The specified bucket is not valid.",
      ]);
    });

    cy.typeValueNValidate("assets-test.appsmith.com", "Bucket Name");

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
    });
    cy.deleteEntitybyName("CreateFileQuery");
  });

  it("4. Validate Read file command, Verify possible error msgs, run & delete the query", () => {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.renameWithInPane("ReadFileQuery");
    cy.validateNSelectDropdown("Commands", "List files in bucket", "Read file");

    cy.onlyQueryRun();
    cy.wait("@postExecute").should(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.contains(
        "Mandatory parameter 'Bucket Name' is missing.",
      );
    });
    cy.typeValueNValidate("AutoTest", "Bucket Name");

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.contains(
        "Required parameter 'File Path' is missing.",
      );
    });
    cy.typeValueNValidate("Auto", "File Path");

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body.split("(")[0].trim()).to.be.oneOf([
        "The specified bucket does not exist",
        "The specified bucket is not valid.",
      ]);
    });

    cy.typeValueNValidate("assets-test.appsmith.com", "Bucket Name");

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.contain(
        "The specified key does not exist.",
      );
    });

    cy.typeValueNValidate("Autofile", "File Path");

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.contain(
        "The specified key does not exist.",
      );
    });

    cy.typeValueNValidate("AutoFile", "File Path");
    cy.validateNSelectDropdown("File Data Type", "Base64", "Text / Binary");

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body.fileData).to.not.eq(
        "Hi, this is Automation script adding File!",
      );
    });

    cy.validateNSelectDropdown("Base64 Encode File - Yes/No", "Yes", "No");
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body.fileData).to.eq(
        "Hi, this is Automation script adding File!",
      );
    });

    cy.deleteEntitybyName("ReadFileQuery");
  });

  it("5. Validate List Files in bucket command for new file, Verify possible error msgs, run & delete the query", () => {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.renameWithInPane("ListFilesQuery");
    cy.validateNSelectDropdown("Commands", "List files in bucket");

    cy.onlyQueryRun();
    cy.wait("@postExecute").should(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.contains(
        "Mandatory parameter 'Bucket Name' is missing.",
      );
    });
    cy.typeValueNValidate("assets-test.appsmith.com", "Bucket Name");

    cy.typeValueNValidate("Auto", "Prefix");
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body[0].fileName).to.contains("Auto");
      expect(response.body.data.body[0].url).to.exist;
    });

    cy.typeValueNValidate("AutoFile", "Prefix");
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body[0].fileName).to.contains("Auto");
      expect(response.body.data.body[0].url).to.exist;
      expect(response.body.data.body[0].signedUrl).not.to.exist;
    });

    cy.validateNSelectDropdown("Generate Signed URL", "No", "Yes");
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body[0].fileName).to.contains("Auto");
      expect(response.body.data.body[0].signedUrl).to.exist;
      expect(response.body.data.body[0].url).to.exist;
    });

    cy.validateNSelectDropdown("Generate Un-signed URL", "Yes", "No");
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body[0].fileName).to.contains("Auto");
      expect(response.body.data.body[0].signedUrl).to.exist;
      expect(response.body.data.body[0].url).to.not.exist;
    });

    cy.deleteEntitybyName("ListFilesQuery");
  });

  it("6. Validate Delete file command for new file, Verify possible error msgs, run & delete the query", () => {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.renameWithInPane("DeleteFileQuery");
    cy.validateNSelectDropdown(
      "Commands",
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
    cy.typeValueNValidate("AutoTest", "Bucket Name");

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body).to.contains(
        "Required parameter 'File Path' is missing.",
      );
    });
    cy.typeValueNValidate("Auto", "File Path");

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(false);
      expect(response.body.data.body.split("(")[0].trim()).to.be.oneOf([
        "The specified bucket does not exist",
        "The specified bucket is not valid.",
      ]);
    });

    cy.typeValueNValidate("assets-test.appsmith.com", "Bucket Name");
    cy.typeValueNValidate("AutoFile", "File Path");

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body.status).to.eq("File deleted successfully");
    });

    cy.deleteEntitybyName("DeleteFileQuery");
  });

  it("7. Validate List Files in bucket command after new file is deleted, Verify possible error msgs, run & delete the query", () => {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.renameWithInPane("ListNewFileQuery");
    cy.validateNSelectDropdown("Commands", "List files in bucket");
    cy.typeValueNValidate("assets-test.appsmith.com", "Bucket Name");
    cy.typeValueNValidate("Auto", "Prefix");
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body.length).to.eq(0); //checking that body is empty array
    });
    cy.deleteEntitybyName("ListNewFileQuery");
  });

  it("8. Validate Create a new file in bucket for UI Operations, run & delete the query", () => {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.renameWithInPane("UIOperationNewFileQuery");

    cy.validateNSelectDropdown(
      "Commands",
      "List files in bucket",
      "Create a new file",
    );
    cy.typeValueNValidate("assets-test.appsmith.com", "Bucket Name");
    cy.typeValueNValidate("CRUDNewPageFile", "File Path");
    cy.validateNSelectDropdown("File Data Type", "Base64", "Text / Binary");
    cy.typeValueNValidate(
      '{"data": "Hi, this is Automation script adding file for S3 CRUD New Page validation!"}',
      "Content",
    );

    cy.get(queryLocators.settings).click();
    cy.xpath(queryLocators.queryTimeout)
      .clear()
      .type(30000);
    cy.get(queryLocators.query).click();

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
    });
    cy.deleteEntitybyName("UIOperationNewFileQuery");
  });

  it("9. Verify Search, Delete operations from NewPage UI created in S3 ds & Bug 8686", function() {
    // cy.wrap(Cypress.automation('remote:debugger:protocol', {
    //   command: 'Browser.grantPermissions',
    //   params: {
    //     permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
    //     // make the permission tighter by allowing the current origin only
    //     // like "http://localhost:56978"
    //     origin: window.location.origin,
    //   },
    // }))

    cy.NavigateToDSGeneratePage(datasourceName);

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

    cy.verifyCyclicDependencyError();

    cy.ClickGotIt();

    //Verifying Searching File from UI
    cy.xpath(queryLocators.searchFilefield)
      .type("CRUD")
      .wait(500); //for search to finish
    expect(
      cy.xpath(
        "//div[@data-cy='overlay-comments-wrapper']//span[text()='CRUDNewPageFile']",
      ),
    ).to.exist;

    cy.xpath(
      "//div[@data-cy='overlay-comments-wrapper']//span[text()='CRUDNewPageFile']",
    ).scrollIntoView();

    //Verifying CopyFile URL icon from UI - Browser pop up appearing
    // cy.xpath(queryLocators.copyURLicon).click()
    // cy.window().its('navigator.clipboard').invoke('readText').should('contain', 'CRUDNewPageFile')

    //Verifying DeleteFile icon from UI
    cy.xpath(queryLocators.deleteFileicon).click();
    cy.verifyCyclicDependencyError();

    expect(
      cy.xpath("//span[text()='Are you sure you want to delete the file?']"),
    ).to.exist; //verify Delete File dialog appears
    cy.clickButton("Confirm").wait(1000); //wait for Dlete operation to be successfull

    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
    });

    cy.get("span:contains('CRUDNewPageFile')").should("not.exist"); //verify Deletion of file is success from UI also
  });

  it("10. Validate Deletion of the Newly Created Page", () => {
    cy.NavigateToQueryEditor();
    cy.NavigateToActiveTab();
    cy.contains(".t--datasource-name", datasourceName).click();
    cy.get(".t--delete-datasource").click();

    cy.wait("@deleteDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      409,
    );

    cy.deleteEntitybyName("Assets-test.appsmith.com");
  });

  it("11. Verify 'Add to widget [Widget Suggestion]' functionality - S3", () => {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.renameWithInPane("WidgetSuggestionQuery");
    cy.validateNSelectDropdown("Commands", "List files in bucket");
    cy.typeValueNValidate("assets-test.appsmith.com", "Bucket Name");
    cy.runQuery();
    cy.xpath(queryLocators.suggestedWidgetDropdown)
      .click()
      .wait(1000);
    cy.wait("@updateLayout").then(({ response }) => {
      expect(response.body.data.dsl.children[0].type).to.eq("DROP_DOWN_WIDGET");
    });
    cy.selectEntityByName("WidgetSuggestionQuery");
    cy.get(queryLocators.suggestedTableWidget)
      .click()
      .wait(1000);
    cy.wait("@updateLayout").then(({ response }) => {
      expect(response.body.data.dsl.children[1].type).to.eq("TABLE_WIDGET");
    });
    cy.selectEntityByName("WidgetSuggestionQuery");
    cy.xpath(queryLocators.suggestedWidgetText)
      .click()
      .wait(1000);
    cy.wait("@updateLayout").then(({ response }) => {
      expect(response.body.data.dsl.children[2].type).to.eq("TEXT_WIDGET");
    });
    cy.selectEntityByName("WidgetSuggestionQuery");
    cy.deleteEntitybyName("WidgetSuggestionQuery");
  });

  it("12. Verify 'Connect Widget [snipping]' functionality - S3 ", () => {
    cy.addDsl(dsl);
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.renameWithInPane("SnippingQuery");

    cy.validateNSelectDropdown("Commands", "List files in bucket");
    cy.typeValueNValidate("assets-test.appsmith.com", "Bucket Name");
    cy.runQuery();
    cy.clickButton("Select Widget");
    cy.xpath(queryLocators.snipeableTable)
      .click()
      .wait(1500); //wait for table to load!

    cy.wait("@updateLayout").then(({ response }) => {
      expect(response.body.data.dsl.children[0].widgetName).to.eq("Table1");
      // expect(response.body.data.messages[0]).to.contain(
      //   "will be executed automatically on page load",
      // );
    });
    cy.selectEntityByName("SnippingQuery");
    cy.deleteEntitybyName("Table1");
    cy.deleteEntitybyName("SnippingQuery");
    cy.wait(3000); //waiting for deletion to complete! - else next case fails
  });

  it("11. Deletes the datasource", () => {
    cy.NavigateToQueryEditor();
    cy.NavigateToActiveTab();
    cy.contains(".t--datasource-name", datasourceName).click({ force: true });
    cy.get(".t--delete-datasource").click();

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
