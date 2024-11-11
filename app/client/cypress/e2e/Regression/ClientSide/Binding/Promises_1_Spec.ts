import {
  agHelper,
  locators,
  jsEditor,
  propPane,
  deployMode,
  apiPage,
  dataManager,
  dataSources,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe("Validate basic Promises", { tags: ["@tag.Binding"] }, () => {
  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  it("1. Verify Async Await in direct Promises", () => {
    agHelper.AddDsl("promisesBtnDsl", locators._buttonByText("Submit"));
    apiPage.CreateAndFillApi(
      dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
      "RandomUser",
    );
    apiPage.CreateAndFillApi(
      dataManager.dsValues[dataManager.defaultEnviorment].mockGenderAge +
        `{{this.params.person}}`,
      "Gender_Age",
    );
    apiPage.ValidateQueryParams({
      key: "name",
      value: "{{this.params.person}}",
    }); // verifies Bug 10055
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.EnterJSContext(
      "onClick",
      `{{(async function(){
          const user = await RandomUser.run();
          const gender = await Gender_Age.run({ person: user[0].name });
          await storeValue("Gender", gender);
          await showAlert("Your name is " + JSON.stringify(appsmith.store.Gender.name) + " You could be a " + JSON.stringify(appsmith.store.Gender.gender), 'warning');
        })()}}`,
    );
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    agHelper.AssertElementLength(locators._toastMsg, 1);
    agHelper.GetNAssertContains(
      locators._toastMsg,
      /Your name is|failed to execute/g,
    );

    //Since sometimes api is failing & no 2nd toast in that case
    // cy.get(locators._toastMsg)
    //   .last()
    //   .contains(/male|female|null/g);
  });

  it("2. Verify .then & .catch via direct Promises", () => {
    deployMode.NavigateBacktoEditor();
    agHelper.AddDsl("promisesBtnImgDsl", locators._buttonByText("Submit"));
    apiPage.CreateAndFillApi(
      "http://host.docker.internal:4200/453-200x300.jpg",
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
      locators._toastMsg,
      /You have a beautiful picture|Oops!/g,
    );
  });

  it("3. Verify .then & .catch via JS Objects in Promises", () => {
    deployMode.NavigateBacktoEditor();
    agHelper.AddDsl("promisesBtnDsl", locators._buttonByText("Submit"));
    apiPage.CreateAndFillApi(
      dataManager.dsValues[dataManager.defaultEnviorment].randomTrumpApi,
      "WhatTrumpThinks",
    );
    jsEditor.CreateJSObject(`const user = 'You';
return WhatTrumpThinks.run().then((res) => { showAlert("Today's Trump quote for " + user + " is " + JSON.stringify(res), 'success') }).catch(() => showAlert("Unable to fetch quote for " + user, 'warning'))`);
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    cy.get("@jsObjName").then((jsObjName) => {
      propPane.EnterJSContext("onClick", "{{" + jsObjName + ".myFun1()}}");
    });
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    //agHelper.ValidateToastMessage("Today's quote for You")
    agHelper
      .GetNAssertContains(
        locators._toastMsg,
        /Today's Trump quote for You|Unable to fetch quote for/g,
      )
      .then(($ele: string | JQuery<HTMLElement>) =>
        agHelper.AssertElementLength($ele, 1),
      );
  });

  it("4. Verify Promise.race via direct Promises", () => {
    deployMode.NavigateBacktoEditor();
    agHelper.AddDsl("promisesBtnDsl", locators._buttonByText("Submit"));
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.EnterJSContext(
      "onClick",
      `{{ Promise.race([Gender_Age.run({ person: 'Melinda' }), Gender_Age.run({ person: 'Trump' })]).then((res) => { showAlert('Winner is ' + JSON.stringify(res.name), 'success') }) }} `,
    );
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    agHelper
      .AssertElementLength(locators._toastMsg, 1)
      .then(($ele: string | JQuery<HTMLElement>) =>
        agHelper.GetNAssertContains($ele, /Melinda|Trump/g),
      );
  });

  it("5. Verify maintaining context via direct Promises", () => {
    deployMode.NavigateBacktoEditor();
    agHelper.AddDsl("promisesBtnListDsl", locators._buttonByText("Submit"));
    apiPage.CreateAndFillApi(
      dataManager.dsValues[dataManager.defaultEnviorment].echoApiUrl,
      "GetAnime",
      10000,
      "POST",
    );
    apiPage.SelectPaneTab("Body");
    apiPage.SelectSubTab("JSON");
    // creating post request using echo
    cy.fixture("TestDataSet1").then(function (dataSet) {
      dataSources.EnterQuery(JSON.stringify(dataSet.GetAnimeResponse));
    });

    EditorNavigation.SelectEntityByName("List1", EntityType.Widget);
    propPane.UpdatePropertyFieldValue(
      "Items",
      `[{
        "name": {{ GetAnime.data.body.data[0].title }},
      "img": {{GetAnime.data.body.data[0].images.jpg.image_url}},
      "synopsis": {{ GetAnime.data.body.data[0].synopsis }}
            },
      {
        "name": {{ GetAnime.data.body.data[3].title }},
        "img": {{GetAnime.data.body.data[3].images.jpg.image_url}},
        "synopsis": {{ GetAnime.body.data.data[3].synopsis }}
      },
      {
        "name": {{ GetAnime.data.body.data[2].title }},
        "img": {{GetAnime.data.body.data[2].images.jpg.image_url}},
        "synopsis": {{ GetAnime.data.body.data[2].synopsis }}
      }]`,
    );
    agHelper.ValidateToastMessage(
      "will be executed automatically on page load",
    ); //Validating 'Run the API on Page Load' is set once api response is mapped
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
      locators._specificToast(
        "Showing results for : fruits basket : the final",
      ),
    );
  });

  it("6: Verify Promise.all via direct Promises", () => {
    deployMode.NavigateBacktoEditor();
    agHelper.AddDsl("promisesBtnDsl", locators._buttonByText("Submit"));
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.EnterJSContext(
      "onClick",
      `{{
    (function () {
      let agifyy = [];
      let animals = ['cat', 'dog', 'camel', 'rabbit', 'rat'];
      for (let step = 0; step < 5; step++) {
        agifyy.push(Gender_Age.run({ person: animals[step].toString() }))
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
    agHelper.AddDsl("promisesBtnDsl", locators._buttonByText("Submit"));
    jsEditor.CreateJSObject(`let allFuncs = [Gender_Age.run({ name: 'India' }),
RandomUser.run(),
GetAnime.run({ name: 'Gintama' }),
WhatTrumpThinks.run(),
Gender_Age.run({ person: 'Scripty' }),
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
    //agHelper.AssertElementLength(locators._toastMsg, 3); //Below incases of some api's failure
    agHelper.WaitUntilEleAppear(locators._toastMsg);
    agHelper
      .GetElementLength(locators._toastMsg)
      .then(($len) => expect($len).to.be.at.least(2));
    agHelper.ValidateToastMessage(date, 0);
    agHelper.ValidateToastMessage("Running all api's", 1);
    agHelper.AssertContains(/Wonderful|Please check/g);
  });

  it("8. Bug 9782: Verify .then & .catch (show alert should trigger) via JS Objects without return keyword", () => {
    deployMode.NavigateBacktoEditor();
    agHelper.AddDsl("promisesBtnDsl");
    jsEditor.CreateJSObject(`const user = 'You';
WhatTrumpThinks.run().then((res) => { showAlert("Today's quote for " + user + " is " + JSON.stringify(res), 'success') }).catch(() => showAlert("Unable to fetch quote for " + user, 'warning'))`);
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    cy.get("@jsObjName").then((jsObjName) => {
      propPane.EnterJSContext("onClick", "{{" + jsObjName + ".myFun1()}}");
    });
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    agHelper.Sleep(1000);
    agHelper
      .GetNAssertContains(
        locators._toastMsg,
        /Today's quote for You|Unable to fetch quote for/g,
      )
      .then(($ele: string | JQuery<HTMLElement>) =>
        agHelper.AssertElementLength($ele, 1),
      );
  });
});
