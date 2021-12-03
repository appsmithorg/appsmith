const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/apiParallelDsl.json");
const testdata = require("../../../../fixtures/testdata.json");
const pages = require("../../../../locators/Pages.json");

describe("Rest Bugs tests", function() {
  it("Bug 5550: Not able to run APIs in parallel", function() {
    cy.addDsl(dsl);

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

    cy.contains(commonlocators.entityName, "Page1").click();
    cy.clickButton("Get Facts!");
    cy.wait(6000); // for all api calls to complete!

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
      //cy.log("4th response is :"+ JSON.stringify(response.body))

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

  afterEach(() => {
    // put your clean up code if any
  });
});
