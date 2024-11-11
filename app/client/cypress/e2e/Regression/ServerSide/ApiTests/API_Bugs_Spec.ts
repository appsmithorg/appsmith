import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

const commonlocators = require("../../../../locators/commonlocators.json");
const testdata = require("../../../../fixtures/testdata.json");
import {
  agHelper,
  locators,
  apiPage,
  dataManager,
  entityExplorer,
  draggableWidgets,
  propPane,
  table,
} from "../../../../support/Objects/ObjectsCore";
import PageList from "../../../../support/Pages/PageList";

describe(
  "Rest Bugs tests",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
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
        dataManager.dsValues[dataManager.defaultEnviorment].flowerImageUrl1,
        "FlowerImage1",
      );
      agHelper.PressEscape();

      //Api 2
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].flowerImageUrl2,
        "FlowerImage2",
      );
      agHelper.PressEscape();

      //Api 3
      apiPage.CreateAndFillApi(
        "http://host.docker.internal:8000/a.txt",
        "SampleText",
      );
      agHelper.PressEscape();

      //Api 4
      apiPage.CreateAndFillApi(
        "http://host.docker.internal:5001/v1/dynamicrecords/getrecordsArray",
        "dynamicRecords",
      );
      agHelper.PressEscape();

      PageLeftPane.switchSegment(PagePaneSegment.UI);
      agHelper.ClickButton("Invoke APIs!");
      cy.wait(12000); // for all api calls to complete!

      //Flower1 Image
      cy.xpath("//img/parent::div")
        .eq(0)
        .find("img")
        .invoke("attr", "src")
        .then(($src) => {
          expect($src).not.eq(
            "http://host.docker.internal:4200/clouddefaultImage.png",
          );
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

      //Flower2 Image
      cy.xpath("//img/parent::div")
        .eq(1)
        .find("img")
        .invoke("attr", "src")
        .then(($src) => {
          expect($src).not.eq(
            "http://host.docker.internal:4200/clouddefaultImage.png",
          );
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
          expect($src).not.eq(
            "http://host.docker.internal:4200/clouddefaultImage.png",
          );
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
        dataManager.dsValues[dataManager.defaultEnviorment].flowerImageUrl1,
        "InternalServerErrorApi",
      );
      apiPage.RunAPI(false);
      cy.wait("@postExecuteError");
      cy.get(commonlocators.errorTab)
        .should("be.visible")
        .click({ force: true });
      cy.get(commonlocators.debuggerLabel)
        .invoke("text")
        .then(($text) => {
          expect($text).to.eq("An unexpected error occurred");
        });
    });

    it("3. Bug 4775: No Cyclical dependency when Api returns an error", function () {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE);
      propPane.EnterJSContext("Table data", "{{MockApi.data}}");
      //Api 1
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
        "MockApi",
      );
      apiPage.RunAPI();
      cy.ResponseStatusCheck(testdata.successStatusCode);
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      table.WaitUntilTableLoad(0, 0, "v2");

      EditorNavigation.SelectEntityByName("MockApi", EntityType.Api);
      apiPage.EnterURL(
        dataManager.dsValues[dataManager.defaultEnviorment].mockHttpCodeUrl +
          "404",
      );
      apiPage.RunAPI(false);
      agHelper.AssertElementAbsence(
        locators._specificToast("Cyclic dependency found while evaluating"),
      );
      cy.ResponseStatusCheck("404 NOT_FOUND");
      agHelper.GetNClick(commonlocators.errorTab);
      agHelper.GetNClick(commonlocators.debuggerToggle);
      cy.get(commonlocators.debuggerLabel)
        .invoke("text")
        .then(($text) => {
          expect($text.toLowerCase()).contains("Not Found".toLowerCase());
        });
    });

    it("4. Bug 13515: API Response gets garbled if encoded with gzip", function () {
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockGzipApi,
        "GarbledResponseAPI",
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
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockGzipApi,
        "HeaderTest",
      );
      apiPage.EnterHeader("hello", "world", 0);
      apiPage.EnterHeader("", "", 1);
      agHelper.GetNClick(apiPage._addMoreHeaderFieldButton);
      apiPage.EnterHeader("hey", "there", 2);

      agHelper.RefreshPage();

      apiPage.ValidateHeaderParams({ key: "hello", value: "world" }, 0);
      apiPage.ValidateHeaderParams({ key: "hey", value: "there" }, 1);
    });
  },
);
