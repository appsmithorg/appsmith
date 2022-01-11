import { AggregateHelper } from "../../../../support/Pages/AggregateHelper";
import { JSEditor } from "../../../../support/Pages/JSEditor";
import { CommonLocators } from "../../../../support/Objects/CommonLocators";
import { ApiPage } from "../../../../support/Pages/ApiPage";

const agHelper = new AggregateHelper();
const jsEditor = new JSEditor();
const locator = new CommonLocators();
const apiPage = new ApiPage();

describe("Validate basic operations on Entity explorer JSEditor structure", () => {

    before(() => {
    });

    it("1. Verify storeValue via .then Promises", () => {
        let date = new Date().toDateString();
        cy.fixture('asyncAwaitTestBtn').then((val: any) => {
            agHelper.AddDsl(val)
        });
        agHelper.SelectEntityByName("Widgets")//to expand widgets
        agHelper.SelectEntityByName("Button1");
        jsEditor.EnterJSContext('onclick', "{{storeValue('date', Date()).then(() => showAlert(appsmith.store.date))}}", true, true);
        agHelper.ClickButton('Submit')
        cy.log("Date is:" + date)
        cy.get(locator._toastMsg)
            .should("have.length", 1)
            .should("contain.text", date);
    });

    it("2. Verify resolve via Promises", () => {
        cy.fixture('asyncAwaitTestBtn').then((val: any) => {
            agHelper.AddDsl(val)
        });
        agHelper.SelectEntityByName("Button1");
        jsEditor.EnterJSContext('onclick', `{{new Promise((resolve)=>{
            resolve("We are on planet")
        }).then((res)=>{
            return res+ " Earth"
        }).then((res)=> {
            showAlert(res)
        })}}`, true, true);
        agHelper.ClickButton('Submit')
        cy.get(locator._toastMsg)
            .should("have.length", 1)
            .should("contain.text", "We are on planet Earth");
    });

    it("3. Verify Async Await via Promises", () => {
        cy.fixture('asyncAwaitTestBtn').then((val: any) => {
            agHelper.AddDsl(val)
        });
        apiPage.CreateAndFillApi("https://randomuser.me/api/", "RandomUser")
        apiPage.CreateAndFillApi("https://api.genderize.io?name={{this.params.country}}", "Genderize")
        apiPage.ValidateQueryParams({ key: "name", value: "{{this.params.country}}" }); // verifies Bug 10055
        agHelper.SelectEntityByName("Button1");
        jsEditor.EnterJSContext('onclick', `{{(async function(){
            const user = await RandomUser.run();
            const gender = await Genderize.run({ country: user.results[0].location.country});
            await storeValue("Gender", gender);
            await showAlert("Your country is "+ JSON.stringify(appsmith.store.Gender.name));
            await showAlert("You could be a "+ JSON.stringify(appsmith.store.Gender.gender));
          })()}}`, true, true);
        agHelper.ClickButton('Submit')
        cy.get(locator._toastMsg).should("have.length", 2)
        cy.get(locator._toastMsg).first().should("contain.text", "Your country is");
        cy.get(locator._toastMsg).last().contains(/male|female|null/g)
    });

    it("4. Verify .then & .catch via Promises", () => {
        cy.fixture('asyncAwaitTestBtn').then((val: any) => {
            agHelper.AddDsl(val)
        });
        apiPage.CreateAndFillApi("https://favqs.com/api/qotd", "InspiringQuotes")
        jsEditor.CreateJSObject(`const user = 'You';
        return InspiringQuotes.run().then((res) => {showAlert("Today's quote for "+ user + " is "+ JSON.stringify(res.quote.body))}).catch(() => showAlert("Unable to fetch quote for "+ user))`, true, false);
        agHelper.SelectEntityByName("Button1");
        jsEditor.EnterJSContext('onclick', `{{JSObject1.myFun1()}}`, true, true);
        agHelper.ClickButton('Submit')
        cy.get(locator._toastMsg).should("have.length", 1).should("contain.text", "Today's quote for You");
    });

    it("5. Verify Promise.race", () => {
        cy.fixture('asyncAwaitTestBtn').then((val: any) => {
            agHelper.AddDsl(val)
        });
        apiPage.CreateAndFillApi("https://api.agify.io?name={{this.params.person}}", "Agify")
        apiPage.ValidateQueryParams({ key: "name", value: "{{this.params.person}}" }); // verifies Bug 10055

        agHelper.SelectEntityByName("Button1");
        jsEditor.EnterJSContext('onclick', `{{Promise.race([Agify.run({person:'Melinda' }),Agify.run({person:'Trump'})]).then((res) => { showAlert('Winner is ' + JSON.stringify(res.name))})}}`, true, true);
        agHelper.ClickButton('Submit')
        cy.get(locator._toastMsg).should("have.length", 1).contains(/Melinda|Trump|null/g)
    });

});