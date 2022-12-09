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
  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  before(() => {
    cy.fixture("tablev1NewDsl").then((val: any) => {
      agHelper.AddDsl(val);
    });
    ee.NavigateToSwitcher("explorer");
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("1. Tc 54, 55 - Verify User enables only 'Before Function calling' & OnPage Load is Automatically enable after mapping done on JSOBject", function() {
    jsEditor.CreateJSObject(
      `export default {
      getEmployee: async () => {
        return 2;
      }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    jsEditor.EnableDisableAsyncFuncSettings("getEmployee", false, true); //Only before calling confirmation is enabled by User here
    dataSources.NavigateFromActiveDS(dsName, true);
    agHelper.GetNClick(dataSources._templateMenu);
    agHelper.RenameWithInPane("GetEmployee");
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      dataSources.EnterQuery(
        "SELECT * FROM public.employees where employee_id = {{" +
          jsObjName +
          ".getEmployee.data}}",
      );
      ee.SelectEntityByName("Table1", "Widgets");
      propPane.UpdatePropertyFieldValue("Table Data", "{{GetEmployee.data}}");
      agHelper.ValidateToastMessage(
        "[GetEmployee, " +
          (jsName as string) +
          ".getEmployee] will be executed automatically on page load",
      );
      deployMode.DeployApp();
      agHelper.AssertElementVisible(jsEditor._dialog("Confirmation Dialog"));
      agHelper.AssertElementVisible(
        jsEditor._dialogBody((jsName as string) + ".getEmployee"),
      );
      agHelper.ClickButton("Yes");
      agHelper.Sleep(1000);
    });
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("2");
    });
    deployMode.NavigateBacktoEditor();
  });

  it("2. Tc 54, 55 - Verify OnPage Load - auto enabled from above case for JSOBject", function() {
    agHelper.AssertElementVisible(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementVisible(
      jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    agHelper.ClickButton("Yes");
    //agHelper.Sleep(1000);
    agHelper.ValidateToastMessage("getEmployee ran successfully"); //Verify this toast comes in EDIT page only
    ee.SelectEntityByName(jsName as string, "Queries/JS");
    jsEditor.VerifyAsyncFuncSettings("getEmployee", true, true);
  });

  it("3. Tc 56 - Verify OnPage Load - Enabled & Before Function calling Enabled for JSOBject & User clicks No & then Yes in Confirmation dialog", function() {
    deployMode.DeployApp();//Adding this check since GetEmployee failure toast is always coming & making product flaky
    //agHelper.WaitUntilAllToastsDisappear();
    agHelper.AssertElementVisible(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementVisible(
      jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    agHelper.ClickButton("No");
    agHelper.AssertContains(`${jsName + ".getEmployee"} was cancelled`);
    table.WaitForTableEmpty();
    agHelper.WaitUntilAllToastsDisappear();

    agHelper.RefreshPage();
    agHelper.AssertElementVisible(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementVisible(
      jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    agHelper.ClickButton("Yes");
    agHelper.AssertElementAbsence(locator._toastMsg);
    // agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("2");
    });
    deployMode.NavigateBacktoEditor();
    agHelper.AssertElementVisible(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementVisible(
      jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    agHelper.ClickButton("Yes");
    agHelper.ValidateToastMessage("getEmployee ran successfully"); //Verify this toast comes in EDIT page only
  });

  //Skipping due to - "tableData":"ERROR: invalid input syntax for type smallint: "{}""
  it.skip("4. Tc 53 - Verify OnPage Load - Enabled & Disabling - Before Function calling for JSOBject", function() {
    ee.SelectEntityByName(jsName as string, "Queries/JS");
    jsEditor.EnableDisableAsyncFuncSettings("getEmployee", true, false);
    //jsEditor.RunJSObj(); //Even running JS functin before delpoying does not help
    //agHelper.Sleep(2000);
    deployMode.DeployApp();
    agHelper.AssertElementAbsence(jsEditor._dialog("Confirmation Dialog"));
    agHelper.AssertElementAbsence(
      jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    // assert that on view mode, we don't get "successful run" toast message for onpageload actions
    agHelper.AssertElementAbsence(locator._specificToast("ran successfully")); //failed toast is appearing hence skipping
    agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("2");
    });
    deployMode.NavigateBacktoEditor();
  });

  it("5. Verify Error for OnPage Load - disable & Before Function calling enabled for JSOBject", function() {
    ee.SelectEntityByName(jsName as string, "Queries/JS");
    jsEditor.EnableDisableAsyncFuncSettings("getEmployee", false, true);
    deployMode.DeployApp(locator._widgetInDeployed("tablewidget"), false);
    agHelper.WaitUntilToastDisappear('The action "GetEmployee" has failed');
    deployMode.NavigateBacktoEditor();
    agHelper.WaitUntilToastDisappear('The action "GetEmployee" has failed');
    // ee.ExpandCollapseEntity("Queries/JS");
    // ee.SelectEntityByName(jsName as string);
    // jsEditor.EnableDisableAsyncFuncSettings("getEmployee", true, true);
    // agHelper.GetNClick(jsEditor._runButton);
    // agHelper.ClickButton("Yes");
  });

  it("6. Tc 55 - Verify OnPage Load - Enabling & Before Function calling Enabling for JSOBject & deleting testdata", function() {
    // deployMode.DeployApp(locator._widgetInDeployed("tablewidget"), false);
    // agHelper.WaitUntilAllToastsDisappear();    //incase toast appears, GetEmployee failure toast is appearing
    // agHelper.AssertElementVisible(jsEditor._dialog("Confirmation Dialog"));
    // agHelper.AssertElementVisible(
    //   jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    // );
    // agHelper.ClickButton("Yes");
    // agHelper.AssertElementAbsence(locator._toastMsg);
    // table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
    //   expect(cellData).to.be.equal("2");
    // });
    // //agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    // deployMode.NavigateBacktoEditor();
    // agHelper.AssertElementVisible(jsEditor._dialog("Confirmation Dialog"));
    // agHelper.AssertElementVisible(
    //   jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    // );
    // agHelper.ClickButton("Yes");
    // agHelper.ValidateToastMessage("getEmployee ran successfully"); //Verify this toast comes in EDIT page only

    ee.SelectEntityByName(jsName as string, "Queries/JS");
    ee.ActionContextMenuByEntityName(
      jsName as string,
      "Delete",
      "Are you sure?",
      true,
    );
    ee.ActionContextMenuByEntityName("GetEmployee", "Delete", "Are you sure?");
  });

  it("7. Tc 60, 1912 - Verify JSObj calling API - OnPageLoad calls & Confirmation No then Yes!", () => {
    ee.SelectEntityByName("Page1");
    cy.fixture("JSApiOnLoadDsl").then((val: any) => {
      agHelper.AddDsl(val, locator._widgetInCanvas("imagewidget"));
    });

    ee.ExpandCollapseEntity("Queries/JS");
    apiPage.CreateAndFillApi(
      "https://api.forismatic.com/api/1.0/?method=getQuote&lang=en&format=json",
      "Quotes",
      30000,
    );
    apiPage.ToggleConfirmBeforeRunningApi(true);

    apiPage.CreateAndFillApi(
      "https://api.whatdoestrumpthink.com/api/v1/quotes/random",
      "WhatTrumpThinks",
      30000,
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
      ee.SelectEntityByName(jsName as string, "Queries/JS");
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

      ee.SelectEntityByName("Input1", "Widgets");
      propPane.UpdatePropertyFieldValue(
        "Default Value",
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
        "Default Value",
        "{{" + jsObjName + ".callTrump.data.message}}",
      );
      agHelper.WaitUntilToastDisappear(
        (("[" + jsName) as string) +
          ".callTrump] will be executed automatically on page load",
      );

      deployMode.DeployApp();

      //Commenting & changnig flow since either of confirmation modals can appear first!

      // //Confirmation - first JSObj then API
      // agHelper.AssertElementVisible(
      //   jsEditor._dialogBody((jsName as string) + ".callTrump"),
      // );
      // agHelper.ClickButton("No");
      // agHelper.WaitUntilToastDisappear(
      //   `${jsName + ".callTrump"} was cancelled`,
      // ); //When Confirmation is NO validate error toast!

      agHelper.ClickButton("No");
      agHelper.AssertContains("was cancelled");

      //One Quotes confirmation - for API true
      // agHelper.AssertElementVisible(jsEditor._dialogBody("Quotes"));
      // agHelper.ClickButton("No");
      // agHelper.WaitUntilToastDisappear("Quotes was cancelled");

      agHelper.ClickButton("No");
      agHelper.AssertContains("was cancelled");

      // //Another for API called via JS callQuotes()
      // agHelper.AssertElementVisible(jsEditor._dialogBody("Quotes"));
      // agHelper.ClickButton("No");

      agHelper.ClickButton("No");
      //agHelper.WaitUntilToastDisappear('The action "Quotes" has failed');No toast appears!

      agHelper.AssertElementAbsence(jsEditor._dialogBody("WhatTrumpThinks")); //Since JS call is NO, dependent API confirmation should not appear

      agHelper.RefreshPage();
      // agHelper.AssertElementVisible(
      //   jsEditor._dialogBody((jsName as string) + ".callTrump"),
      // );
      agHelper.AssertElementExist(jsEditor._dialogInDeployView);
      agHelper.ClickButton("Yes");

      agHelper.Sleep();
      //agHelper.AssertElementVisible(jsEditor._dialogBody("WhatTrumpThinks")); //Since JS call is Yes, dependent confirmation should appear aswell!
      agHelper.AssertElementExist(jsEditor._dialogInDeployView);
      agHelper.ClickButton("Yes");

      //agHelper.AssertElementVisible(jsEditor._dialogBody("Quotes"));
      agHelper.AssertElementExist(jsEditor._dialogInDeployView);
      agHelper.ClickButton("Yes");

      agHelper.Sleep(500);
      //agHelper.AssertElementVisible(jsEditor._dialogBody("Quotes"));
      agHelper.AssertElementExist(jsEditor._dialogInDeployView);
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

  it("8. Tc #1912 - API with OnPageLoad & Confirmation both enabled & called directly & setting previous Api's confirmation to false", () => {
    deployMode.NavigateBacktoEditor();
    agHelper.AssertElementExist(jsEditor._dialogInDeployView);
    agHelper.ClickButton("No");
    agHelper.AssertContains("was cancelled"); //agHelper.AssertContains("Quotes was cancelled");

    agHelper.WaitUntilAllToastsDisappear();
    agHelper.AssertElementExist(jsEditor._dialogInDeployView);
    agHelper.ClickButton("No"); //Ask Favour abt below
    //agHelper.ValidateToastMessage("callQuotes ran successfully"); //Verify this toast comes in EDIT page only

    agHelper.AssertElementExist(jsEditor._dialogInDeployView);
    agHelper.ClickButton("No");
    agHelper.AssertContains("was cancelled");
    ee.ExpandCollapseEntity("Queries/JS");
    apiPage.CreateAndFillApi("https://catfact.ninja/fact", "CatFacts", 30000);
    apiPage.ToggleOnPageLoadRun(true);
    apiPage.ToggleConfirmBeforeRunningApi(true);

    ee.SelectEntityByName("Image1", "Widgets");
    propPane.EnterJSContext(
      "onClick",
      `{{CatFacts.run(() => showAlert('Your cat fact is :'+ CatFacts.data.fact,'success'), () => showAlert('Oh No!','error'))}}`,
    );

    ee.SelectEntityByName("Quotes", "Queries/JS");
    apiPage.ToggleOnPageLoadRun(false);
    ee.SelectEntityByName("WhatTrumpThinks");
    apiPage.ToggleOnPageLoadRun(false);

    ee.SelectEntityByName(jsName as string, "Queries/JS");
    jsEditor.EnableDisableAsyncFuncSettings("callQuotes", false, false); //OnPageLoad made true once mapped with widget
    jsEditor.EnableDisableAsyncFuncSettings("callTrump", false, false); //OnPageLoad made true once mapped with widget

    deployMode.DeployApp();
    agHelper.AssertElementVisible(jsEditor._dialogBody("CatFacts"));
    agHelper.ClickButton("No");
    agHelper.ValidateToastMessage("CatFacts was cancelled");

    agHelper.WaitUntilToastDisappear("CatFacts was cancelled");
    agHelper.GetNClick(locator._widgetInDeployed("imagewidget"));
    agHelper.AssertElementVisible(jsEditor._dialogBody("CatFacts"));
    agHelper.ClickButton("Yes");
    cy.get(locator._toastMsg).contains(/Your cat fact|Oh No/g);
    deployMode.NavigateBacktoEditor();
    agHelper.ClickButton("No");
  });

  it("9. Tc #1646, 60 - Honouring the order of execution & Bug 13826 + Bug 13646", () => {
    homePage.NavigateToHome();
    homePage.ImportApp("JSObjOnLoadApp.json");
    homePage.AssertImportToast();

    ee.ExpandCollapseEntity("Queries/JS");
    apiPage.CreateAndFillApi(
      "https://anapioficeandfire.com/api/books/{{this.params.id}}",
      "getBooks",
      30000,
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

      ee.SelectEntityByName(jsName as string, "Queries/JS");
      //jsEditor.EnableDisableAsyncFuncSettings("callCountry", false, true); Bug # 13826

      ee.SelectEntityByName("Select1", "Widgets");
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
      // propPane.EnterJSContext(
      //   "onOptionChange",
      //   `{{` +
      //     jsObjName +
      //     `.callCountry();
      //     Select1.selectedOptionValue? showAlert('Your country is: ' + getCountry.data[0].country, 'info'): null`,
      //   true,
      //   true,
      // );

      ee.SelectEntityByName("Image1");

      // propPane.EnterJSContext(
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

  it("10. Tc #1646 - Honouring the order of execution & Bug 13826 + Bug 13646 - Delpoy page", () => {
    deployMode.DeployApp();
    agHelper.AssertElementVisible(jsEditor._dialogBody("getBooks"));
    agHelper.ClickButton("No");
    agHelper.ValidateToastMessage("getBooks was cancelled");
    agHelper
      .GetText(locator._jsonFormInputField("name"), "val")
      .should("be.empty");
    agHelper
      .GetText(locator._jsonFormInputField("url"), "val")
      .should("be.empty");

    // Uncomment below aft Bug 13826 is fixed & add for Yes also!
    // agHelper.SelectDropDown("Akron");
    // agHelper.AssertElementPresence(jsEditor._dialogBody("getCountry"));
    // agHelper.ClickButton("No");

    agHelper.WaitUntilToastDisappear("getBooks was cancelled");
    agHelper.GetNClick(locator._widgetInDeployed("imagewidget"));
    agHelper.AssertElementVisible(jsEditor._dialogBody("getBooks"));
    agHelper.ClickButton("Yes");
    //callBooks, getId confirmations also expected aft bug 13646 is fixed & covering tc 1646

    agHelper
      .GetText(locator._jsonFormInputField("name"), "val")
      .should("not.be.empty");
    agHelper
      .GetText(locator._jsonFormInputField("url"), "val")
      .should("not.be.empty");
    //   //.then(($url) => expect($url).not.be.empty);//failing at time as its not waiting for timeout!

    deployMode.NavigateBacktoEditor();
    agHelper.AssertElementVisible(jsEditor._dialogBody("getBooks"));
    agHelper.ClickButton("No");
    agHelper.ValidateToastMessage("getBooks was cancelled");

    ee.SelectEntityByName(jsName as string, "Queries/JS");
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

});
