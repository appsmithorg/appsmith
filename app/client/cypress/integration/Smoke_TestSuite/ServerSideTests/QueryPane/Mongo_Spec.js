const queryLocators = require("../../../../locators/QueryEditor.json");
const generatePage = require("../../../../locators/GeneratePage.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const formControls = require("../../../../locators/FormControl.json");
import homePage from "../../../../locators/HomePage";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
let ee = ObjectsRegistry.EntityExplorer;

let datasourceName;

describe("Create a query with a mongo datasource, run, save and then delete the query", function() {
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

  it("1. Creates a new Mongo datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MongoDB).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.fillMongoDatasourceForm();
    cy.generateUUID().then((uid) => {
      datasourceName = `Mongo CRUD ds ${uid}`;
      cy.renameDatasource(datasourceName);
    });
    cy.testSaveDatasource();
  });

  it("2. Validate Raw query command, run and then delete the query", function() {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    // cy.get("@getPluginForm").should(
    //   "have.nested.property",
    //   "response.body.responseMeta.status",
    //   200,
    // );

    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "Find Document(s)",
      "Raw",
    );
    cy.typeValueNValidate(
      '{"find": "listingAndReviews","limit": 10}',
      formControls.rawBody,
    );

    // cy.get(".CodeMirror textarea")
    //   .first()
    //   .focus()
    //   .type(`{"find": "listingAndReviews","limit": 10}`, {
    //     parseSpecialCharSequences: false,
    //   });
    // cy.EvaluateCurrentValue(`{"find": "listingAndReviews","limit": 10}`);

    cy.runQuery();
    cy.xpath(queryLocators.countText).should("have.text", "10 Records");
    cy.deleteQueryUsingContext();
  });

  it("3. Validate Find documents command & Run and then delete the query", function() {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.setQueryTimeout(20000);

    //cy.xpath(queryLocators.findDocs).should("exist"); //Verifying update is success or below line
    //cy.expect(queryLocators.findDocs).to.exist;

    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "Find Document(s)",
    );

    cy.typeValueNValidate("listingAndReviews", formControls.mongoCollection);
    cy.runQuery();
    cy.xpath(queryLocators.countText).should("have.text", "10 Records");

    cy.typeValueNValidate("{beds : {$lte: 2}}", formControls.mongoFindQuery);
    cy.runQuery();
    cy.xpath(queryLocators.countText).should("have.text", "10 Records");

    cy.typeValueNValidate(
      "{number_of_reviews: -1}",
      formControls.mongoFindSort,
    ); //sort descending
    cy.runQuery();
    cy.xpath(queryLocators.countText).should("have.text", "10 Records");

    cy.typeValueNValidate(
      "{house_rules: 1, description:1}",
      formControls.mongoFindProjection,
    ); //Projection field
    cy.runQuery();

    cy.typeValueNValidate("5", formControls.mongoFindLimit); //Limit field
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.body[0].description).to.contains(
        "The ideal apartment to visit the magnificent city of Porto and the northern region of Portugal, with family or with a couple of friends",
        "Response is not as expected for Find commmand with multiple conditions",
      );
    });
    cy.xpath(queryLocators.countText).should("have.text", "5 Records");

    cy.typeValueNValidate("2", formControls.mongoFindSkip); //Skip field
    cy.onlyQueryRun();

    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.body[0].description).to.contains(
        "My place is close to the beach, family-friendly activities, great views, and a short drive to art and culture, and restaurants and dining",
        "Response is not as expected for Find commmand with multiple conditions",
      );
    });
    cy.xpath(queryLocators.countText).should("have.text", "5 Records");
    cy.deleteQueryUsingContext();
  });

  it("4. Validate Count command & Run and then delete the query", function() {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    //cy.setQueryTimeout(30000);
    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "Find Document(s)",
      "Count",
    );
    cy.typeValueNValidate("listingAndReviews", formControls.mongoCollection);
    cy.runQuery();
    cy.typeValueNValidate(
      "{guests_included : {$gte: 2}}",
      formControls.mongoCountQuery,
    );
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.body.n).to.be.above(
        0,
        "Response is not as expected for Count commmand",
      );
    });
    cy.deleteQueryUsingContext();
  });

  it("5. Validate Distinct command & Run and then delete the query", function() {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "Find Document(s)",
      "Distinct",
    );
    cy.typeValueNValidate("listingAndReviews", formControls.mongoCollection);
    cy.typeValueNValidate(
      "{price : {$gte: 100}}",
      formControls.mongoDistinctQuery,
    );
    cy.typeValueNValidate("property_type", formControls.mongoDistinctKey);
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.body.values[0]).to.eq(
        "Aparthotel",
        "Response is not as expected for Distint commmand",
      );
    });
    cy.deleteQueryUsingContext();
  });

  it("6. Validate Aggregate command & Run and then delete the query", function() {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "Find Document(s)",
      "Aggregate",
    );

    cy.typeValueNValidate("listingAndReviews", formControls.mongoCollection);
    cy.typeValueNValidate(
      '[{ $project: { count: { $size:"$amenities" }}}]',
      formControls.mongoAggregateArrayOfPipelines,
    );
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ request, response }) => {
      // cy.log(request.method + ": is req.method")
      //expect(request.method).to.equal('POST')
      expect(response.body.data.body[0].count).to.be.above(
        0,
        "Response is not as expected for Aggregate commmand",
      );
      // it is good practice to add message to the assertion
      // expect(req, 'has duration in ms').to.have.property('duration').and.be.a('number')
    });
    cy.deleteQueryUsingContext();
  });

  it("7. Verify generation of NewPage from collection [Select] + Bug 12162", function() {
    //Verifying Select from UI
    cy.NavigateToDSGeneratePage(datasourceName);
    cy.get(generatePage.selectTableDropdown).click();
    cy.get(generatePage.dropdownOption)
      //.first()
      .contains("listingAndReviews")
      // .scrollIntoView()
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

    cy.ClickGotIt();

    //Check if table is loaded & CRUD is success

    cy.get(generatePage.selectedRow).should("exist");
    // cy.get(generatePage.updateBtn)
    //   .closest("button")
    //   .then((selector) => {
    //     cy.get(selector)
    //       .invoke("attr", "class")
    //       .then((classes) => {
    //         cy.log("classes are:" + classes);
    //         expect(classes).not.contain("bp3-disabled");
    //       });
    //   });
  });

  it("8. Validate Deletion of the Newly Created Page", () => {
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
      "ListingAndReviews",
      "Delete",
      "Are you sure?",
    );
  });

  it("9. Bug 7399: Validate Form based & Raw command based templates", function() {
    let id;
    ee.ExpandCollapseEntity(`${datasourceName}`);
    cy.xpath(queryLocators.listingAndReviewContext)
      .invoke("show")
      .click({ force: true });

    cy.xpath("//div[text()='Find']")
      .click()
      .wait(100); //wait for Find form to open
    cy.EvaluatFieldValue(formControls.mongoCollection).then((colData) => {
      let localcolData = colData.replace("{", "").replace("}", "");
      cy.log("Collection value is fieldData: " + localcolData);
      cy.wrap(localcolData).as("colData");
    });
    cy.EvaluatFieldValue(formControls.mongoFindQuery).then((queryData) => {
      let localqueryData = queryData.replace("{", "").replace("}", "");
      id = localqueryData;
      cy.log("Query value is : " + localqueryData);
      cy.wrap(localqueryData).as("queryData");
    });
    cy.EvaluatFieldValue(formControls.mongoFindSort).then((sortData) => {
      let localsortData = sortData.replace("{", "").replace("}", "");
      cy.log("Sort value is : " + localsortData);
      cy.wrap(localsortData).as("sortData");
    });
    cy.EvaluatFieldValue(formControls.mongoFindLimit).then((limitData) => {
      let locallimitData = limitData.replace("{", "").replace("}", "");
      cy.log("Limit value is : " + locallimitData);
      cy.wrap(locallimitData).as("limitData");
    });

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body[0]._id).to.eq(
        id
          .split(":")[1]
          .trim()
          .replace(/['"]+/g, ""),
      );
    });

    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "Find Document(s)",
      "Raw",
    );

    cy.EvaluatFieldValue().then((rawData) => {
      rawData = rawData.replace("{", "").replace("}", "");
      cy.log("rawData value is : " + rawData);
      cy.wrap(rawData).as("rawData");
    });

    cy.all(
      cy.get("@colData"),
      cy.get("@queryData"),
      cy.get("@sortData"),
      cy.get("@limitData"),
      cy.get("@rawData"),
    ).then((values) => {
      expect(values[4].trim()).to.contain(values[0].trim());
      expect(values[4].trim()).to.contain(values[1].trim());
      expect(values[4].trim()).to.contain(values[2].trim());
      expect(values[4].trim()).to.contain(values[3].trim());
    });

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body[0]._id).to.eq(
        id
          .split(":")[1]
          .trim()
          .replace(/['"]+/g, ""),
      );
    });
    cy.CheckAndUnfoldEntityItem("QUERIES/JS");
    cy.actionContextMenuByEntityName("Query1", "Delete", "Are you sure?");
  });

  it("10. Delete the datasource after NewPage deletion is success", () => {
    cy.NavigateToQueryEditor();
    cy.NavigateToActiveTab();
    cy.contains(".t--datasource-name", datasourceName).click();
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

  it("11. Bug 6375: Cyclic Dependency error occurs and the app crashes when the user generate table and chart from mongo query", function() {
    cy.NavigateToHome();
    cy.get(homePage.createNew)
      .first()
      .click({ force: true });
    cy.wait("@createNewApplication").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MongoDB).click({ force: true });
    cy.fillMongoDatasourceForm();

    cy.CheckAndUnfoldEntityItem("DATASOURCES");
    cy.generateUUID().then((uid) => {
      datasourceName = `Mongo Documents ${uid}`;
      cy.renameDatasource(datasourceName);
      cy.wrap(datasourceName).as("dSName");
    });
    cy.testSaveDatasource();

    //Insert documents
    cy.get("@dSName").then((dbName) => {
      cy.NavigateToActiveDSQueryPane(dbName);
    });

    cy.setQueryTimeout(30000);
    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "Find Document(s)",
      "Insert Document(s)",
    );

    cy.typeValueNValidate("NonAsciiTest", formControls.mongoCollection);

    let nonAsciiDoc = `[{"_id":1, "Från" :"Raksha" , "Frõ" :"Active",   "Leverantör":"De Bolster", "Frö":"Basilika - Thai 'Siam Queen'"},
    {"_id":2, "Från" :"Vivek" , "Frõ" :"Active",   "Leverantör":"De Bolster",   "Frö":"Sallad - Oakleaf 'Salad Bowl'"},
    {"_id":3, "Från" :"Prapulla" , "Frõ" :"Active",   "Leverantör":"De Bolster", "Frö":"Sallad - Oakleaf 'Red Salad Bowl'"}]`;

    cy.typeValueNValidate(nonAsciiDoc, formControls.mongoInsertDocuments);
    cy.EvaluateCurrentValue(nonAsciiDoc);
    cy.getEntityName().then((entity) => {
      cy.wrap(entity).as("entity");
    });
    cy.runQuery();

    //Find the Inserted Document
    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "Insert Document(s)",
      "Find Document(s)",
    );

    cy.runQuery();
    cy.xpath(queryLocators.countText).should("have.text", "3 Records");

    cy.get("@dSName").then((dbName) => {
      //cy.CheckAndUnfoldEntityItem("DATASOURCES");
      cy.actionContextMenuByEntityName(dbName, "Refresh");
      // cy.get(`.t--entity.datasource:contains(${dbName})`)
      //   .find(explorer.collapse)
      //   .first()
      //   .click();
    });
    cy.xpath("//div[text()='NonAsciiTest']").should("exist");

    //Verifying Suggested Widgets functionality
    cy.get(queryLocators.suggestedTableWidget)
      .click()
      .wait(1000);
    cy.wait("@updateLayout").then(({ response }) => {
      cy.log("1st Response is :" + JSON.stringify(response.body));
      //expect(response.body.data.dsl.children[0].type).to.eq("TABLE_WIDGET");
    });

    cy.CheckAndUnfoldEntityItem("QUERIES/JS");
    cy.get("@entity").then((entityN) => cy.selectEntityByName(entityN));
    cy.get(queryLocators.suggestedWidgetChart)
      .click()
      .wait(1000);
    cy.wait("@updateLayout").then(({ response }) => {
      cy.log("2nd Response is :" + JSON.stringify(response.body));
      //expect(response.body.data.dsl.children[1].type).to.eq("CHART_WIDGET");
    });

    cy.VerifyErrorMsgAbsence("Cyclic dependency found while evaluating");
    cy.get("@entity").then((entityN) => cy.selectEntityByName(entityN));

    //Update Document - Single Document
    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "Find Document(s)",
      "Update Document(s)",
    );
    cy.typeValueNValidate("{_id: {$eq:1}}", formControls.mongoUpdateManyQuery);
    cy.typeValueNValidate(
      "{$set:{ 'Frõ': 'InActive'}}",
      formControls.mongoUpdateManyUpdate,
    );
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.body.nModified).to.eq(1);
    });

    // //Update Document - All Matching Documents
    // cy.validateNSelectDropdown("Commands", "Find Document(s)", "Update Document(s)");
    // cy.typeValueNValidate("{_id: {$gte:2}}", "Query");
    // cy.typeValueNValidate("{$set:{ 'Frõ': 'InActive'}}", "Update");
    // cy.validateNSelectDropdown("Limit", "Single Document", "All Matching Documents");
    // cy.runQuery()
    // cy.wait("@postExecute").then(({ response }) => {
    //   expect(response.body.data.body.nModified).to.eq(2);
    // });

    // //Verify Updation Successful:
    // cy.validateNSelectDropdown("Commands", "Update Document(s)", "Find Document(s)");
    // cy.runQuery()
    // cy.wait("@postExecute").then(({ response }) => {
    //   expect(response.body.data.body[0].Frõ).to.eq('InActive');
    // });

    //Delete Documents using both Single & Multiple Documents
    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "Update Document(s)",
      "Delete Document(s)",
    );
    cy.typeValueNValidate(
      "{_id : {$eq: 1 }}",
      formControls.mongoDeleteDocumentsQuery,
    );
    cy.ValidateAndSelectDropdownOption(
      formControls.mongoDeleteLimitDropdown,
      "Single Document",
    );
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.body.n).to.eq(1);
    });

    cy.typeValueNValidate(
      "{_id : {$lte: 3 }}",
      formControls.mongoDeleteDocumentsQuery,
    );
    cy.ValidateAndSelectDropdownOption(
      formControls.mongoDeleteLimitDropdown,
      "Single Document",
      "All Matching Documents",
    );
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.body.n).to.eq(2);
    });

    //Verify Deletion is Successful:
    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "Delete Document(s)",
      "Find Document(s)",
    );
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.body.length).to.eq(0); //checking that body is empty array
    });

    //Delete Collection:
    cy.ValidateAndSelectDropdownOption(
      formControls.commandDropdown,
      "Find Document(s)",
      "Raw",
    );
    //cy.get(queryLocators.templateMenu).click();
    cy.typeValueNValidate('{"drop": "NonAsciiTest"}', formControls.rawBody);
    cy.runQuery();
    cy.CheckAndUnfoldEntityItem("DATASOURCES");
    cy.get("@dSName").then((dbName) => {
      cy.actionContextMenuByEntityName(dbName, "Refresh");
    });
    cy.xpath("//div[text()='NonAsciiTest']").should("not.exist"); //validating drop is successful!

    cy.deleteQueryUsingContext();
    cy.CheckAndUnfoldEntityItem("WIDGETS");
    cy.actionContextMenuByEntityName("Table1");
    cy.actionContextMenuByEntityName("Chart1");
    cy.wait(3000); //waiting for deletion to complete! - else next case fails
  });
});
