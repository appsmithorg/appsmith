import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let guid: any, jsName: any;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  jsEditor = ObjectsRegistry.JSEditor,
  table = ObjectsRegistry.Table,
  locator = ObjectsRegistry.CommonLocators,
  homePage = ObjectsRegistry.HomePage,
  apiPage = ObjectsRegistry.ApiPage;

describe("JSObjects OnLoad Actions tests", function() {
  before(() => {
    ee.DragDropWidgetNVerify("tablewidget", 300, 300);
    ee.NavigateToSwitcher("explorer");
  });

  it.only("1. Create Postgress DS & the query", function() {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("PostgreSQL");
      guid = uid;
      agHelper.RenameWithInPane(guid, false);
      dataSources.FillPostgresDSForm();
      dataSources.TestSaveDatasource();
    });
  });

  it("2. Verify User enables only 'Before Function calling' & OnPage Load is Automatically enable after mapping done on JSOBject - 54, 55", function() {
    jsEditor.CreateJSObject(
      `export default {
      getId: async () => {
        return 8;
      }
    }`,
      true,
      true,
      false,
    );
    jsEditor.EnableDisableAsyncFuncSettings("getId", false, true); //Only before calling confirmation is enabled by User here
    dataSources.NavigateToActiveDSQueryPane(guid);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("GetUser");
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      agHelper.EnterValue(
        "SELECT * FROM public.users where id = {{" +
          jsObjName +
          ".getId.data}}",
      );
      ee.SelectEntityByName("Table1", "WIDGETS");
      jsEditor.EnterJSContext("Table Data", "{{GetUser.data}}");
      agHelper.ValidateToastMessage(
        (("[" + jsName) as string) +
          ".getId, GetUser] will be executed automatically on page load",
      );
      agHelper.DeployApp();
      agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog"));
      agHelper.AssertElementPresence(
        jsEditor._dialogBody((jsName as string) + ".getId"),
      );
      agHelper.ClickButton("Yes");
      agHelper.Sleep(1000);
    });
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
    agHelper.NavigateBacktoEditor();
  });

  it("3. Verify OnPage Load - auto enabled from above case for JSOBject - 54, 55", function() {
    agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementPresence(
      jsEditor._dialogBody((jsName as string) + ".getId"),
    );
    agHelper.ClickButton("Yes");
    //agHelper.Sleep(1000);
    agHelper.ValidateToastMessage("getId ran successfully"); //Verify this toast comes in EDIT page only
    ee.SelectEntityByName(jsName as string, "QUERIES/JS");
    jsEditor.VerifyAsyncFuncSettings("getId", true, true);
  });

  it("4. Verify Error for OnPage Load - disable & Before Function calling enabled for JSOBject", function() {
    ee.SelectEntityByName(jsName as string, "QUERIES/JS");
    jsEditor.EnableDisableAsyncFuncSettings("getId", false, true);
    agHelper.DeployApp();
    agHelper.ValidateToastMessage('The action "GetUser" has failed');
    agHelper.NavigateBacktoEditor();
  });

  it("5. Verify OnPage Load - Enabling back & Before Function calling disabled for JSOBject - 53", function() {
    ee.SelectEntityByName(jsName as string, "QUERIES/JS");
    jsEditor.EnableDisableAsyncFuncSettings("getId", true, false);
    agHelper.DeployApp();
    agHelper.AssertElementAbsence(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementAbsence(
      jsEditor._dialogBody((jsName as string) + ".getId"),
    );
    // assert that on view mode, we don't get "successful run" toast message for onpageload actions
    agHelper.AssertElementAbsence(locator._toastMsg);
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
    agHelper.NavigateBacktoEditor();
  });

  it("6. Verify OnPage Load - Enabling & Before Function calling Enabling for JSOBject - 55", function() {
    ee.SelectEntityByName(jsName as string, "QUERIES/JS");
    jsEditor.EnableDisableAsyncFuncSettings("getId", true, true);
    agHelper.DeployApp();
    agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementPresence(
      jsEditor._dialogBody((jsName as string) + ".getId"),
    );
    agHelper.ClickButton("Yes");
    agHelper.AssertElementAbsence(locator._toastMsg);
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
    agHelper.NavigateBacktoEditor();
    agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementPresence(
      jsEditor._dialogBody((jsName as string) + ".getId"),
    );
    agHelper.ClickButton("Yes");
    agHelper.ValidateToastMessage("getId ran successfully"); //Verify this toast comes in EDIT page only
  });

  it("7. Verify OnPage Load - Enabled & Before Function calling Enabled for JSOBject & User clicks No in Confirmation dialog - 56", function() {
    agHelper.DeployApp();
    agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementPresence(
      jsEditor._dialogBody((jsName as string) + ".getId"),
    );
    agHelper.ClickButton("No");
    agHelper.ValidateToastMessage("Failed to execute actions during page load"); //When Confirmation is NO
    table.WaitForTableEmpty();
    cy.reload();
    agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementPresence(
      jsEditor._dialogBody((jsName as string) + ".getId"),
    );
    agHelper.ClickButton("Yes");
    agHelper.AssertElementAbsence(locator._toastMsg);
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
    agHelper.NavigateBacktoEditor();
    agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementPresence(
      jsEditor._dialogBody((jsName as string) + ".getId"),
    );
    agHelper.ClickButton("Yes");
    agHelper.ValidateToastMessage("getId ran successfully"); //Verify this toast comes in EDIT page only
  });

  it("8. Verify that JS editor function has a settings button available for functions marked async - 51, 52", () => {
    jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1: () => {	},
        myFun2: async () => {	},
        myFun3: async () => {	},
        myFun4: async () => {	},
        myFun5: async () => {	},
        myFun6: async () => {	},
        myFun7: () => {	},
      }`,
      true,
      true,
      false,
    );

    jsEditor.VerifyAsyncFuncSettings("myFun2", false, false);
    jsEditor.VerifyAsyncFuncSettings("myFun3", false, false);
    jsEditor.VerifyAsyncFuncSettings("myFun4", false, false);
    jsEditor.VerifyAsyncFuncSettings("myFun5", false, false);
    jsEditor.VerifyAsyncFuncSettings("myFun6", false, false);

    VerifyFunctionDropdown(
      ["myFun1", "myFun7"],
      [
        "myFun2Async",
        "myFun3Async",
        "myFun4Async",
        "myFun5Async",
        "myFun6Async",
      ],
    );
  });

  it.only("9. Import application & create all queries & API's", () => {
    cy.visit("/applications");
    homePage.ImportApp("JSObjOnLoadApp.json");
    homePage.AssertImport();

    //#region API's
    ee.expandCollapseEntity("QUERIES/JS");
    apiPage.CreateAndFillApi("https://catfact.ninja/fact", "CatFacts");
    apiPage.OnPageLoadRun(true);
    apiPage.ConfirmBeforeRunningApi(true);

    apiPage.CreateAndFillApi(
      "https://anapioficeandfire.com/api/books/{{this.params.id}}",
      "getBooks",
    );
    //apiPage.OnPageLoadRun(true);
    apiPage.ConfirmBeforeRunningApi(true);

    apiPage.CreateAndFillApi(
      "https://api.forismatic.com/api/1.0/?method=getQuote&lang=en&format=json",
      "Quotes",
    );
    apiPage.ConfirmBeforeRunningApi(true);

    apiPage.CreateAndFillApi(
      "https://api.whatdoestrumpthink.com/api/v1/quotes/random",
      "WhatTrumpThinks",
    );
    //#endregion

    //#region Queries, JS
    dataSources.NavigateToActiveDSQueryPane(guid);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("getCitiesList");
    agHelper.EnterValue(
      "SELECT distinct city FROM public.city order by city ASC",
    );
    dataSources.RunQuery()

    jsEditor.CreateJSObject(
      `export default {
        between(min, max) {
          return Math.floor(
            Math.random() * (max - min) + min)
        },
        getId: async () => {
          this.between(1, 12);
          return Promise.resolve(this.between(1, 12)).then(res=> res)
        },
        callBooks: async ()=>{
          //getId confimation expected but does not appear due to Bug 13646
          let bookId = await this.getId();
          await getBooks.run({id: bookId});
        },
        callTrump: async () => {
          return WhatTrumpThinks.run().then(()=> WhatTrumpThinks.data.message)},
        callQuotes: () => {
          return Quotes.run();},
        getSelectedCity:()=>{
          return Select1.selectedOptionValue;	},
        callCountry:() => {
          return getCountry.run();
        }
      }`,
      true,
      true,
      false,
    );

    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;

      dataSources.NavigateToActiveDSQueryPane(guid);
      agHelper.GetNClick(dataSources._templateMenu);
      agHelper.RenameWithInPane("getCountry");
      agHelper.EnterValue(
        "SELECT country FROM public.city as City join public.country Country on City.country_id=Country.country_id where City.city = {{" +
          jsObjName +
          ".getSelectedCity()}}",
      );
      apiPage.ConfirmBeforeRunningApi(true);

      ee.SelectEntityByName("Input1", "WIDGETS");
      jsEditor.EnterJSContext(
        "Default Text",
        "{{" + jsObjName + ".callQuotes.data.quoteText}}",
      );

      ee.SelectEntityByName("Input2");
      jsEditor.EnterJSContext(
        "Default Text",
        "{{" + jsObjName + ".callTrump.data}}",
      );
      ee.SelectEntityByName("WhatTrumpThinks", "QUERIES/JS");
      apiPage.OnPageLoadRun(false);

      ee.SelectEntityByName("Select1");
      jsEditor.EnterJSContext(
        "Options",
        `{{ getCitiesList.data.map((row) => {
          return { label: row.city, value: row.city }
       })
    }}`,
      );
      jsEditor.EnterJSContext(
        "onOptionChange",
        `{{` +
          jsObjName +
          `.callCountry();
          showAlert('Your country is: ' + getCountry.data[0].country, 'info')}}`,
        true,
        true,
      );

      ``;

      ee.SelectEntityByName("Button1");
      jsEditor.EnterJSContext(
        "onClick",
        `{{CatFacts.run(() => showAlert(CatFacts.data.fact,'success'), () => showAlert('Oh No!','error'))}}`,
        true,
        true,
      );

      ee.SelectEntityByName("Button1");
      jsEditor.EnterJSContext(
        "onClick",
        `{{CatFacts.run(() => showAlert(CatFacts.data.fact,'success'), () => showAlert('Oh No!','error'))}}`,
        true,
        true,
      );

      ee.SelectEntityByName("Button2");
      jsEditor.EnterJSContext(
        "onClick",
        `{{` + jsObjName + `.callBooks()}}`,
        true,
        true,
      );

      //Not working, to check later!
      // agHelper.SelectPropertiesDropDown("onclick", "Execute a JS function");
      // agHelper.Sleep(500)
      // agHelper.GetNClick(locator._dropDownValue(jsName as string));
      // agHelper.Sleep(500)
      // agHelper.GetNClick(locator._dropDownValue("callBooks"));

      ee.SelectEntityByName("JSONForm1");
      jsEditor.EnterJSContext("Source Data", "{{getBooks.data}}");

      ee.SelectEntityByName(jsName as string, "QUERIES/JS");
      jsEditor.EnableDisableAsyncFuncSettings("getId", false, true);
      jsEditor.EnableDisableAsyncFuncSettings("callBooks", false, true);
      //jsEditor.EnableDisableAsyncFuncSettings("callCountry", false, true);
      jsEditor.EnableDisableAsyncFuncSettings("callQuotes", true, false);
      jsEditor.EnableDisableAsyncFuncSettings("callTrump", true, true);
    });
    //#endregion
  });

  it.only("10. Deploy page verification", () => {

    agHelper.DeployApp();

    //agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementPresence(
      jsEditor._dialogBody("CatFacts"),
    );
    agHelper.ClickButton("No");
    agHelper.ValidateToastMessage('The action "CatFacts" has failed');

    agHelper.AssertElementPresence(
      jsEditor._dialogBody("getBooks"),
    );
    agHelper.ClickButton("No");
    agHelper.ValidateToastMessage('The action "getBooks" has failed');

    agHelper.AssertElementPresence(
      jsEditor._dialogBody((jsName as string) + ".callTrump"),
    );
    agHelper.ClickButton("No");
    agHelper.ValidateToastMessage("Failed to execute actions during page load"); //When Confirmation is NO

    agHelper.SelectDropDown("Akron");
    agHelper.AssertElementPresence(
      jsEditor._dialogBody("getCountry"),
    );
    agHelper.ClickButton("No");


    agHelper.ClickButton("Get Me a Cat Fact!")
    agHelper.AssertElementPresence(
      jsEditor._dialogBody("CatFacts"),
    );
    agHelper.ClickButton("No");

    agHelper.ClickButton("Populate BookStall!")
    agHelper.AssertElementPresence(
      jsEditor._dialogBody("getBooks"),
    );
    agHelper.ClickButton("No");


    // cy.reload();
    // agHelper.AssertElementPresence(jsEditor._dialog("Confirmation Dialog"));
    // agHelper.AssertElementPresence(
    //   jsEditor._dialogBody((jsName as string) + ".getId"),
    // );
    // agHelper.ClickButton("Yes");
    // agHelper.AssertElementAbsence(locator._toastMsg);
    // agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    // table.ReadTableRowColumnData(0, 0).then((cellData) => {
    //   expect(cellData).to.be.equal("8");
    // });

  })

  function VerifyFunctionDropdown(
    syncFunctions: string[],
    asyncFunctions: string[],
  ) {
    cy.get(jsEditor._funcDropdown).click();
    cy.get(jsEditor._funcDropdownOptions).then(function($ele) {
      expect($ele.eq(0).text()).to.be.oneOf(syncFunctions);
      expect($ele.eq(1).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(2).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(3).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(4).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(5).text()).to.be.oneOf(asyncFunctions);
      expect($ele.eq(6).text()).to.be.oneOf(syncFunctions);
    });
    cy.get(jsEditor._funcDropdown).click();
  }
});
