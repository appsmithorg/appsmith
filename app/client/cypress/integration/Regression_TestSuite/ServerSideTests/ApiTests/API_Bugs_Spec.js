const commonlocators = require("../../../../locators/commonlocators.json");
const dslParallel = require("../../../../fixtures/apiParallelDsl.json");
const dslTable = require("../../../../fixtures/apiTableDsl.json");
const testdata = require("../../../../fixtures/testdata.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let apiPage = ObjectsRegistry.ApiPage,
  agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  locator = ObjectsRegistry.CommonLocators;

describe("Rest Bugs tests", function() {
  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  it("Bug 5550: Not able to run APIs in parallel", function() {
    cy.addDsl(dslParallel);
    cy.wait(8000); //settling time for dsl!
    cy.get(".bp3-spinner").should("not.exist");

    //Api 1
    apiPage.CreateAndFillApi(
      "https://api.thecatapi.com/v1/images/search",
      "CatImage",
    );
    agHelper.PressEscape();

    //Api 2
    apiPage.CreateAndFillApi(
      "https://dog.ceo/api/breeds/image/random",
      "DogImage",
    );
    agHelper.PressEscape();

    //Api 3
    apiPage.CreateAndFillApi("http://numbersapi.com/random/math", "NumberFact");
    agHelper.PressEscape();

    //Api 4
    apiPage.CreateAndFillApi(
      "https://www.thecocktaildb.com/api/json/v1/1/search.php?s=margarita",
      "CocktailDB",
    );
    agHelper.PressEscape();

    ee.SelectEntityByName("Page1", "Pages");
    agHelper.ClickButton("Invoke APIs!");
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
    cy.CreatePage();
    cy.wait("@createPage").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      201,
    );
    //Api 1
    apiPage.CreateAndFillApi(
      "https://api.thecatapi.com/v1/images/search",
      "InternalServerErrorApi",
    );
    apiPage.RunAPI(false);
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
        expect($text).to.eq("An unexpected error occurred");
      });
  });

  it("Bug 4775: No Cyclical dependency when Api returns an error", function() {
    cy.addDsl(dslTable);
    cy.wait(5000); //settling time for dsl!
    cy.get(".bp3-spinner").should("not.exist");
    //Api 1
    apiPage.CreateAndFillApi(
      "https://api.coinbase.com/v2/currencies",
      "Currencies",
    );
    apiPage.RunAPI(false);
    cy.ResponseStatusCheck(testdata.successStatusCode);
    ee.SelectEntityByName("Table1", "Widgets");
    ee.SelectEntityByName("Currencies", "Queries/JS");
    apiPage.EnterURL("https://api.coinbase.com/v2/");
    agHelper.Sleep();
    // cy.get(".t--dataSourceField").then(($el) => {
    //   cy.updateCodeInput($el, "https://api.coinbase.com/v2/");
    // });
    apiPage.RunAPI(false);
    agHelper.AssertElementAbsence(
      locator._specificToast("Cyclic dependency found while evaluating"),
    );
    cy.ResponseStatusCheck("PE-RST-5000");
    cy.get(commonlocators.debugger)
      .should("be.visible")
      .click({ force: true });
    cy.get(commonlocators.errorTab)
      .should("be.visible")
      .click({ force: true });
    cy.get(commonlocators.debuggerLabel)
      .invoke("text")
      .then(($text) => {
        expect($text).to.eq("API execution error");
      });
    cy.get(commonlocators.debuggerToggle).click();
    cy.wait(1000);
    cy.get(commonlocators.debuggerDownStreamErrCode)
      .invoke("text")
      .then(($text) => {
        expect($text).to.eq("[404 NOT_FOUND]");
      });
  });

  it("Bug 13515: API Response gets garbled if encoded with gzip", function() {
    apiPage.CreateAndFillApi(
      "https://postman-echo.com/gzip",
      "GarbledResponseAPI",
      30000,
    );
    apiPage.RunAPI(false);
    apiPage.SelectPaneTab("Response");
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
