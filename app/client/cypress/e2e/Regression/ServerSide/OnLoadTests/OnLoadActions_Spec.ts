import {
  agHelper,
  apiPage,
  assertHelper,
  dataManager,
  dataSources,
  deployMode,
  entityExplorer,
  entityItems,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import BottomTabs from "../../../../support/Pages/IDE/BottomTabs";

describe(
  "Layout OnLoad Actions tests",
  { tags: ["@tag.PropertyPane", "@tag.JS", "@tag.Sanity", "@tag.Binding"] },
  function () {
    beforeEach(() => {
      agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      agHelper.SaveLocalStorageCache();
    });

    it("1. Bug 8595: OnPageLoad execution - when No api to run on Pageload", function () {
      agHelper.AddDsl("onPageLoadActionsDsl");
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      cy.url().then((url) => {
        const pageid = agHelper.extractPageIdFromUrl(url);
        expect(pageid).to.not.be.null;
        cy.log(pageid + "page id");
        cy.request("GET", "api/v1/pages/" + pageid).then((response) => {
          const respBody = JSON.stringify(response.body);
          const _emptyResp =
            JSON.parse(respBody).data.layouts[0].layoutOnLoadActions;
          expect(JSON.parse(JSON.stringify(_emptyResp))).to.deep.eq([]);
        });
      });
    });

    //Open Bug: https://github.com/appsmithorg/appsmith/issues/38165
    it.skip("2. Bug 8595: OnPageLoad execution - when Query Parmas added via Params tab", function () {
      agHelper.AddDsl("onPageLoadActionsDsl", locators._imageWidget);
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].flowerImageUrl1,
        "RandomFlora",
      );

      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
        "RandomUser",
      );

      apiPage.RunAPI();
      BottomTabs.response.selectResponseResponseTypeFromMenu("JSON");

      apiPage.CreateAndFillApi(
        "http://host.docker.internal:5001/v1/favqs/qotd",
        "InspiringQuotes",
        30000,
      );
      apiPage.EnterHeader("dependency", "{{RandomUser.data}}"); //via Params tab
      apiPage.RunAPI();
      BottomTabs.response.selectResponseResponseTypeFromMenu("JSON");

      apiPage.CreateAndFillApi(
        "http://host.docker.internal:5001/v1/boredapi/activity",
        "Suggestions",
        30000,
      );
      apiPage.EnterHeader("dependency", "{{InspiringQuotes.data.data}}");
      apiPage.RunAPI();
      BottomTabs.response.selectResponseResponseTypeFromMenu("JSON");

      apiPage.CreateAndFillApi(
        "http://host.docker.internal:5001/v1/genderize/sampledata",
        "Genderize",
        30000,
      );
      apiPage.EnterParams("name", "{{RandomUser.data[0].name}}"); //via Params tab
      apiPage.RunAPI();
      BottomTabs.response.selectResponseResponseTypeFromMenu("JSON");

      //Adding dependency in right order matters!
      EditorNavigation.SelectEntityByName("Image1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Image", `{{RandomFlora.data}}`);

      EditorNavigation.SelectEntityByName("Image2", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Image",
        `{{RandomUser.data[0].avatar}}`,
      );

      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Text",
        `{{InspiringQuotes.data.data.quote.body}}\n--\n{{InspiringQuotes.data.data.quote.author}}\n`,
      );

      EditorNavigation.SelectEntityByName("Text2", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Text",
        `Hi, here is {{RandomUser.data[0].name}} & I'm {{RandomUser.data[0].id}}'yo\nI live in {{RandomUser.data[0].address}}\nMy Suggestion : {{Suggestions.data.data.activity}}\n\nI'm {{Genderize.data.data.gender}}`,
      );

      deployMode.DeployApp(locators._widgetInDeployed("textwidget"), false);
      agHelper.Sleep(5000); //for all api's to ccomplete call!
      assertHelper.AssertNetworkStatus("@getConsolidatedData");

      cy.get("@getConsolidatedData").then(($response: any) => {
        const respBody = JSON.stringify($response.response?.body);
        const { pageWithMigratedDsl } = JSON.parse(respBody)?.data;

        // Extract the layoutOnLoadActions array from the first layout
        const layoutActions =
          pageWithMigratedDsl.data.layouts[0].layoutOnLoadActions;

        // Get individual actions from the array
        const _randomFlora = layoutActions[0][0]; // RandomFlora is the first action in the first array
        const _randomUser = layoutActions[1][0]; // RandomUser is the first action in the second array
        const _inspiringQuotes = layoutActions[2][0]; // InspiringQuotes is the first action in the third array
        const _genderize = layoutActions[3][0]; // Genderize is the first action in the fourth array
        const _suggestions = layoutActions[4][0]; // Suggestions is the first action in the fifth array

        // Assertions for the API names
        expect(_randomFlora.name).to.eq("RandomFlora");
        expect(_randomUser.name).to.eq("RandomUser");

        // Check if the name is either 'Genderize' or 'InspiringQuotes' for this position
        expect(_inspiringQuotes.name).to.eq("InspiringQuotes");
        expect(_genderize.name).to.eq("Genderize");

        expect(_suggestions.name).to.eq("Suggestions");
      });

      deployMode.NavigateBacktoEditor();
      //Verify if debugger is closed after failure of onpageload actions.issue #22283
      agHelper.AssertElementAbsence(locators._errorTab);
    });

    //Open Bug: https://github.com/appsmithorg/appsmith/issues/38165
    it.skip("3. Bug 10049, 10055: Dependency not executed in expected order in layoutOnLoadActions when dependency added via URL", function () {
      EditorNavigation.SelectEntityByName("Genderize", EntityType.Api);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Genderize",
        action: "Delete",
        entityType: entityItems.Api,
      });

      apiPage.CreateAndFillApi(
        "http://host.docker.internal:5001/v1/genderize/sampledata?name={{RandomUser.data[0].name}}",
        "Genderize",
        30000,
        "GET",
        false,
        false,
      );
      apiPage.ValidateQueryParams({
        key: "name",
        value: "{{RandomUser.data[0].name}}",
      }); // verifies Bug 10055
      apiPage.RunAPI();
      BottomTabs.response.selectResponseResponseTypeFromMenu("JSON");

      deployMode.DeployApp(
        locators._widgetInDeployed("textwidget"),
        false,
        false,
      );
      assertHelper.AssertNetworkStatus("@getConsolidatedData");

      cy.get("@getConsolidatedData").then(($response: any) => {
        const respBody = JSON.stringify($response.response?.body);
        const { pageWithMigratedDsl } = JSON.parse(respBody)?.data;

        // Extract layoutOnLoadActions from the first layout
        const layoutActions =
          pageWithMigratedDsl.data.layouts[0].layoutOnLoadActions;

        // Get the individual actions
        const _randomFlora = layoutActions[0][0]; // First item in the first array
        const _randomUser = layoutActions[1][0]; // First item in the second array
        const _inspiringQuotes = layoutActions[2][0]; // First item in the third array
        const _genderize = layoutActions[3][0]; // First item in the fourth array
        const _suggestions = layoutActions[4][0]; // First item in the fifth array

        // Assertions for the API names
        expect(_randomFlora.name).to.eq("RandomFlora");
        expect(_randomUser.name).to.eq("RandomUser");

        // Check if the name is either 'Genderize' or 'InspiringQuotes' for these positions
        expect(_inspiringQuotes.name).to.eq("InspiringQuotes");
        expect(_genderize.name).to.eq("Genderize");

        // Assertions for 'Suggestions'
        expect(_suggestions.name).to.eq("Suggestions");
      });
    });
  },
);
