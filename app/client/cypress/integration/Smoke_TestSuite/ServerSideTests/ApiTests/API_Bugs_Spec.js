const commonlocators = require("../../../../locators/commonlocators.json");
const dslParallel = require("../../../../fixtures/apiParallelDsl.json");
const dslTable = require("../../../../fixtures/apiTableDsl.json");
const pages = require("../../../../locators/Pages.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Rest Bugs tests", function() {
  it("Bug 5550: Not able to run APIs in parallel", function() {
    cy.addDsl(dslParallel);
    cy.wait(8000); //settling time for dsl!
    cy.get(".bp3-spinner").should("not.exist");

    //Api 1
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("CatImage");
    cy.enterDatasource("https://api.thecatapi.com/v1/images/search");
    cy.assertPageSave();
    cy.get("body").click(0, 0);

    //Api 2
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("DogImage");
    cy.enterDatasource("https://dog.ceo/api/breeds/image/random");
    cy.assertPageSave();
    //important - needed for autosave of API before running
    cy.get("body").click(0, 0);

    //Api 3
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("NumberFact");
    cy.enterDatasource("http://numbersapi.com/random/math");
    cy.assertPageSave();
    cy.get("body").click(0, 0);

    //Api 4
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("CocktailDB");
    cy.enterDatasource(
      "https://www.thecocktaildb.com/api/json/v1/1/search.php?s=margarita",
    );
    cy.assertPageSave();
    cy.get("body").click(0, 0);

    cy.contains(commonlocators.entityName, "Page1")
      .click({ force: true })
      .wait(2000);
    cy.clickButton("Invoke APIs!");
    cy.wait(12000); // for all api calls to complete!

    //Cat Image
    cy.xpath("//img/parent::div")
      .eq(0)
      .find("img")
      .invoke("attr", "src")
      .then(($src) => {
        expect($src).not.eq("https://assets.appsmith.com/widgets/default.png");
        //expect($src).contains("cat");
      });

    // cy.wait("@postExecute").then(({ response }) => {
    //   expect(response.body.data.isExecutionSuccess).to.eq(true);
    //   expect(response.body.data.body[0].url.length).to.be.above(0); //Cat image
    // });

    // cy.wait("@postExecute").then(({ response }) => {
    //   expect(response.body.data.isExecutionSuccess).to.eq(true);
    //   expect(response.body.data.body.message.length).to.be.above(0); //Dog Image
    // });

    //Dog Image
    cy.xpath("//img/parent::div")
      .eq(1)
      .find("img")
      .invoke("attr", "src")
      .then(($src) => {
        expect($src).not.eq("https://assets.appsmith.com/widgets/default.png");
        //expect($src).contains("dog");
      });

    // cy.wait("@postExecute").then(({ response }) => {
    //   expect(response.body.data.isExecutionSuccess).to.eq(true);
    //   expect(response.body.data.body.length).to.be.above(0); //Number fact
    // });

    cy.get(".t--draggable-textwidget")
      .eq(0)
      .invoke("text")
      .then(($txt) => expect($txt).to.have.length.greaterThan(25));

    // cy.wait("@postExecute").then(({ response }) => {
    //   //cy.log("Response is :"+ JSON.stringify(response.body))
    //   expect(response.body.data.isExecutionSuccess).to.eq(true);
    //   expect(response.body.data.request.url.length).to.be.above(0); //Cocktail
    // });

    //Cocktail DB

    cy.xpath("//img/parent::div")
      .eq(2)
      .find("img")
      .invoke("attr", "src")
      .then(($src) => {
        expect($src).not.eq("https://assets.appsmith.com/widgets/default.png");
        //expect($src).contains("cocktail");
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
    cy.wait(5000); //settling time for dsl!
    cy.get(".bp3-spinner").should("not.exist");
    //Api 1
    cy.CreateAPI("Currencies");
    cy.enterDatasource("https://api.coinbase.com/v2/currencies");
    cy.WaitAutoSave();
    cy.onlyQueryRun();
    cy.ResponseStatusCheck(testdata.successStatusCode);
    cy.CheckAndUnfoldEntityItem("WIDGETS");
    cy.selectEntityByName("Table1"); //expand
    cy.selectEntityByName("Table1"); //collapse
    cy.CheckAndUnfoldEntityItem("QUERIES/JS");
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

  it("Bug 13515: API Response gets garbled if encoded with gzip", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("GarbledResponseAPI");
    cy.enterDatasource("https://postman-echo.com/gzip");
    cy.wait(1000);
    cy.onlyQueryRun();
    cy.wait("@postExecute").then(({ response }) => {
      expect(response.body.data.isExecutionSuccess).to.eq(true);
      const bodyArr = response.body.data.body;
      expect(bodyArr).to.have.any.keys("gzipped");
    });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
