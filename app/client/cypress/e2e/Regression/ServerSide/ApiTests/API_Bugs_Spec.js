const commonlocators = require("../../../../locators/commonlocators.json");
const testdata = require("../../../../fixtures/testdata.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Rest Bugs tests", function () {
  beforeEach(() => {
    _.agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    _.agHelper.SaveLocalStorageCache();
  });

  it("1. Bug 5550: Not able to run APIs in parallel", function () {
    cy.fixture("apiParallelDsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
    cy.get(".ads-v2-spinner").should("not.exist");

    //Api 1
    _.apiPage.CreateAndFillApi(
      "https://api.thecatapi.com/v1/images/search",
      "CatImage",
    );
    _.agHelper.PressEscape();

    //Api 2
    _.apiPage.CreateAndFillApi(
      "https://dog.ceo/api/breeds/image/random",
      "DogImage",
    );
    _.agHelper.PressEscape();

    //Api 3
    _.apiPage.CreateAndFillApi(
      "http://numbersapi.com/random/math",
      "NumberFact",
    );
    _.agHelper.PressEscape();

    //Api 4
    _.apiPage.CreateAndFillApi(
      "https://www.thecocktaildb.com/api/json/v1/1/search.php?s=margarita",
      "CocktailDB",
    );
    _.agHelper.PressEscape();

    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.agHelper.ClickButton("Invoke APIs!");
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

    cy.get(".t--widget-buttonwidget").scrollIntoView();

    cy.get(".t--widget-textwidget")
      .eq(0)
      .invoke("text")
      .then(($txt) => expect($txt).to.have.length.greaterThan(20));

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

  it("2. Bug 6863: Clicking on 'debug' crashes the appsmith application", function () {
    cy.startErrorRoutes();
    _.entityExplorer.AddNewPage();
    //Api 1
    _.apiPage.CreateAndFillApi(
      "https://api.thecatapi.com/v1/images/search",
      "InternalServerErrorApi",
    );
    _.apiPage.RunAPI(false);
    cy.wait("@postExecuteError");
    cy.get(commonlocators.errorTab).should("be.visible").click({ force: true });
    cy.get(commonlocators.debuggerLabel)
      .invoke("text")
      .then(($text) => {
        expect($text).to.eq("An unexpected error occurred");
      });
  });

  it("3. Bug 4775: No Cyclical dependency when Api returns an error", function () {
    cy.fixture("apiTableDsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
    cy.wait(5000); //settling time for dsl!
    cy.get(".ads-v2-spinner").should("not.exist");
    //Api 1
    _.apiPage.CreateAndFillApi(
      "https://api.coinbase.com/v2/currencies",
      "Currencies",
    );
    _.apiPage.RunAPI(false);
    cy.ResponseStatusCheck(testdata.successStatusCode);
    _.entityExplorer.SelectEntityByName("Table1", "Widgets");
    _.entityExplorer.SelectEntityByName("Currencies", "Queries/JS");
    _.apiPage.EnterURL("https://api.coinbase.com/v2/");
    _.agHelper.Sleep();
    // cy.get(".t--dataSourceField").then(($el) => {
    //   cy.updateCodeInput($el, "https://api.coinbase.com/v2/");
    // });
    _.apiPage.RunAPI(false);
    _.agHelper.AssertElementAbsence(
      _.locators._specificToast("Cyclic dependency found while evaluating"),
    );
    cy.ResponseStatusCheck("404 NOT_FOUND");
    cy.get(commonlocators.errorTab).should("be.visible").click({ force: true });
    cy.get(commonlocators.debuggerToggle).click();
    cy.wait(1000);
    cy.get(commonlocators.debuggerLabel)
      .invoke("text")
      .then(($text) => {
        expect($text).contains("Not found");
      });
  });

  it("Bug 13515: API Response gets garbled if encoded with gzip", function () {
    _.apiPage.CreateAndFillApi(
      "https://postman-echo.com/gzip",
      "GarbledResponseAPI",
      30000,
    );
    _.apiPage.RunAPI(false);
    _.apiPage.SelectPaneTab("Response");
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
