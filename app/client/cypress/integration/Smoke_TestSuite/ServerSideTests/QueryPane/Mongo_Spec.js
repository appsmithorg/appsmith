const queryLocators = require("../../../../locators/QueryEditor.json");
const generatePage = require("../../../../locators/GeneratePage.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");

let datasourceName, queryName;

describe("Create a query with a mongo datasource, run, save and then delete the query", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  afterEach(() => {
    if (queryName) cy.deleteEntitybyName(queryName);
  });

  it("1. Creates a new Mongo datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.MongoDB).click();
    cy.getPluginFormsAndCreateDatasource();
    cy.fillMongoDatasourceForm();
    cy.testSaveDatasource();
    cy.generateUUID().then((uid) => {
      datasourceName = `Mongo CRUD ds ${uid}`;
      cy.renameDatasource(datasourceName);
    });
  });

  it("2. Validate Raw query command, run and then delete the query", function() {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    queryName = "RawQuery";
    cy.renameWithInPane(queryName);

    // cy.get("@getPluginForm").should(
    //   "have.nested.property",
    //   "response.body.responseMeta.status",
    //   200,
    // );

    cy.validateNSelectDropdown("Commands", "Find Document(s)", "Raw");

    cy.get(queryLocators.templateMenu).click();
    cy.typeValueNValidate('{"find": "listingsAndReviews","limit": 10}');

    // cy.get(".CodeMirror textarea")
    //   .first()
    //   .focus()
    //   .type(`{"find": "listingsAndReviews","limit": 10}`, {
    //     parseSpecialCharSequences: false,
    //   });
    // cy.EvaluateCurrentValue(`{"find": "listingsAndReviews","limit": 10}`);

    cy.runQuery(); //exeute actions & 200 response is verified in this method
  });

  it("3. Validate Find documents command & Run and then delete the query", function() {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    queryName = "FindQuery";
    cy.renameWithInPane(queryName);

    //cy.xpath(queryLocators.findDocs).should("exist"); //Verifying update is success or below line
    //cy.expect(queryLocators.findDocs).to.exist;

    cy.validateNSelectDropdown("Commands", "Find Document(s)");

    cy.typeValueNValidate("listingsAndReviews", "Collection");
    cy.runQuery(); //exeute actions - 200 response is verified in this method
    cy.xpath(queryLocators.countText).should("have.text", "10 Records");

    cy.typeValueNValidate("{beds : {$lte: 2}}", "Query");
    cy.runQuery(); //exeute actions - 200 response is verified in this method
    cy.xpath(queryLocators.countText).should("have.text", "10 Records");

    cy.typeValueNValidate("{number_of_reviews: -1}", "Sort"); //sort descending
    cy.runQuery(); //exeute actions - 200 response is verified in this method
    cy.xpath(queryLocators.countText).should("have.text", "10 Records");

    cy.typeValueNValidate("{house_rules: 1, description:1}", "Projection"); //Projection field
    cy.runQuery(); //exeute actions - 200 response is verified in this method

    cy.typeValueNValidate("5", "Limit"); //Limit field
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.body[0].house_rules).to.contains(
        "There will be a packet with house rules in the unit",
        "Response is not as expected for Aggregate commmand",
      );
    });
    cy.xpath(queryLocators.countText).should("have.text", "5 Records");

    cy.typeValueNValidate("2", "Skip"); //Skip field
    cy.onlyQueryRun();

    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.body[0].house_rules).to.contains(
        "Airbnb provides recommended to know the following information",
        "Response is not as expected for Aggregate commmand",
      );
    });
    cy.xpath(queryLocators.countText).should("have.text", "5 Records");
  });

  it("4. Validate Count command & Run and then delete the query", function() {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    queryName = "CountQuery";
    cy.renameWithInPane(queryName);
    cy.validateNSelectDropdown("Commands", "Find Document(s)", "Count");
    cy.typeValueNValidate("listingsAndReviews", "Collection");
    cy.runQuery();
    cy.typeValueNValidate("{beds : {$lte: 2}}", "Query");
    cy.runQuery(); //exeute actions - 200 response is verified in this method
  });

  it("5. Validate Distinct command & Run and then delete the query", function() {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    queryName = "DistinctQuery";
    cy.renameWithInPane(queryName);
    cy.validateNSelectDropdown("Commands", "Find Document(s)", "Distinct");
    cy.typeValueNValidate("listingsAndReviews", "Collection");
    cy.typeValueNValidate("{beds : {$lte: 2}}", "Query");
    cy.typeValueNValidate("property_type", "Key");
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.body.values[0]).to.eq(
        "Aparthotel",
        "Response is not as expected for Distint commmand",
      );
    });
  });

  it("6. Validate Aggregate command & Run and then delete the query", function() {
    cy.NavigateToActiveDSQueryPane(datasourceName);
    queryName = "AggregateQuery";
    cy.renameWithInPane(queryName);
    cy.validateNSelectDropdown("Commands", "Find Document(s)", "Aggregate");
    cy.typeValueNValidate("listingsAndReviews", "Collection");
    cy.typeValueNValidate(
      '[{ $project: { count: { $size:"$amenities" }}}]',
      "Array of Pipelines",
    );
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ request, response }) => {
      // cy.log(request.method + ": is req.method")
      //expect(request.method).to.equal('POST')
      expect(response.body.data.body[0].count).to.eq(
        12,
        "Response is not as expected for Aggregate commmand",
      );
      // it is good practice to add message to the assertion
      // expect(req, 'has duration in ms').to.have.property('duration').and.be.a('number')
    });
  });

  it("7. Verify generation of NewPage from collection [Select]", function() {
    queryName = "";
    //Verifying Select from UI
    cy.NavigateToDSGeneratePage(datasourceName);
    cy.get(generatePage.selectTableDropdown).click();
    cy.get(generatePage.dropdownOption)
      .first()
      // .contains("listingsAndReviews")
      // .scrollIntoView()
      // .should("be.visible")
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
  });

  it("8. Validate Deletion of the Newly Created Page", () => {
    queryName = "ListingsAndReviews";
    cy.NavigateToQueryEditor();
    cy.NavigateToActiveTab();
    cy.contains(".t--datasource-name", datasourceName).click();
    cy.get(".t--delete-datasource").click();
    cy.wait("@deleteDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      409,
    );
  });

  it("9. Bug 7399: Validate Form based & Raw command based templates", function() {
    queryName = "Query1";
    let id;
    cy.NavigateToActiveDSQueryPane(datasourceName);
    cy.validateNSelectDropdown("Commands", "Find Document(s)");
    cy.xpath(queryLocators.mongoFormFind).click({ force: true });
    cy.xpath("//div[text()='Find']")
      .click()
      .wait(100); //wait for Find form to open
    cy.EvaluatFieldValue("Collection").then((colData) => {
      colData = colData.replace("{", "").replace("}", "");
      cy.log("Collection value is fieldData: " + colData);
      cy.wrap(colData).as("colData");
    });
    cy.EvaluatFieldValue("Query").then((queryData) => {
      queryData = queryData.replace("{", "").replace("}", "");
      id = queryData;
      cy.log("Query value is : " + queryData);
      cy.wrap(queryData).as("queryData");
    });
    cy.EvaluatFieldValue("Sort").then((sortData) => {
      sortData = sortData.replace("{", "").replace("}", "");
      cy.log("Sort value is : " + sortData);
      cy.wrap(sortData).as("sortData");
    });
    cy.EvaluatFieldValue("Limit").then((limitData) => {
      limitData = limitData.replace("{", "").replace("}", "");
      cy.log("Limit value is : " + limitData);
      cy.wrap(limitData).as("limitData");
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

    cy.validateNSelectDropdown("Commands", "Find Document(s)", "Raw");
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

    cy.deleteEntitybyName("Query2");
  });

  it("10. Delete the datasource after NewPage deletion is success", () => {
    queryName = "";
    cy.NavigateToQueryEditor();
    cy.NavigateToActiveTab();
    cy.contains(".t--datasource-name", datasourceName).click();
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
