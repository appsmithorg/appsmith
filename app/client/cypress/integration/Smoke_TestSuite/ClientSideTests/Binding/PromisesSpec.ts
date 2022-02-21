import { AggregateHelper } from "../../../../support/Pages/AggregateHelper";
import { JSEditor } from "../../../../support/Pages/JSEditor";
import { CommonLocators } from "../../../../support/Objects/CommonLocators";
import { ApiPage } from "../../../../support/Pages/ApiPage";
import publish from "../../../../locators/publishWidgetspage.json";

const agHelper = new AggregateHelper();
const jsEditor = new JSEditor();
const locator = new CommonLocators();
const apiPage = new ApiPage();

describe("Validate basic operations on Entity explorer JSEditor structure", () => {
  it("1. Verify storeValue via .then direct Promises", () => {
    const date = new Date().toDateString();
    cy.fixture("promisesBtn").then((val: any) => {
      agHelper.AddDsl(val);
    });
    agHelper.SelectEntityByName("WIDGETS"); //to expand widgets
    agHelper.SelectEntityByName("Button1");
    jsEditor.EnterJSContext(
      "onclick",
      "{{storeValue('date', Date()).then(() => showAlert(appsmith.store.date))}}",
      true,
      true,
    );
    agHelper.ClickButton("Submit");
    cy.log("Date is:" + date);
    cy.get(locator._toastMsg)
      .should("have.length", 1)
      .should("contain.text", date);
  });

  it("2. Verify resolve & chaining via direct Promises", () => {
    cy.fixture("promisesBtn").then((val: any) => {
      agHelper.AddDsl(val);
    });
    agHelper.SelectEntityByName("WIDGETS");
    agHelper.SelectEntityByName("Button1");
    jsEditor.EnterJSContext(
      "onclick",
      `{{new Promise((resolve)=>{
            resolve("We are on planet")
        }).then((res)=>{
            return res+ " Earth"
        }).then((res)=> {
            showAlert(res, 'success')
        })}}`,
      true,
      true,
    );
    agHelper.ClickButton("Submit");
    cy.get(locator._toastMsg)
      .should("have.length", 1)
      .should("contain.text", "We are on planet Earth");
  });

  it("3. Verify Async Await in direct Promises", () => {
    cy.fixture("promisesBtn").then((val: any) => {
      agHelper.AddDsl(val);
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
    agHelper.SelectEntityByName("WIDGETS");
    agHelper.SelectEntityByName("Button1");
    jsEditor.EnterJSContext(
      "onclick",
      `{{(async function(){
            const user = await RandomUser.run();
            const gender = await Genderize.run({ country: user.results[0].location.country});
            await storeValue("Gender", gender);
            await showAlert("Your country is "+ JSON.stringify(appsmith.store.Gender.name), 'warning');
            await showAlert("You could be a "+ JSON.stringify(appsmith.store.Gender.gender), 'warning');
          })()}}`,
      true,
      true,
    );
    agHelper.ClickButton("Submit");
    cy.get(locator._toastMsg).should("have.length", 2);
    cy.get(locator._toastMsg)
      .first()
      .should("contain.text", "Your country is");
    cy.get(locator._toastMsg)
      .last()
      .contains(/male|female|null/g);
  });

  it("4. Verify .then & .catch via direct Promises", () => {
    cy.fixture("promisesBtnImg").then((val: any) => {
      agHelper.AddDsl(val);
    });
    apiPage.CreateAndFillApi(
      "https://source.unsplash.com/collection/8439505",
      "Christmas",
    );
    agHelper.SelectEntityByName("WIDGETS"); //to expand widgets
    agHelper.SelectEntityByName("Button1");
    jsEditor.EnterJSContext(
      "onclick",
      `{{
            (function(){
                  return Christmas.run()
              .then(() => showAlert("You have a beautiful picture", 'success') )
              .catch(() => showAlert('Oops!', 'error'))
              })()
          }}`,
      true,
      true,
    );
    agHelper.SelectEntityByName("Image1");
    jsEditor.EnterJSContext("image", `{{Christmas.data}}`, true);
    agHelper.WaitUntilEleDisappear(
      locator._toastMsg,
      "will be executed automatically on page load",
    );
    agHelper.ClickButton("Submit");
    cy.get(locator._toastMsg)
      .should("have.length", 1)
      .contains(/You have a beautiful picture|Oops!/g);
  });

  it("5. Verify .then & .catch via JS Objects in Promises", () => {
    cy.fixture("promisesBtn").then((val: any) => {
      agHelper.AddDsl(val);
    });
    apiPage.CreateAndFillApi("https://favqs.com/api/qotd", "InspiringQuotes");
    jsEditor.CreateJSObject(`const user = 'You';
        return InspiringQuotes.run().then((res) => {showAlert("Today's quote for "+ user + " is "+ JSON.stringify(res.quote.body), 'success')}).catch(() => showAlert("Unable to fetch quote for "+ user, 'warning'))`);
    agHelper.SelectEntityByName("WIDGETS"); //to expand widgets
    agHelper.SelectEntityByName("Button1");
    jsEditor.EnterJSContext("onclick", `{{JSObject1.myFun1()}}`, true, true);
    agHelper.ClickButton("Submit");
    cy.get(locator._toastMsg)
      .should("have.length", 1)
      .should("contain.text", "Today's quote for You");
  });

  it("6. Verify Promise.race", () => {
    cy.fixture("promisesBtn").then((val: any) => {
      agHelper.AddDsl(val);
    });
    apiPage.CreateAndFillApi(
      "https://api.agify.io?name={{this.params.person}}",
      "Agify",
    );
    apiPage.ValidateQueryParams({
      key: "name",
      value: "{{this.params.person}}",
    }); // verifies Bug 10055
    agHelper.SelectEntityByName("WIDGETS");
    agHelper.SelectEntityByName("Button1");
    jsEditor.EnterJSContext(
      "onclick",
      `{{Promise.race([Agify.run({person:'Melinda' }),Agify.run({person:'Trump'})]).then((res) => { showAlert('Winner is ' + JSON.stringify(res.name), 'success')})}}`,
      true,
      true,
    );
    agHelper.ClickButton("Submit");
    cy.get(locator._toastMsg)
      .should("have.length", 1)
      .contains(/Melinda|Trump/g);
  });

  it("7. Verify maintaining context via direct Promises", () => {
    cy.fixture("promisesBtnList").then((val: any) => {
      agHelper.AddDsl(val);
    });
    apiPage.CreateAndFillApi(
      "https://api.jikan.moe/v3/search/anime?q={{this.params.name}}",
      "GetAnime",
    );
    agHelper.SelectEntityByName("WIDGETS"); //to expand widgets
    agHelper.SelectEntityByName("List1");
    jsEditor.EnterJSContext(
      "items",
      `[
            {
              "name": {{GetAnime.data.results[0].title}},
              "img": {{GetAnime.data.results[0].image_url}},
              "synopsis": {{GetAnime.data.results[0].synopsis}}
              },
            {
              "name": {{GetAnime.data.results[3].title}},
              "img": {{GetAnime.data.results[3].image_url}},
              "synopsis": {{GetAnime.data.results[3].synopsis}}
            },
            {
              "name": {{GetAnime.data.results[2].title}},
              "img": {{GetAnime.data.results[2].image_url}},
              "synopsis": {{GetAnime.data.results[2].synopsis}}
            }
          ]`,
      true,
    );
    agHelper.WaitUntilEleDisappear(
      locator._toastMsg,
      "will be executed automatically on page load",
    );
    agHelper.SelectEntityByName("Button1");
    jsEditor.EnterJSContext(
      "onclick",
      `{{(function(){
            const anime = "fruits basket : the final";
            return GetAnime.run({ name: anime })
              .then(() => showAlert("Showing results for : "+ anime, 'success'))
          })()}}`,
      true,
      true,
    );
    agHelper.ClickButton("Submit");
    cy.get(locator._toastMsg)
      .should("have.length", 1)
      .should("have.text", "Showing results for : fruits basket : the final");
  });

  it.skip("8. Verify Promise.all", () => {
    cy.fixture("promisesBtn").then((val: any) => {
      agHelper.AddDsl(val);
    });
    apiPage.CreateAndFillApi(
      "https://api.agify.io?name={{this.params.person}}",
      "Agify",
    );
    apiPage.ValidateQueryParams({
      key: "name",
      value: "{{this.params.person}}",
    }); // verifies Bug 10055
    agHelper.SelectEntityByName("WIDGETS");
    agHelper.SelectEntityByName("Button1");
    jsEditor.EnterJSContext(
      "onclick",
      `{{Promise.race([Agify.run({person:'Melinda' }),Agify.run({person:'Trump'})]).then((res) => { showAlert('Winner is ' + JSON.stringify(res.name))})}}`,
      true,
      true,
    );
    agHelper.ClickButton("Submit");
    cy.get(locator._toastMsg)
      .should("have.length", 1)
      .contains(/Melinda|Trump|null/g);
  });

  it("1.1. Verify resetWidget via .then direct Promises", () => {
    cy.fixture("promisesBtn").then((dsl: any) => {
      agHelper.AddDsl(dsl);
    });
    agHelper.SelectEntityByName("WIDGETS"); //to expand widgets
    agHelper.SelectEntityByName("Button1");
    jsEditor.EnterJSContext(
      "onclick",
      "{{resetWidget('Input1').then(() => showAlert(Input1.text))}}",
      true,
      true,
    );
    agHelper.DeployApp();
    cy.get(publish.inputWidget + " " + "input").type("Update value");

    agHelper.ClickButton("Submit");
    cy.get(locator._toastMsg)
      .should("have.length", 1)
      .should("contain.text", "Test");

    cy.get(publish.backToEditor).click({ force: true });
  });
  
});
