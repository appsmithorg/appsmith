import { AggregateHelper } from "../../../../support/Pages/AggregateHelper";
import { JSEditor } from "../../../../support/Pages/JSEditor";
import { CommonLocators } from "../../../../support/Objects/CommonLocators";

const agHelper = new AggregateHelper();
const jsEditor = new JSEditor();
const locator = new CommonLocators();

describe("Validate basic operations on Entity explorer JSEditor structure", () => {

    before(() => {
    });

    it("1. Verify storeValue via .then promises", () => {
        let date = new Date().toDateString();
        cy.fixture('asyncAwaitTestBtn').then((val: any) => {
            agHelper.AddDsl(val)
        });
        agHelper.SelectEntityByName("Widgets")//to expand widgets
        agHelper.SelectEntityByName("Button1");
        jsEditor.EnableJsAndUpdate('onclick', "{{storeValue('date', Date()).then(() => showAlert(appsmith.store.date))}}");
        agHelper.ClickButton('Submit')
        cy.log("Date is:" + date)
        cy.get(locator._toastMsg)
            .should("have.length", 1)
            .should("contain.text", date);
    });

});