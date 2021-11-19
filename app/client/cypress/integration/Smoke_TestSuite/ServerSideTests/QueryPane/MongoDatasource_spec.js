const queryLocators = require("../../../../locators/QueryEditor.json");
const generatePage = require("../../../../locators/GeneratePage.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");

let datasourceName;

describe("Create a query with a mongo datasource, run, save and then delete the query", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
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

  it("2. Validate Raw query command, run, save and then delete the query", function() {
    cy.NavigateToActiveDSQueryPane(datasourceName);

    // cy.get("@getPluginForm").should(
    //   "have.nested.property",
    //   "response.body.responseMeta.status",
    //   200,
    // );

    cy.xpath('//div[contains(text(),"Find Document(s)")]').click({
      force: true,
    });
    cy.xpath('//div[contains(text(),"Raw")]').click({ force: true });
    cy.get(queryLocators.templateMenu).click();
    cy.get(".CodeMirror textarea")
      .first()
      .focus()
      .type(`{"find": "listingsAndReviews","limit": 10}`, {
        parseSpecialCharSequences: false,
      });

    cy.EvaluateCurrentValue(`{"find": "listingsAndReviews","limit": 10}`);
    cy.runAndDeleteQuery();
  });

  it("3. Validate Find documents command & Run and then delete the query", function() {
    //datasourceName = 'Mongo CRUD ds 09e54713'
    cy.NavigateToActiveDSQueryPane(datasourceName);

    //cy.xpath(queryLocators.findDocs).should("exist"); //Verifying update is success or below line
    cy.expect(queryLocators.findDocs).to.exist;

    cy.xpath(queryLocators.collectionField).type("listingsAndReviews");
    cy.EvaluateCurrentValue("listingsAndReviews");
    cy.runQuery(); //exeute actions - 200 response is verified in this method
    cy.xpath(queryLocators.countText).should("have.text", "10 Records");

    cy.xpath(queryLocators.queryField).type(`{{}beds : {{}$lte: 2}}`);
    cy.EvaluateCurrentValue("{beds : {$lte: 2}}");
    cy.runQuery(); //exeute actions - 200 response is verified in this method
    cy.xpath(queryLocators.countText).should("have.text", "10 Records");

    cy.xpath(queryLocators.sortField).type("{{}number_of_reviews: -1}"); //sort descending
    cy.EvaluateCurrentValue("{number_of_reviews: -1}");
    cy.runQuery(); //exeute actions - 200 response is verified in this method
    cy.xpath(queryLocators.countText).should("have.text", "10 Records");

    cy.xpath(queryLocators.projectionField).type(
      "{{}house_rules: 1, description:1}",
    ); //Projection field
    cy.EvaluateCurrentValue("{house_rules: 1, description:1}");
    cy.runQuery(); //exeute actions - 200 response is verified in this method

    cy.xpath(queryLocators.limitField).type("5"); //Projection field
    cy.EvaluateCurrentValue("5");
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.body[0].house_rules).to.contains(
        "There will be a packet with house rules in the unit",
        "Response is not as expected for Aggregate commmand",
      );
    });

    cy.xpath(queryLocators.countText).should("have.text", "5 Records");
    cy.xpath(queryLocators.skipField).type("2"); //Skip field
    cy.EvaluateCurrentValue("2");
    cy.onlyQueryRun();

    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.body[0].house_rules).to.contains(
        "Airbnb provides recommended to know the following information",
        "Response is not as expected for Aggregate commmand",
      );
    });
    cy.xpath(queryLocators.countText).should("have.text", "5 Records");

    cy.deleteQueryUsingContext();
  });

  it("4. Validate Count command & Run and then delete the query", function() {
    cy.NavigateToActiveDSQueryPane(datasourceName);

    cy.xpath('//div[contains(text(),"Find Document(s)")]').click({
      force: true,
    });
    cy.xpath('//div[contains(text(),"Count")]').click({ force: true });

    cy.xpath(queryLocators.collectionField).type("listingsAndReviews");
    cy.EvaluateCurrentValue("listingsAndReviews");
    cy.runQuery();

    cy.xpath(queryLocators.queryField).type(`{{}beds : {{}$lte: 2}}`);
    cy.EvaluateCurrentValue("{beds : {$lte: 2}}");
    cy.runQuery(); //exeute actions - 200 response is verified in this method

    cy.deleteQueryUsingContext();
  });

  it("5. Validate Distinct command & Run and then delete the query", function() {
    cy.NavigateToActiveDSQueryPane(datasourceName);

    cy.xpath('//div[contains(text(),"Find Document(s)")]').click({
      force: true,
    });
    cy.xpath('//div[contains(text(),"Distinct")]').click({ force: true });

    cy.xpath(queryLocators.collectionField).type("listingsAndReviews");
    cy.EvaluateCurrentValue("listingsAndReviews");

    cy.xpath(queryLocators.queryField).type(`{{}beds : {{}$lte: 2}}`);
    cy.EvaluateCurrentValue("{beds : {$lte: 2}}");

    cy.xpath(queryLocators.keyField).type(`property_type`);
    cy.EvaluateCurrentValue("property_type");
    //cy.runQuery(); //exeute actions - 200 response is verified in this method

    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ request, response }) => {
      expect(response.body.data.body.values[0]).to.eq(
        "Aparthotel",
        "Response is not as expected for Distint commmand",
      );
    });

    cy.deleteQueryUsingContext();
  });

  it("6. Validate Aggregate command & Run and then delete the query", function() {
    cy.NavigateToActiveDSQueryPane(datasourceName);

    cy.xpath('//div[contains(text(),"Find Document(s)")]').click({
      force: true,
    });
    cy.xpath('//div[contains(text(),"Aggregate")]').click({ force: true });

    cy.xpath(queryLocators.collectionField).type("listingsAndReviews");
    cy.EvaluateCurrentValue("listingsAndReviews");

    cy.xpath(queryLocators.arrayOfPipelinesField).type(
      `[{{} $project: {{} count: {{} $size:"$amenities" }}}]`,
    );
    cy.EvaluateCurrentValue('[{ $project: { count: { $size:"$amenities" }}}]');

    //cy.runQuery(); //exeute actions - 200 response is verified in this method

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

    cy.deleteQueryUsingContext();
  });

  it("7. Verify generation of NewPage from collection [Select]", function() {
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
    cy.NavigateToQueryEditor();
    cy.NavigateToActiveTab();
    cy.contains(".t--datasource-name", datasourceName).click();
    cy.get(".t--delete-datasource").click();

    cy.wait("@deleteDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      409,
    );

    cy.xpath(generatePage.mongonewPageEntityMenu)
      .first()
      .click({ force: true });
    cy.xpath(generatePage.deleteMenuItem).click();
  });

  it("9. Delete the datasource after NewPage deletion is success", () => {
    cy.NavigateToQueryEditor();
    cy.NavigateToActiveTab();
    cy.contains(".t--datasource-name", datasourceName).click();
    cy.get(".t--delete-datasource").click();
    cy.wait("@deleteDatasource").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });
});
