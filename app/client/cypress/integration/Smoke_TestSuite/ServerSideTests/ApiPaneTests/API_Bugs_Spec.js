const commonlocators = require("../../../../locators/commonlocators.json");
const dslParallel = require("../../../../fixtures/apiParallelDsl.json");
const dslTable = require("../../../../fixtures/apiTableDsl.json");
const pages = require("../../../../locators/Pages.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Rest Bugs tests", function() {
  it("Bug 5550: Not able to run APIs in parallel", function() {
    cy.addDsl(dslParallel);

    //Api 1
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("CatImage");
    cy.enterDatasource("https://api.thecatapi.com/v1/images/search");
    cy.wait(1000);

    //Api 2
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("CatFacts");
    cy.enterDatasource(
      "https://cat-fact.herokuapp.com/facts/random?animal_type=cat",
    );
    cy.wait(1000);

    //Api 3
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("DogImage");
    cy.enterDatasource("https://dog.ceo/api/breeds/image/random");
    cy.wait(1000); //important - needed for autosave of API before running

    //Api 4
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("DogFacts");
    cy.enterDatasource(
      "https://cat-fact.herokuapp.com/facts/random?animal_type=dog",
    );
    cy.wait(1000);

    cy.contains(commonlocators.entityName, "Page1").click({ force: true });
    cy.clickButton("Get Facts!");
    cy.wait(12000); // for all api calls to complete!

    cy.wait("@postExecute", { timeout: 8000 }).then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body[0].url.length).to.be.above(0);
    });

    cy.wait("@postExecute", { timeout: 8000 }).then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body.type).to.eq("cat");
    });

    cy.wait("@postExecute", { timeout: 8000 }).then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body.message.length).to.be.above(0);
    });

    cy.wait("@postExecute", { timeout: 8000 }).then(({ response }) => {
      //cy.log("Response is :"+ JSON.stringify(response.body))

      expect(response.body.data.isExecutionSuccess).to.eq(true);
      expect(response.body.data.body.type).to.eq("dog");
    });

    //Spread to check later!
    // cy.wait(['@postExecute', '@postExecute', '@postExecute', '@postExecute'], { timeout: 8000 }).spread(
    //     (postExecute1, postExecute2, postExecute3, postExecute4) => {
    //         expect(postExecute1.body.data.isExecutionSuccess).to.eq(true);
    //         expect(postExecute1.body.data.body.url.length).to.be.above(0);

    //         expect(postExecute2.body.data.isExecutionSuccess).to.eq(true);
    //         expect(postExecute2.body.data.body.type).to.eq('cat');

    //         expect(postExecute3.body.data.isExecutionSuccess).to.eq(true);
    //         expect(postExecute3.body.data.body.message.length).to.be.above(0);

    //         expect(postExecute4.body.data.isExecutionSuccess).to.eq(true);
    //         expect(postExecute4.body.data.body.type).to.eq('dog');

    //     })
  });

  it("Bug 6863: Clicking on 'debug' crashes the appsmith application", function() {
    cy.startErrorRoutes();
    cy.get(pages.AddPage)
      .first()
      .click();
    cy.wait("@createPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    //Api 1
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("InternalServerErrorApi");
    cy.enterDatasource("https://api.thecatapi.com/v1/images/search");
    cy.wait(1000);
    cy.onlyQueryRun();
    cy.wait("@postExecuteError");
    cy.get(commonlocators.debugger)
      .should("be.visible")
      .click({ force: true });
    cy.get(commonlocators.errorTab)
      .should("be.visible")
      .click({ force: true });
    cy.get(commonlocators.debuggerLabel)
      .invoke("text")
      .then(($text) => {
        expect($text).to.eq("Execution failed");
      });
  });

  it("Bug 4775: No Cyclical dependency when Api returns an error", function() {
    cy.addDsl(dslTable);
    //Api 1
    cy.CreateAPI("Currencies");
    cy.enterDatasource("https://api.coinbase.com/v2/currencies");
    cy.WaitAutoSave();
    cy.onlyQueryRun();
    cy.ResponseStatusCheck(testdata.successStatusCode);
    cy.selectEntityByName("WIDGETS");
    cy.selectEntityByName("Table1"); //expand
    cy.selectEntityByName("Table1"); //collapse
    cy.selectEntityByName("Currencies");
    cy.get(".t--dataSourceField").then(($el) => {
      cy.updateCodeInput($el, "https://api.coinbase.com/v2/");
    });
    cy.WaitAutoSave();
    cy.onlyQueryRun();
    cy.VerifyErrorMsgAbsence("Cyclic dependency found while evaluating");
    cy.ResponseStatusCheck("404 NOT_FOUND");
    cy.get(commonlocators.debugger)
      .should("be.visible")
      .click({ force: true });
    cy.get(commonlocators.errorTab)
      .should("be.visible")
      .click({ force: true });
    cy.get(commonlocators.debuggerLabel)
      .invoke("text")
      .then(($text) => {
        expect($text).to.eq("Execution failed with status 404 NOT_FOUND");
      });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
