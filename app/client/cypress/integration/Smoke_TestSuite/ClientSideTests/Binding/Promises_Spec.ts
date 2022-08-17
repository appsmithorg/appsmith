import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  apiPage = ObjectsRegistry.ApiPage,
  deployMode = ObjectsRegistry.DeployMode,
  propPane = ObjectsRegistry.PropertyPane;

describe("Validate basic Promises", () => {
  it("1. Verify storeValue via .then via direct Promises", () => {
    let date = new Date().toDateString();
    cy.fixture("promisesBtnDsl").then((val: any) => {
      agHelper.AddDsl(val, locator._spanButton("Submit"));
    });
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext(
      "onClick",
      "{{storeValue('date', Date()).then(() => showAlert(appsmith.store.date))}}",
    );
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    agHelper.ValidateToastMessage(date);
    deployMode.NavigateBacktoEditor();
  });

  it("2. Verify resolve & chaining via direct Promises", () => {
    cy.fixture("promisesBtnDsl").then((val: any) => {
      agHelper.AddDsl(val, locator._spanButton("Submit"));
    });
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext(
      "onClick",
      `{{
          new Promise((resolve) => {
            resolve("We are on planet")
          }).then((res) => {
            return res + " Earth"
          }).then((res) => {
            showAlert(res, 'success')
          }).catch(err => { showAlert(err, 'error') });
        }}`,
    );
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    agHelper.ValidateToastMessage("We are on planet Earth");
    deployMode.NavigateBacktoEditor();
  });

  it("3. Verify Async Await in direct Promises", () => {
    cy.fixture("promisesBtnDsl").then((val: any) => {
      agHelper.AddDsl(val, locator._spanButton("Submit"));
    });
    apiPage.CreateAndFillApi("https://randomuser.me/api/", "RandomUser");
    apiPage.CreateAndFillApi(
      "https://api.genderize.io?name={{this.params.country}}",
      "Genderize",
    );
    apiPage.ValidateQueryParams({
      key: "name",
      value: "{{this.params.country}}",
    }); // verifies Bug 10055
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext(
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
    cy.get(locator._toastMsg).should("have.length.at.least", 1);
    cy.get(locator._toastMsg)
      .first()
      //.should("contain.text", "Your country is");
      .contains(/Your country is|failed to execute/g);

    //Since sometimes api is failing & no 2nd toast in that case
    // cy.get(locator._toastMsg)
    //   .last()
    //   .contains(/male|female|null/g);
  });

  it("4. Verify .then & .catch via direct Promises", () => {
    deployMode.NavigateBacktoEditor();
    cy.fixture("promisesBtnImgDsl").then((val: any) => {
      agHelper.AddDsl(val, locator._spanButton("Submit"));
    });
    apiPage.CreateAndFillApi(
      "https://source.unsplash.com/collection/8439505",
      "Christmas",
    );
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext(
      "onClick",
      `{{
            (function () {
          return Christmas.run()
            .then(() => showAlert("You have a beautiful picture", 'success'))
            .catch(() => showAlert('Oops!', 'error'))
        })()
          }}`,
    );
    ee.SelectEntityByName("Image1");
    propPane.UpdatePropertyFieldValue("Image", `{{Christmas.data}}`);
    agHelper.ValidateToastMessage(
      "will be executed automatically on page load",
    );
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    cy.get(locator._toastMsg)
      .should("have.length", 1)
      .contains(/You have a beautiful picture|Oops!/g);
  });

  it("5. Verify .then & .catch via JS Objects in Promises", () => {
    deployMode.NavigateBacktoEditor();
    cy.fixture("promisesBtnDsl").then((val: any) => {
      agHelper.AddDsl(val, locator._spanButton("Submit"));
    });
    apiPage.CreateAndFillApi("https://favqs.com/api/qotd", "InspiringQuotes");
    jsEditor.CreateJSObject(`const user = 'You';
return InspiringQuotes.run().then((res) => { showAlert("Today's quote for " + user + " is " + JSON.stringify(res.quote.body), 'success') }).catch(() => showAlert("Unable to fetch quote for " + user, 'warning'))`);
    ee.SelectEntityByName("Button1", "WIDGETS");
    cy.get("@jsObjName").then((jsObjName) => {
      jsEditor.EnterJSContext("onClick", "{{" + jsObjName + ".myFun1()}}");
    });
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    //agHelper.ValidateToastMessage("Today's quote for You")
    cy.get(locator._toastMsg)
      .should("have.length", 1)
      .contains(/Today's quote for You|Unable to fetch quote for/g);
  });

  it("6. Verify Promise.race via direct Promises", () => {
    deployMode.NavigateBacktoEditor();
    cy.fixture("promisesBtnDsl").then((val: any) => {
      agHelper.AddDsl(val, locator._spanButton("Submit"));
    });
    apiPage.CreateAndFillApi(
      "https://api.agify.io?name={{this.params.person}}",
      "Agify",
    );
    apiPage.ValidateQueryParams({
      key: "name",
      value: "{{this.params.person}}",
    }); // verifies Bug 10055
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext(
      "onClick",
      `{{ Promise.race([Agify.run({ person: 'Melinda' }), Agify.run({ person: 'Trump' })]).then((res) => { showAlert('Winner is ' + JSON.stringify(res.name), 'success') }) }} `,
    );
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    cy.get(locator._toastMsg)
      .should("have.length", 1)
      .contains(/Melinda|Trump/g);
  });

  it("7. Verify maintaining context via direct Promises", () => {
    deployMode.NavigateBacktoEditor();
    cy.fixture("promisesBtnListDsl").then((val: any) => {
      agHelper.AddDsl(val, locator._spanButton("Submit"));
    });
    apiPage.CreateAndFillApi(
      "https://api.jikan.moe/v3/search/anime?q={{this.params.name}}",
      "GetAnime",
    );
    ee.SelectEntityByName("List1", "WIDGETS");
    propPane.UpdatePropertyFieldValue(
      "Items",
      `[{
  "name": {{ GetAnime.data.results[0].title }},
"img": {{ GetAnime.data.results[0].image_url }},
"synopsis": {{ GetAnime.data.results[0].synopsis }}
      },
{
  "name": {{ GetAnime.data.results[3].title }},
  "img": {{ GetAnime.data.results[3].image_url }},
  "synopsis": {{ GetAnime.data.results[3].synopsis }}
},
{
  "name": {{ GetAnime.data.results[2].title }},
  "img": {{ GetAnime.data.results[2].image_url }},
  "synopsis": {{ GetAnime.data.results[2].synopsis }}
}]`,
    );
    agHelper.ValidateToastMessage(
      "will be executed automatically on page load",
    ); //Validating 'Run API on Page Load' is set once api response is mapped
    ee.SelectEntityByName("Button1");
    jsEditor.EnterJSContext(
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
    agHelper.WaitUntilEleAppear(locator._toastMsg);
    cy.get(locator._toastMsg)
      //.should("have.length", 1)//covered in WaitUntilEleAppear()
      .should("have.text", "Showing results for : fruits basket : the final");
  });

  it("8: Verify Promise.all via direct Promises", () => {
    deployMode.NavigateBacktoEditor();
    cy.fixture("promisesBtnDsl").then((val: any) => {
      agHelper.AddDsl(val, locator._spanButton("Submit"));
    });
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext(
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

  it("9. Bug 10150: Verify Promise.all via JSObjects", () => {
    deployMode.NavigateBacktoEditor();
    let date = new Date().toDateString();
    cy.fixture("promisesBtnDsl").then((val: any) => {
      agHelper.AddDsl(val, locator._spanButton("Submit"));
    });
    jsEditor.CreateJSObject(`let allFuncs = [Genderize.run({ country: 'India' }),
RandomUser.run(),
GetAnime.run({ name: 'Gintama' }),
InspiringQuotes.run(),
Agify.run({ person: 'Scripty' }),
Christmas.run()
]
showAlert("Running all api's", "warning");
return Promise.all(allFuncs).then(() =>
showAlert("Wonderful! all apis executed", "success")).catch(() => showAlert("Please check your api's again", "error")); `);

    ee.SelectEntityByName("Button1", "WIDGETS");
    cy.get("@jsObjName").then((jsObjName) => {
      jsEditor.EnterJSContext(
        "onClick",
        "{{storeValue('date', Date()).then(() => { showAlert(appsmith.store.date, 'success'); return " +
          jsObjName +
          ".myFun1()})}}",
      );
    });
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    //agHelper.WaitUntilEleAppear(locator._toastMsg)
    cy.get(locator._toastMsg).should("have.length", 3);
    cy.get(locator._toastMsg)
      .eq(0)
      .should("contain.text", date);
    cy.get(locator._toastMsg)
      .eq(1)
      .contains("Running all api's");
    agHelper.WaitUntilEleAppear(locator._toastMsg);
    cy.get(locator._toastMsg)
      .last()
      .contains(/Wonderful|Please check/g);
  });

  it("10. Verify Promises.any via direct JSObjects", () => {
    deployMode.NavigateBacktoEditor();
    cy.fixture("promisesBtnDsl").then((val: any) => {
      agHelper.AddDsl(val, locator._spanButton("Submit"));
    });
    jsEditor.CreateJSObject(
      `export default {
      func2: async () => {
     return Promise.reject(new Error('fail')).then(showAlert("Promises reject from func2"));
    },
      func1: async () => {
      showAlert("In func1")
      return "func1"
    },
    func3: async () => {
      showAlert("In func3")
      return "func3"
    },
    runAny: async () => {
      return Promise.any([this.func2(), this.func3(), this.func1()]).then((value) => showAlert("Resolved promise is:" + value))
    }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    ee.SelectEntityByName("Button1", "WIDGETS");
    cy.get("@jsObjName").then((jsObjName) => {
      jsEditor.EnterJSContext("onClick", "{{" + jsObjName + ".runAny()}}");
    });
    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    cy.get(locator._toastMsg).should("have.length", 4);
    cy.get(locator._toastMsg)
      .eq(0)
      .contains("Promises reject from func2");
    cy.get(locator._toastMsg)
      .last()
      .contains("Resolved promise is:func3");
  });

  it("11. Bug : 11110 - Verify resetWidget via .then direct Promises", () => {
    deployMode.NavigateBacktoEditor();
    cy.fixture("promisesBtnDsl").then((dsl: any) => {
      agHelper.AddDsl(dsl, locator._spanButton("Submit"));
    });
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext(
      "onClick",
      "{{resetWidget('Input1').then(() => showAlert(Input1.text))}}",
    );
    deployMode.DeployApp(locator._inputWidgetInDeployed);
    cy.get(locator._inputWidgetInDeployed).type("Update value");
    agHelper.ClickButton("Submit");
    agHelper.ValidateToastMessage("Test");
  });

  //Skipping until this bug this is addressed!
  it.skip("12. Bug 9782: Verify .then & .catch (show alert should trigger) via JS Objects without return keyword", () => {
    deployMode.NavigateBacktoEditor();
    cy.fixture("promisesBtnDsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    jsEditor.CreateJSObject(`const user = 'You';
InspiringQuotes.run().then((res) => { showAlert("Today's quote for " + user + " is " + JSON.stringify(res.quote.body), 'success') }).catch(() => showAlert("Unable to fetch quote for " + user, 'warning'))`);
    ee.SelectEntityByName("Button1");
    cy.get("@jsObjName").then((jsObjName) => {
      jsEditor.EnterJSContext("onClick", "{{" + jsObjName + ".myFun1()}}");
    });
    agHelper.ClickButton("Submit");
    agHelper.ValidateToastMessage("Today's quote for You");
  });
});
