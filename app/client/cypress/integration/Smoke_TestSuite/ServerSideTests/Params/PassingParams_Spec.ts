import { AggregateHelper } from "../../../../support/Pages/AggregateHelper";
import { JSEditor } from "../../../../support/Pages/JSEditor";
import { DataSources } from "../../../../support/Pages/DataSources";

const agHelper = new AggregateHelper();
const jsEditor = new JSEditor();
const dataSources = new DataSources();

describe("Validate Create Api and Bind to Table widget via JSObject", () => {
    before(() => {
        cy.fixture('paramsDsl').then((val: any) => {
            agHelper.AddDsl(val)
        });
    });

    let guid: any;

    it("1. [Bug] - 10784 : Passing params from JS to SQL query should not break", function () {
        agHelper.NavigateToDSCreateNew()
        dataSources.CreatePlugIn('PostgreSQL')
        dataSources.FillPostgresDSForm();
        agHelper.GenerateUUID()
        cy.get("@guid").then(uid => {
            guid = uid;
            agHelper.RenameWithInPane(guid, false)
            dataSources.TestSaveDatasource()
            cy.log("ds name is :" + guid)
            dataSources.NavigateToActiveDSQueryPane(guid);
            agHelper.GetNClick(dataSources._templateMenu)
            agHelper.RenameWithInPane("Params")
            agHelper.EnterValue("SELECT * FROM public.users where id = {{this?.params?.condition || '1=1'}} order by id");
            jsEditor.CreateJSObject('Params.run(() => {},() => {},{"condition": selRecordFilter.selectedOptionValue})');
        })
        agHelper.SelectEntityByName("WIDGETS") 
        agHelper.SelectEntityByName("Table1") //tabledata
        jsEditor.EnterJSContext('tabledata', "{{Params.data}}");
        agHelper.SelectEntityByName("Button1")
        cy.get("@jsObjName").then((jsObjName) => {
            jsEditor.EnterJSContext('onclick', "{{" + jsObjName + ".myFun1()}}", true, true);
        });
        agHelper.ClickButton("Submit")
    });

});