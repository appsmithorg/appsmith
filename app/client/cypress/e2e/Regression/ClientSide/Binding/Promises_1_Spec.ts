import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  apiPage = ObjectsRegistry.ApiPage,
  deployMode = ObjectsRegistry.DeployMode,
  propPane = ObjectsRegistry.PropertyPane;

describe("Validate basic Promises", () => {
  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  it("1. Verify Async Await in direct Promises", () => {
    agHelper.AddDsl("promisesBtnDsl", locator._buttonByText("Submit"));
    apiPage.CreateAndFillApi("https://randomuser.me/api/", "RandomUser", 30000);
    apiPage.CreateAndFillApi(
      "https://api.genderize.io?name={{this.params.country}}",
      "Genderize",
      30000,
    );
    apiPage.ValidateQueryParams({
      key: "name",
      value: "{{this.params.country}}",
    }); // verifies Bug 10055
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.EnterJSContext(
      "onClick",
      `{{(async function(){
          const user = await RandomUser.run();
          const gender = await Genderize.run({ country: user.results[0].location.country });
          await storeValue("Gender", gender);
          await showAlert("Your country is " + JSON.stringify(appsmith.store.Gender.name) + "You could be a " + JSON.stringify(appsmith.store.Gender.gender), 'warning');
        })()}}`,
    );
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    agHelper.AssertElementLength(locator._toastMsg, 1);
    agHelper.GetNAssertContains(
      locator._toastMsg,
      /Your country is|failed to execute/g,
    );

    //Since sometimes api is failing & no 2nd toast in that case
    // cy.get(locator._toastMsg)
    //   .last()
    //   .contains(/male|female|null/g);
  });

  it("2. Verify .then & .catch via direct Promises", () => {
    deployMode.NavigateBacktoEditor();
    agHelper.AddDsl("promisesBtnImgDsl", locator._buttonByText("Submit"));
    apiPage.CreateAndFillApi(
      "https://picsum.photos/200/300",
      "RandomImy",
      30000,
    );
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.EnterJSContext(
      "onClick",
      `{{
            (function () {
          return RandomImy.run()
            .then(() => showAlert("You have a beautiful picture", 'success'))
            .catch(() => showAlert('Oops!', 'error'))
        })()
          }}`,
    );
    EditorNavigation.SelectEntityByName("Image1", EntityType.Widget);
    propPane.UpdatePropertyFieldValue("Image", `{{RandomImy.data}}`);
    agHelper.ValidateToastMessage(
      "will be executed automatically on page load",
    );
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    agHelper.GetNAssertContains(
      locator._toastMsg,
      /You have a beautiful picture|Oops!/g,
    );
  });

  it("3. Verify .then & .catch via JS Objects in Promises", () => {
    deployMode.NavigateBacktoEditor();
    agHelper.AddDsl("promisesBtnDsl", locator._buttonByText("Submit"));
    apiPage.CreateAndFillApi(
      "https://favqs.com/api/qotd",
      "InspiringQuotes",
      30000,
    );
    jsEditor.CreateJSObject(`const user = 'You';
return InspiringQuotes.run().then((res) => { showAlert("Today's quote for " + user + " is " + JSON.stringify(res.quote.body), 'success') }).catch(() => showAlert("Unable to fetch quote for " + user, 'warning'))`);
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    cy.get("@jsObjName").then((jsObjName) => {
      propPane.EnterJSContext("onClick", "{{" + jsObjName + ".myFun1()}}");
    });
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    //agHelper.ValidateToastMessage("Today's quote for You")
    agHelper
      .GetNAssertContains(
        locator._toastMsg,
        /Today's quote for You|Unable to fetch quote for/g,
      )
      .then(($ele: string | JQuery<HTMLElement>) =>
        agHelper.AssertElementLength($ele, 1),
      );
  });

  it("4. Verify Promise.race via direct Promises", () => {
    deployMode.NavigateBacktoEditor();
    agHelper.AddDsl("promisesBtnDsl", locator._buttonByText("Submit"));
    apiPage.CreateAndFillApi(
      "https://api.agify.io?name={{this.params.person}}",
      "Agify",
      30000,
    );
    apiPage.ValidateQueryParams({
      key: "name",
      value: "{{this.params.person}}",
    }); // verifies Bug 10055
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.EnterJSContext(
      "onClick",
      `{{ Promise.race([Agify.run({ person: 'Melinda' }), Agify.run({ person: 'Trump' })]).then((res) => { showAlert('Winner is ' + JSON.stringify(res.name), 'success') }) }} `,
    );
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    agHelper
      .AssertElementLength(locator._toastMsg, 1)
      .then(($ele: string | JQuery<HTMLElement>) =>
        agHelper.GetNAssertContains($ele, /Melinda|Trump/g),
      );
  });

  it("5. Verify maintaining context via direct Promises", () => {
    deployMode.NavigateBacktoEditor();
    agHelper.AddDsl("promisesBtnListDsl", locator._buttonByText("Submit"));
    apiPage.CreateAndFillApi(
      "https://api.jikan.moe/v4/anime?q={{this.params.name}}",
      "GetAnime",
      30000,
    );
    EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
    propPane.UpdatePropertyFieldValue(
      "Items",
      `[{
        "name": {{ GetAnime.data.data[0].title }},
      "img": {{GetAnime.data.data[0].images.jpg.image_url}},
      "synopsis": {{ GetAnime.data.data[0].synopsis }}
            },
      {
        "name": {{ GetAnime.data.data[3].title }},
        "img": {{GetAnime.data.data[3].images.jpg.image_url}},
        "synopsis": {{ GetAnime.data.data[3].synopsis }}
      },
      {
        "name": {{ GetAnime.data.data[2].title }},
        "img": {{GetAnime.data.data[2].images.jpg.image_url}},
        "synopsis": {{ GetAnime.data.data[2].synopsis }}
      }]`,
    );
    agHelper.ValidateToastMessage(
      "will be executed automatically on page load",
    ); //Validating 'Run API on Page Load' is set once api response is mapped
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.EnterJSContext(
      "onClick",
      `{{
    (function () {
      const anime = "fruits basket : the final";
      return GetAnime.run({ name: anime })
        .then(() => showAlert("Showing results for : " + anime, 'success'))
    })()
  }}`,
    );
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    agHelper.WaitUntilEleAppear(
      locator._specificToast("Showing results for : fruits basket : the final"),
    );
  });

  it("6: Verify Promise.all via direct Promises", () => {
    deployMode.NavigateBacktoEditor();
    agHelper.AddDsl("promisesBtnDsl", locator._buttonByText("Submit"));
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.EnterJSContext(
      "onClick",
      `{{
    (function () {
      let agifyy = [];
      let animals = ['cat', 'dog', 'camel', 'rabbit', 'rat'];
      for (let step = 0; step < 5; step++) {
        agifyy.push(Agify.run({ person: animals[step].toString() }))
      }
      return Promise.all(agifyy)
        .then((responses) => showAlert(responses.map((res) => res.name).join(',')))
    })()
  }} `,
    );
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    agHelper.ValidateToastMessage("cat,dog,camel,rabbit,rat");
  });

  it("7. Bug 10150: Verify Promise.all via JSObjects", () => {
    deployMode.NavigateBacktoEditor();
    const date = new Date().toDateString();
    agHelper.AddDsl("promisesBtnDsl", locator._buttonByText("Submit"));
    jsEditor.CreateJSObject(`let allFuncs = [Genderize.run({ country: 'India' }),
RandomUser.run(),
GetAnime.run({ name: 'Gintama' }),
InspiringQuotes.run(),
Agify.run({ person: 'Scripty' }),
RandomImy.run()
]
showAlert("Running all api's", "warning");
return Promise.all(allFuncs).then(() =>
showAlert("Wonderful! all apis executed", "success")).catch(() => showAlert("Please check your api's again", "error")); `);

    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    cy.get("@jsObjName").then((jsObjName) => {
      propPane.EnterJSContext(
        "onClick",
        "{{storeValue('date', Date()).then(() => { showAlert(appsmith.store.date, 'success'); return " +
          jsObjName +
          ".myFun1()})}}",
      );
    });
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    //agHelper.AssertElementLength(locator._toastMsg, 3); //Below incases of some api's failure
    agHelper.WaitUntilEleAppear(locator._toastMsg);
    agHelper
      .GetElementLength(locator._toastMsg)
      .then(($len) => expect($len).to.be.at.least(2));
    agHelper.ValidateToastMessage(date, 0);
    agHelper.ValidateToastMessage("Running all api's", 1);
    agHelper.AssertContains(/Wonderful|Please check/g);
  });

  it("8. Bug 9782: Verify .then & .catch (show alert should trigger) via JS Objects without return keyword", () => {
    deployMode.NavigateBacktoEditor();
    agHelper.AddDsl("promisesBtnDsl");
    jsEditor.CreateJSObject(`const user = 'You';
InspiringQuotes.run().then((res) => { showAlert("Today's quote for " + user + " is " + JSON.stringify(res.quote.body), 'success') }).catch(() => showAlert("Unable to fetch quote for " + user, 'warning'))`);
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    cy.get("@jsObjName").then((jsObjName) => {
      propPane.EnterJSContext("onClick", "{{" + jsObjName + ".myFun1()}}");
    });
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    agHelper.Sleep(1000);
    agHelper
      .GetNAssertContains(
        locator._toastMsg,
        /Today's quote for You|Unable to fetch quote for/g,
      )
      .then(($ele: string | JQuery<HTMLElement>) =>
        agHelper.AssertElementLength($ele, 1),
      );
  });
});
