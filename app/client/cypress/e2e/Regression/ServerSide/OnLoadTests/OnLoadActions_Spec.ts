import {
  agHelper,
  apiPage,
  assertHelper,
  dataManager,
  deployMode,
  entityExplorer,
  entityItems,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Layout OnLoad Actions tests",
  { tags: ["@tag.PropertyPane", "@tag.JS", "@tag.Sanity"] },
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

    it("2. Bug 8595: OnPageLoad execution - when Query Parmas added via Params tab", function () {
      agHelper.AddDsl("onPageLoadActionsDsl", locators._imageWidget);
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].flowerImageUrl1,
        "RandomFlora",
      );

      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
        "RandomUser",
      );

      apiPage.CreateAndFillApi(
        "https://favqs.com/api/qotd",
        "InspiringQuotes",
        30000,
      );
      apiPage.EnterHeader("dependency", "{{RandomUser.data}}"); //via Params tab

      apiPage.CreateAndFillApi(
        "https://www.boredapi.com/api/activity",
        "Suggestions",
        30000,
      );
      apiPage.EnterHeader("dependency", "{{InspiringQuotes.data}}");

      apiPage.CreateAndFillApi("https://api.genderize.io", "Genderize", 30000);
      apiPage.EnterParams("name", "{{RandomUser.data.results[0].name.first}}"); //via Params tab

      //Adding dependency in right order matters!
      EditorNavigation.SelectEntityByName("Image1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Image", `{{RandomFlora.data}}`);

      EditorNavigation.SelectEntityByName("Image2", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Image",
        `{{RandomUser.data.results[0].picture.large}}`,
      );

      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Text",
        `{{InspiringQuotes.data.quote.body}}\n--\n{{InspiringQuotes.data.quote.author}}\n`,
      );

      EditorNavigation.SelectEntityByName("Text2", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Text",
        `Hi, here is {{RandomUser.data.results[0].name.first}} & I'm {{RandomUser.data.results[0].dob.age}}'yo\nI live in {{RandomUser.data.results[0].location.country}}\nMy Suggestion : {{Suggestions.data.activity}}\n\nI'm {{Genderize.data.gender}}`,
      );

      deployMode.DeployApp(locators._widgetInDeployed("textwidget"), false);
      agHelper.Sleep(5000); //for all api's to ccomplete call!
      assertHelper.AssertNetworkStatus("@getConsolidatedData");

      cy.get("@getConsolidatedData").then(($response: any) => {
        const respBody = JSON.stringify($response.response?.body);
        const { pageWithMigratedDsl } = JSON.parse(respBody)?.data;
        const _randomFlora =
          pageWithMigratedDsl.data.layouts[0].layoutOnLoadActions[0];
        const _randomUser =
          pageWithMigratedDsl.data.layouts[0].layoutOnLoadActions[1];
        const _genderize =
          pageWithMigratedDsl.data.layouts[0].layoutOnLoadActions[2];
        const _suggestions =
          pageWithMigratedDsl.data.layouts[0].layoutOnLoadActions[3];

        expect(JSON.parse(JSON.stringify(_randomFlora))[0]["name"]).to.eq(
          "RandomFlora",
        );
        expect(JSON.parse(JSON.stringify(_randomUser))[0]["name"]).to.eq(
          "RandomUser",
        );
        expect(JSON.parse(JSON.stringify(_genderize))[0]["name"]).to.be.oneOf([
          "Genderize",
          "InspiringQuotes",
        ]);
        expect(JSON.parse(JSON.stringify(_genderize))[1]["name"]).to.be.oneOf([
          "Genderize",
          "InspiringQuotes",
        ]);
        expect(JSON.parse(JSON.stringify(_suggestions))[0]["name"]).to.eq(
          "Suggestions",
        );
      });

      deployMode.NavigateBacktoEditor();
      //Verify if debugger is closed after failure of onpageload actions.issue #22283
      agHelper.AssertElementAbsence(locators._errorTab);
    });

    it("3. Bug 10049, 10055: Dependency not executed in expected order in layoutOnLoadActions when dependency added via URL", function () {
      EditorNavigation.SelectEntityByName("Genderize", EntityType.Api);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Genderize",
        action: "Delete",
        entityType: entityItems.Api,
      });

      apiPage.CreateAndFillApi(
        "https://api.genderize.io?name={{RandomUser.data.results[0].name.first}}",
        "Genderize",
        30000,
        "GET",
        false,
        false,
      );
      apiPage.ValidateQueryParams({
        key: "name",
        value: "{{RandomUser.data.results[0].name.first}}",
      }); // verifies Bug 10055

      deployMode.DeployApp(
        locators._widgetInDeployed("textwidget"),
        false,
        false,
      );
      assertHelper.AssertNetworkStatus("@getConsolidatedData");

      cy.get("@getConsolidatedData").then(($response: any) => {
        const respBody = JSON.stringify($response.response?.body);
        const { pageWithMigratedDsl } = JSON.parse(respBody)?.data;

        const _randomFlora =
          pageWithMigratedDsl.data.layouts[0].layoutOnLoadActions[0];
        const _randomUser =
          pageWithMigratedDsl.data.layouts[0].layoutOnLoadActions[1];
        const _genderize =
          pageWithMigratedDsl.data.layouts[0].layoutOnLoadActions[2];
        const _suggestions =
          pageWithMigratedDsl.data.layouts[0].layoutOnLoadActions[3];

        expect(JSON.parse(JSON.stringify(_randomFlora))[0]["name"]).to.eq(
          "RandomFlora",
        );
        expect(JSON.parse(JSON.stringify(_randomUser))[0]["name"]).to.eq(
          "RandomUser",
        );
        expect(JSON.parse(JSON.stringify(_genderize))[0]["name"]).to.be.oneOf([
          "Genderize",
          "InspiringQuotes",
        ]);
        expect(JSON.parse(JSON.stringify(_genderize))[1]["name"]).to.be.oneOf([
          "Genderize",
          "InspiringQuotes",
        ]);
        expect(JSON.parse(JSON.stringify(_suggestions))[0]["name"]).to.eq(
          "Suggestions",
        );
      });
    });
  },
);
