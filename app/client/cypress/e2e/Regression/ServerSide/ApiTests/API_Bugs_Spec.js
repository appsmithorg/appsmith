import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../locators/commonlocators.json");
const testdata = require("../../../../fixtures/testdata.json");
import {
  agHelper,
  locators,
  apiPage,
} from "../../../../support/Objects/ObjectsCore";
import PageList from "../../../../support/Pages/PageList";

describe("Rest Bugs tests", function () {
  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  it("1. Bug 5550: Not able to run APIs in parallel", function () {
    agHelper.AddDsl("apiParallelDsl");
    cy.get(".ads-v2-spinner").should("not.exist");

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

    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
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
    PageList.AddNewPage();
    //Api 1
    apiPage.CreateAndFillApi(
      "https://api.thecatapi.com/v1/images/search",
      "InternalServerErrorApi",
    );
    apiPage.RunAPI(false);
    cy.wait("@postExecuteError");
    cy.get(commonlocators.errorTab).should("be.visible").click({ force: true });
    cy.get(commonlocators.debuggerLabel)
      .invoke("text")
      .then(($text) => {
        expect($text).to.eq("An unexpected error occurred");
      });
  });

  it("3. Bug 4775: No Cyclical dependency when Api returns an error", function () {
    agHelper.AddDsl("apiTableDsl");
    cy.wait(5000); //settling time for dsl!
    cy.get(".ads-v2-spinner").should("not.exist");
    //Api 1
    apiPage.CreateAndFillApi(
      "https://api.coinbase.com/v2/currencies",
      "Currencies",
    );
    apiPage.RunAPI(false);
    cy.ResponseStatusCheck(testdata.successStatusCode);
    EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
    EditorNavigation.SelectEntityByName("Currencies", EntityType.Api);
    apiPage.EnterURL("https://api.coinbase.com/v2/");
    agHelper.Sleep();
    // cy.get(".t--dataSourceField").then(($el) => {
    //   cy.updateCodeInput($el, "https://api.coinbase.com/v2/");
    // });
    apiPage.RunAPI(false);
    agHelper.AssertElementAbsence(
      locators._specificToast("Cyclic dependency found while evaluating"),
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

  it("4. Bug 13515: API Response gets garbled if encoded with gzip", function () {
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

  // this test applies to other fields as well - params and body formdata
  it("5. Bug 25817: Assert that header fields are correctly updated.", function () {
    apiPage.CreateAndFillApi("https://postman-echo.com/gzip", "HeaderTest");
    apiPage.EnterHeader("hello", "world", 0);
    apiPage.EnterHeader("", "", 1);
    agHelper.GetNClick(apiPage._addMoreHeaderFieldButton);
    apiPage.EnterHeader("hey", "there", 2);

    agHelper.RefreshPage();

    apiPage.ValidateHeaderParams({ key: "hello", value: "world" }, 0);
    apiPage.ValidateHeaderParams({ key: "hey", value: "there" }, 1);
  });
});
