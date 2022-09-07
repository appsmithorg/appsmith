import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let dsName: any, jsName: any;
const agHelper = ObjectsRegistry.AggregateHelper,
  ee = ObjectsRegistry.EntityExplorer,
  dataSources = ObjectsRegistry.DataSources,
  jsEditor = ObjectsRegistry.JSEditor,
  table = ObjectsRegistry.Table,
  locator = ObjectsRegistry.CommonLocators,
  homePage = ObjectsRegistry.HomePage,
  apiPage = ObjectsRegistry.ApiPage,
  deployMode = ObjectsRegistry.DeployMode,
  propPane = ObjectsRegistry.PropertyPane;

describe("JSObjects OnLoad Actions tests", function() {
  before(() => {
    cy.fixture("tablev1NewDsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
  });

  it("1. Create Postgress DS & the query", function() {
    ee.NavigateToSwitcher("explorer");
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("2. Tc 54, 55 - Verify User enables only 'Before Function calling' & OnPage Load is Automatically enable after mapping done on JSOBject", function() {
    jsEditor.CreateJSObject(
      `export default {
      getId: async () => {
        return 8;
      }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    jsEditor.EnableDisableAsyncFuncSettings("getId", false, true); //Only before calling confirmation is enabled by User here
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("GetUser");
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      dataSources.EnterQuery(
        "SELECT * FROM public.users where id = {{" +
          jsObjName +
          ".getId.data}}",
      );
      ee.SelectEntityByName("Table1", "WIDGETS");
      propPane.UpdatePropertyFieldValue("Table Data", "{{GetUser.data}}");
      agHelper.ValidateToastMessage(
        (("[" + jsName) as string) +
          ".getId, GetUser] will be executed automatically on page load",
      );
      deployMode.DeployApp();
      agHelper.AssertElementVisible(jsEditor._dialog("Confirmation Dialog"));
      agHelper.AssertElementVisible(
        jsEditor._dialogBody((jsName as string) + ".getId"),
      );
      agHelper.ClickButton("Yes");
      agHelper.Sleep(1000);
    });
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
    deployMode.NavigateBacktoEditor();
  });

  it("3. Tc 54, 55 - Verify OnPage Load - auto enabled from above case for JSOBject", function() {
    agHelper.AssertElementVisible(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementVisible(
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
    deployMode.DeployApp(locator._widgetInDeployed("tablewidget"), false);
    agHelper.WaitUntilToastDisappear('The action "GetUser" has failed');
    deployMode.NavigateBacktoEditor();
    agHelper.WaitUntilToastDisappear('The action "GetUser" has failed');
  });

  it("5. Tc 53 - Verify OnPage Load - Enabling back & Before Function calling disabled for JSOBject", function() {
    ee.SelectEntityByName(jsName as string, "QUERIES/JS");
    jsEditor.EnableDisableAsyncFuncSettings("getId", true, false);
    deployMode.DeployApp();
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
    deployMode.NavigateBacktoEditor();
  });

  it("6. Tc 55 - Verify OnPage Load - Enabling & Before Function calling Enabling for JSOBject", function() {
    ee.ExpandCollapseEntity("QUERIES/JS");
    ee.SelectEntityByName(jsName as string);
    jsEditor.EnableDisableAsyncFuncSettings("getId", true, true);
    deployMode.DeployApp();
    agHelper.AssertElementVisible(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementVisible(
      jsEditor._dialogBody((jsName as string) + ".getId"),
    );
    agHelper.ClickButton("Yes");
    agHelper.AssertElementAbsence(locator._toastMsg);
    table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
    //agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    deployMode.NavigateBacktoEditor();
    agHelper.AssertElementVisible(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementVisible(
      jsEditor._dialogBody((jsName as string) + ".getId"),
    );
    agHelper.ClickButton("Yes");
    agHelper.ValidateToastMessage("getId ran successfully"); //Verify this toast comes in EDIT page only
  });

  it("7. Tc 56 - Verify OnPage Load - Enabled & Before Function calling Enabled for JSOBject & User clicks No in Confirmation dialog", function() {
    deployMode.DeployApp();
    agHelper.AssertElementVisible(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementVisible(
      jsEditor._dialogBody((jsName as string) + ".getId"),
    );
    agHelper.ClickButton("No");
    agHelper.ValidateToastMessage("Failed to execute actions during page load"); //When Confirmation is NO
    table.WaitForTableEmpty();
    agHelper.RefreshPage();
    agHelper.AssertElementVisible(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementVisible(
      jsEditor._dialogBody((jsName as string) + ".getId"),
    );
    agHelper.ClickButton("Yes");
    agHelper.AssertElementAbsence(locator._toastMsg);
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("8");
    });
    deployMode.NavigateBacktoEditor();
    agHelper.AssertElementVisible(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementVisible(
      jsEditor._dialogBody((jsName as string) + ".getId"),
    );
    agHelper.ClickButton("Yes");
    agHelper.ValidateToastMessage("getId ran successfully"); //Verify this toast comes in EDIT page only

    ee.SelectEntityByName(jsName as string, "QUERIES/JS");
    ee.ActionContextMenuByEntityName(
      jsName as string,
      "Delete",
      "Are you sure?",
      true,
    );

    ee.ActionContextMenuByEntityName("GetUser", "Delete", "Are you sure?");
  });

  it("8. Tc 51, 52 Verify that JS editor function has a settings button available for functions marked async", () => {
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
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
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

    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      ee.SelectEntityByName(jsName as string, "QUERIES/JS");
      ee.ActionContextMenuByEntityName(
        jsName as string,
        "Delete",
        "Are you sure?",
        true,
      );
    });
  });

  it("9. Tc 60 - Verify JSObj calling API - OnPageLoad calls & Confirmation No then Yes!", () => {
    ee.SelectEntityByName("Page1");
    cy.fixture("JSApiOnLoadDsl").then((val: any) => {
      agHelper.AddDsl(val, locator._widgetInCanvas("imagewidget"));
    });

    ee.ExpandCollapseEntity("QUERIES/JS");
    apiPage.CreateAndFillApi(
      "https://api.forismatic.com/api/1.0/?method=getQuote&lang=en&format=json",
      "Quotes",
    );
    apiPage.ToggleConfirmBeforeRunningApi(true);

    apiPage.CreateAndFillApi(
      "https://api.whatdoestrumpthink.com/api/v1/quotes/random",
      "WhatTrumpThinks",
    );
    apiPage.ToggleConfirmBeforeRunningApi(true);

    jsEditor.CreateJSObject(
      `export default {
        callTrump: async () => {
          return WhatTrumpThinks.run()},
        callQuotes: () => {
          return Quotes.run().then(()=> Quotes.data.quoteText);}
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );

    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      ee.SelectEntityByName(jsName as string, "QUERIES/JS");
      jsEditor.EnableDisableAsyncFuncSettings("callQuotes", false, false); //OnPageLoad made true once mapped with widget
      jsEditor.EnableDisableAsyncFuncSettings("callTrump", false, true); //OnPageLoad made true once mapped with widget

      //Not working!
      // let onLoadToastMsg = [
      //   (("[Quotes, " + jsName) as string) +
      //     ".callQuotes] will be executed automatically on page load",
      //   (("[" + jsName) as string) +
      //     ".callQuotes, Quotes] will be executed automatically on page load",
      // ];
      // let regex = new RegExp(`${onLoadToastMsg.join("|")}`, "g");
      // cy.get(locator._toastMsg).contains(regex)

      ee.SelectEntityByName("Input1", "WIDGETS");
      propPane.UpdatePropertyFieldValue(
        "Default Text",
        "{{" + jsObjName + ".callQuotes.data}}",
      );
      cy.get(locator._toastMsg)
        .children()
        .should("contain", "Quotes") //Quotes api also since its .data is accessed in callQuotes()
        .and("contain", jsName as string)
        .and("contain", "will be executed automatically on page load");

      agHelper.WaitUntilToastDisappear("Quotes");

      ee.SelectEntityByName("Input2");
      propPane.UpdatePropertyFieldValue(
        "Default Text",
        "{{" + jsObjName + ".callTrump.data.message}}",
      );
      agHelper.WaitUntilToastDisappear(
        (("[" + jsName) as string) +
          ".callTrump] will be executed automatically on page load",
      );

      deployMode.DeployApp();

      //One Quotes confirmation - for API true
      agHelper.AssertElementVisible(jsEditor._dialogBody("Quotes"));
      agHelper.ClickButton("No");
      agHelper.WaitUntilToastDisappear('The action "Quotes" has failed');

      //Another for API called via JS callQuotes()
      agHelper.AssertElementVisible(jsEditor._dialogBody("Quotes"));
      agHelper.ClickButton("No");
      //agHelper.WaitUntilToastDisappear('The action "Quotes" has failed');No toast appears!

      //Confirmation - first JSObj then API
      agHelper.AssertElementVisible(
        jsEditor._dialogBody((jsName as string) + ".callTrump"),
      );
      agHelper.ClickButton("No");
      agHelper.WaitUntilToastDisappear(
        "Failed to execute actions during page load",
      ); //When Confirmation is NO validate error toast!
      agHelper.AssertElementAbsence(jsEditor._dialogBody("WhatTrumpThinks")); //Since JS call is NO, dependent API confirmation should not appear

      agHelper.RefreshPage();
      agHelper.AssertElementVisible(jsEditor._dialogBody("Quotes"));
      agHelper.ClickButton("Yes");

      agHelper.AssertElementVisible(jsEditor._dialogBody("Quotes"));
      agHelper.ClickButton("Yes");

      agHelper.AssertElementVisible(
        jsEditor._dialogBody((jsName as string) + ".callTrump"),
      );
      agHelper.ClickButton("Yes");

      agHelper.AssertElementVisible(jsEditor._dialogBody("WhatTrumpThinks")); //Since JS call is Yes, dependent confirmation should appear aswell!
      agHelper.ClickButton("Yes");

      agHelper.Sleep(4000); //to let the api's call be finished & populate the text fields before validation!
      agHelper
        .GetText(locator._textAreainputWidgetv2InDeployed, "text", 1)
        .then(($quote) => cy.wrap($quote).should("not.be.empty"));

      agHelper
        .GetText(locator._textAreainputWidgetv2InDeployed)
        .then(($trump) => cy.wrap($trump).should("not.be.empty"));
    });

    //Resize!
    // ee.DragDropWidgetNVerify("inputwidgetv2", 100, 100);
    // cy.get("div.t--draggable-inputwidgetv2 > div.iPntND").invoke('css', 'width', '304')
    // cy.get("div.t--draggable-inputwidgetv2 > div.iPntND").invoke('attr', 'style', 'height: 304px')
  });

  it("10. API with OnPageLoad & Confirmation both enabled & called directly & setting previous Api's confirmation to false", () => {
    deployMode.NavigateBacktoEditor();
    agHelper.AssertElementVisible(jsEditor._dialogBody("Quotes"));
    agHelper.ClickButton("No");
    agHelper.ValidateToastMessage('The action "Quotes" has failed');

    agHelper.WaitUntilToastDisappear('The action "Quotes" has failed');
    agHelper.AssertElementVisible(jsEditor._dialogBody("Quotes"));
    agHelper.ClickButton("No"); //Ask Favour abt below
    //agHelper.ValidateToastMessage("callQuotes ran successfully"); //Verify this toast comes in EDIT page only

    agHelper.AssertElementVisible(
      jsEditor._dialogBody((jsName as string) + ".callTrump"),
    );
    agHelper.ClickButton("No");
    agHelper.ValidateToastMessage("Failed to execute actions during page load");

    ee.ExpandCollapseEntity("QUERIES/JS");
    apiPage.CreateAndFillApi("https://catfact.ninja/fact", "CatFacts");
    apiPage.ToggleOnPageLoadRun(true);
    apiPage.ToggleConfirmBeforeRunningApi(true);

    ee.SelectEntityByName("Image1", "WIDGETS");
    jsEditor.EnterJSContext(
      "onClick",
      `{{CatFacts.run(() => showAlert('Your cat fact is :'+ CatFacts.data.fact,'success'), () => showAlert('Oh No!','error'))}}`,
    );

    ee.SelectEntityByName("Quotes", "QUERIES/JS");
    apiPage.ToggleOnPageLoadRun(false);
    ee.SelectEntityByName("WhatTrumpThinks");
    apiPage.ToggleOnPageLoadRun(false);

    ee.SelectEntityByName(jsName as string, "QUERIES/JS");
    jsEditor.EnableDisableAsyncFuncSettings("callQuotes", false, false); //OnPageLoad made true once mapped with widget
    jsEditor.EnableDisableAsyncFuncSettings("callTrump", false, false); //OnPageLoad made true once mapped with widget

    deployMode.DeployApp();
    agHelper.AssertElementVisible(jsEditor._dialogBody("CatFacts"));
    agHelper.ClickButton("No");
    agHelper.ValidateToastMessage('The action "CatFacts" has failed');

    agHelper.WaitUntilToastDisappear('The action "CatFacts" has failed');
    agHelper.GetNClick(locator._widgetInDeployed("imagewidget"));
    agHelper.AssertElementVisible(jsEditor._dialogBody("CatFacts"));
    agHelper.ClickButton("Yes");
    cy.get(locator._toastMsg).contains(/Your cat fact|Oh No/g);
    deployMode.NavigateBacktoEditor();
    agHelper.ClickButton("No");
  });

  it("11. Tc #1646, 60 - Honouring the order of execution & Bug 13826 + Bug 13646", () => {
    homePage.NavigateToHome();
    homePage.ImportApp("JSObjOnLoadApp.json");
    homePage.AssertImportToast();

    ee.ExpandCollapseEntity("QUERIES/JS");
    apiPage.CreateAndFillApi(
      "https://anapioficeandfire.com/api/books/{{this.params.id}}",
      "getBooks",
    );
    //apiPage.OnPageLoadRun(true); //OnPageLoad made true after mapping to JSONForm
    apiPage.ToggleConfirmBeforeRunningApi(true);

    dataSources.CreateNewQueryInDS(
      dsName,
      "SELECT distinct city FROM public.city order by city ASC",
      "getCitiesList",
    );

    // dataSources.NavigateFromActiveDS(dsName, true);
    // agHelper.GetNClick(dataSources._templateMenu);
    // agHelper.RenameWithInPane("getCitiesList");
    // dataSources.EnterQuery(
    //   "SELECT distinct city FROM public.city order by city ASC",
    // );

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
        getSelectedCity:()=>{
          return Select1.selectedOptionValue;	},
        //callCountry:() => {      //Commentning until Bug 13826 fixed
         //return getCountry.run(); }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );

    jsEditor.EnableDisableAsyncFuncSettings("getId", false, true);
    jsEditor.EnableDisableAsyncFuncSettings("callBooks", false, true); //OnPageLoad will be made true after mapping to widget - onOptionChange

    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;

      //Bug 13826
      // dataSources.NavigateToActiveDSQueryPane(guid);
      // agHelper.GetNClick(dataSources._templateMenu);
      // agHelper.RenameWithInPane("getCountry");
      // dataSources.EnterQuery(
      //   "SELECT country FROM public.city as City join public.country Country on City.country_id=Country.country_id where City.city = {{" +
      //     jsObjName +
      //     ".getSelectedCity()}}",
      // );
      // apiPage.ConfirmBeforeRunningApi(true);

      ee.SelectEntityByName(jsName as string, "QUERIES/JS");
      //jsEditor.EnableDisableAsyncFuncSettings("callCountry", false, true); Bug # 13826

      ee.SelectEntityByName("Select1", "WIDGETS");
      propPane.UpdatePropertyFieldValue(
        "Options",
        `{{ getCitiesList.data.map((row) => {
          return { label: row.city, value: row.city }
       })
    }}`,
      );
      agHelper.ValidateToastMessage(
        "[getCitiesList] will be executed automatically on page load",
      );
      //Commented until Bug 13826 is fixed
      // jsEditor.EnterJSContext(
      //   "onOptionChange",
      //   `{{` +
      //     jsObjName +
      //     `.callCountry();
      //     Select1.selectedOptionValue? showAlert('Your country is: ' + getCountry.data[0].country, 'info'): null`,
      //   true,
      //   true,
      // );

      ee.SelectEntityByName("Image1");

      // jsEditor.EnterJSContext(
      //   "onClick",
      //   `{{` + jsObjName + `.callBooks()}}`,
      //   true,
      //   true,
      // );
      propPane.SelectJSFunctionToExecute(
        "onClick",
        jsName as string,
        "callBooks",
      ); //callBooks confirmation also does not appear due to 13646

      ee.SelectEntityByName("JSONForm1");
      propPane.UpdatePropertyFieldValue("Source Data", "{{getBooks.data}}");
      //this toast is not coming due to existing JSON date errors but its made true at API
      //agHelper.ValidateToastMessage("[getBooks] will be executed automatically on page load");
    });
  });

  it("12. Tc #1646 - Honouring the order of execution & Bug 13826 + Bug 13646 - Delpoy page", () => {
    deployMode.DeployApp();
    agHelper.AssertElementVisible(jsEditor._dialogBody("getBooks"));
    agHelper.ClickButton("No");
    agHelper.ValidateToastMessage('The action "getBooks" has failed');
    agHelper
      .GetText(locator._jsonFormInputField("name"), "val")
      .then(($name) => expect($name).be.empty);
    agHelper
      .GetText(locator._jsonFormInputField("url"), "val")
      .then(($url) => expect($url).be.empty);

    // Uncomment below aft Bug 13826 is fixed & add for Yes also!
    // agHelper.SelectDropDown("Akron");
    // agHelper.AssertElementPresence(jsEditor._dialogBody("getCountry"));
    // agHelper.ClickButton("No");

    agHelper.WaitUntilToastDisappear('The action "getBooks" has failed');
    agHelper.GetNClick(locator._widgetInDeployed("imagewidget"));
    agHelper.AssertElementVisible(jsEditor._dialogBody("getBooks"));
    agHelper.ClickButton("Yes");
    agHelper.Sleep(4000);
    //callBooks, getId confirmations also expected aft bug 13646 is fixed & covering tc 1646
    agHelper
      .GetText(locator._jsonFormInputField("name"), "val")
      .then(($name) => cy.wrap($name).should("not.be.empty"));
    agHelper
      .GetText(locator._jsonFormInputField("url"), "val")
      .then(($url) => expect($url).not.be.empty);

    deployMode.NavigateBacktoEditor();
    agHelper.AssertElementVisible(jsEditor._dialogBody("getBooks"));
    agHelper.ClickButton("No");
    agHelper.ValidateToastMessage('The action "getBooks" has failed');

    ee.SelectEntityByName(jsName as string, "QUERIES/JS");
    ee.ActionContextMenuByEntityName(
      "getCitiesList",
      "Delete",
      "Are you sure?",
    );
    ee.ActionContextMenuByEntityName("getBooks", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName(
      jsName as string,
      "Delete",
      "Are you sure?",
      true,
    );
  });

  //it.skip("13. Tc # 57 - Multiple functions set to true for OnPageLoad & Confirmation before running + Bug 15340", () => {});

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
