import * as _ from "../../../../support/Objects/ObjectsCore";
let dsName: any, jsName: any;

describe("JSObjects OnLoad Actions tests", function () {
  beforeEach(() => {
    _.agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    _.agHelper.SaveLocalStorageCache();
  });

  before(() => {
    cy.fixture("tablev1NewDsl").then((val: any) => {
      _.agHelper.AddDsl(val);
    });
    _.entityExplorer.NavigateToSwitcher("explorer");
    _.dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
  });

  it("1. Tc 54, 55 - Verify User enables only 'Before Function calling' & OnPage Load is Automatically enable after mapping done on JSOBject", function () {
    _.jsEditor.CreateJSObject(
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
    _.jsEditor.EnableDisableAsyncFuncSettings("getEmployee", false, true); //Only before calling confirmation is enabled by User here
    _.dataSources.NavigateFromActiveDS(dsName, true);
    _.agHelper.GetNClick(_.dataSources._templateMenu);
    _.agHelper.RenameWithInPane("GetEmployee");
    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;
      _.dataSources.EnterQuery(
        "SELECT * FROM public.employees where employee_id = {{" +
          jsObjName +
          ".getEmployee.data}}",
      );
      _.entityExplorer.SelectEntityByName("Table1", "Widgets");
      _.propPane.UpdatePropertyFieldValue("Table Data", "{{GetEmployee.data}}");
      _.agHelper.ValidateToastMessage(
        "[GetEmployee, " +
          (jsName as string) +
          ".getEmployee] will be executed automatically on page load",
      );
      _.deployMode.DeployApp();
      _.agHelper.AssertElementVisible(
        _.jsEditor._dialog("Confirmation Dialog"),
      );
      _.agHelper.AssertElementVisible(
        _.jsEditor._dialogBody((jsName as string) + ".getEmployee"),
      );
      _.agHelper.ClickButton("Yes");
      _.agHelper.Sleep(1000);
    });
    _.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    _.table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("2");
    });
    _.deployMode.NavigateBacktoEditor();
  });

  it("2. Tc 54, 55 - Verify OnPage Load - auto enabled from above case for JSOBject", function () {
    _.agHelper.AssertElementVisible(_.jsEditor._dialog("Confirmation Dialog"));
    _.agHelper.AssertElementVisible(
      _.jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    _.agHelper.ClickButton("Yes");
    //_.agHelper.Sleep(1000);
    _.agHelper.ValidateToastMessage("getEmployee ran successfully"); //Verify this toast comes in EDIT page only
    _.entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
    _.jsEditor.VerifyAsyncFuncSettings("getEmployee", true, true);
  });

  it("3. Tc 56 - Verify OnPage Load - Enabled & Before Function calling Enabled for JSOBject & User clicks No & then Yes in Confirmation dialog", function () {
    _.deployMode.DeployApp(); //Adding this check since GetEmployee failure toast is always coming & making product flaky
    //_.agHelper.WaitUntilAllToastsDisappear();
    _.agHelper.AssertElementVisible(_.jsEditor._dialog("Confirmation Dialog"));
    _.agHelper.AssertElementVisible(
      _.jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    _.agHelper.ClickButton("No");
    _.agHelper.AssertContains(`${jsName + ".getEmployee"} was cancelled`);
    _.table.WaitForTableEmpty();
    _.agHelper.WaitUntilAllToastsDisappear();

    _.agHelper.RefreshPage();
    _.agHelper.AssertElementVisible(_.jsEditor._dialog("Confirmation Dialog"));
    _.agHelper.AssertElementVisible(
      _.jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    _.agHelper.ClickButton("Yes");
    _.agHelper.AssertElementAbsence(_.locators._toastMsg);
    // _.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    _.table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("2");
    });
    _.deployMode.NavigateBacktoEditor();
    _.agHelper.AssertElementVisible(_.jsEditor._dialog("Confirmation Dialog"));
    _.agHelper.AssertElementVisible(
      _.jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    _.agHelper.ClickButton("Yes");
    _.agHelper.ValidateToastMessage("getEmployee ran successfully"); //Verify this toast comes in EDIT page only
  });

  //Skipping due to - "_.tableData":"ERROR: invalid input syntax for type smallint: "{}""
  it.skip("4. Tc 53 - Verify OnPage Load - Enabled & Disabling - Before Function calling for JSOBject", function () {
    _.entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
    _.jsEditor.EnableDisableAsyncFuncSettings("getEmployee", true, false);
    //_.jsEditor.RunJSObj(); //Even running JS functin before delpoying does not help
    //_.agHelper.Sleep(2000);
    _.deployMode.DeployApp();
    _.agHelper.AssertElementAbsence(_.jsEditor._dialog("Confirmation Dialog"));
    _.agHelper.AssertElementAbsence(
      _.jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    );
    // assert that on view mode, we don't get "successful run" toast message for onpageload actions
    _.agHelper.AssertElementAbsence(
      _.locators._specificToast("ran successfully"),
    ); //failed toast is appearing hence skipping
    _.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    _.table.ReadTableRowColumnData(0, 0).then((cellData) => {
      expect(cellData).to.be.equal("2");
    });
    _.deployMode.NavigateBacktoEditor();
  });

  it("5. Verify Error for OnPage Load - disable & Before Function calling enabled for JSOBject", function () {
    _.entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
    _.jsEditor.EnableDisableAsyncFuncSettings("getEmployee", false, true);
    _.deployMode.DeployApp(_.locators._widgetInDeployed("tablewidget"), false);
    _.agHelper.WaitUntilToastDisappear('The action "GetEmployee" has failed');
    _.deployMode.NavigateBacktoEditor();
    _.agHelper.WaitUntilToastDisappear('The action "GetEmployee" has failed');
    // ee.ExpandCollapseEntity("Queries/JS");
    // ee.SelectEntityByName(jsName as string);
    // _.jsEditor.EnableDisableAsyncFuncSettings("getEmployee", true, true);
    // _.agHelper.GetNClick(_.jsEditor._runButton);
    // _.agHelper.ClickButton("Yes");
  });

  it("6. Tc 55 - Verify OnPage Load - Enabling & Before Function calling Enabling for JSOBject & deleting testdata", function () {
    // _.deployMode.DeployApp(_.locators._widgetInDeployed("tablewidget"), false);
    // _.agHelper.WaitUntilAllToastsDisappear();    //incase toast appears, GetEmployee failure toast is appearing
    // _.agHelper.AssertElementVisible(_.jsEditor._dialog("Confirmation Dialog"));
    // _.agHelper.AssertElementVisible(
    //   _.jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    // );
    // _.agHelper.ClickButton("Yes");
    // _.agHelper.AssertElementAbsence(_.locators._toastMsg);
    // _.table.ReadTableRowColumnData(0, 0, 2000).then((cellData) => {
    //   expect(cellData).to.be.equal("2");
    // });
    // //_.agHelper.ValidateNetworkExecutionSuccess("@postExecute");
    // _.deployMode.NavigateBacktoEditor();
    // _.agHelper.AssertElementVisible(_.jsEditor._dialog("Confirmation Dialog"));
    // _.agHelper.AssertElementVisible(
    //   _.jsEditor._dialogBody((jsName as string) + ".getEmployee"),
    // );
    // _.agHelper.ClickButton("Yes");
    // _.agHelper.ValidateToastMessage("getEmployee ran successfully"); //Verify this toast comes in EDIT page only

    _.entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
    _.entityExplorer.ActionContextMenuByEntityName(
      jsName as string,
      "Delete",
      "Are you sure?",
      true,
    );
    _.entityExplorer.ActionContextMenuByEntityName(
      "GetEmployee",
      "Delete",
      "Are you sure?",
    );
  });

  it("7. Tc 60, 1912 - Verify JSObj calling API - OnPageLoad calls & Confirmation No then Yes!", () => {
    _.entityExplorer.SelectEntityByName("Page1");
    cy.fixture("JSApiOnLoadDsl").then((val: any) => {
      _.agHelper.AddDsl(val, _.locators._widgetInCanvas("imagewidget"));
    });

    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.apiPage.CreateAndFillApi(
      "https://api.forismatic.com/api/1.0/?method=getQuote&lang=en&format=json",
      "Quotes",
      30000,
    );
    _.apiPage.ToggleConfirmBeforeRunningApi(true);

    _.apiPage.CreateAndFillApi(
      "https://api.whatdoestrumpthink.com/api/v1/quotes/random",
      "WhatTrumpThinks",
      30000,
    );
    _.apiPage.ToggleConfirmBeforeRunningApi(true);

    _.jsEditor.CreateJSObject(
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
      _.entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
      _.jsEditor.EnableDisableAsyncFuncSettings("callQuotes", false, false); //OnPageLoad made true once mapped with widget
      _.jsEditor.EnableDisableAsyncFuncSettings("callTrump", false, true); //OnPageLoad made true once mapped with widget

      //Not working!
      // let onLoadToastMsg = [
      //   (("[Quotes, " + jsName) as string) +
      //     ".callQuotes] will be executed automatically on page load",
      //   (("[" + jsName) as string) +
      //     ".callQuotes, Quotes] will be executed automatically on page load",
      // ];
      // let regex = new RegExp(`${onLoadToastMsg.join("|")}`, "g");
      // cy.get(_.locators._toastMsg).contains(regex)

      _.entityExplorer.SelectEntityByName("Input1", "Widgets");
      _.propPane.UpdatePropertyFieldValue(
        "Default Value",
        "{{" + jsObjName + ".callQuotes.data}}",
      );
      cy.get(_.locators._toastMsg)
        .children()
        .should("contain", "Quotes") //Quotes api also since its .data is accessed in callQuotes()
        .and("contain", jsName as string)
        .and("contain", "will be executed automatically on page load");

      _.agHelper.WaitUntilToastDisappear("Quotes");

      _.entityExplorer.SelectEntityByName("Input2");
      _.propPane.UpdatePropertyFieldValue(
        "Default Value",
        "{{" + jsObjName + ".callTrump.data.message}}",
      );
      _.agHelper.WaitUntilToastDisappear(
        (("[" + jsName) as string) +
          ".callTrump] will be executed automatically on page load",
      );

      _.deployMode.DeployApp();

      //Commenting & changnig flow since either of confirmation modals can appear first!

      // //Confirmation - first JSObj then API
      // _.agHelper.AssertElementVisible(
      //   _.jsEditor._dialogBody((jsName as string) + ".callTrump"),
      // );
      // _.agHelper.ClickButton("No");
      // _.agHelper.WaitUntilToastDisappear(
      //   `${jsName + ".callTrump"} was cancelled`,
      // ); //When Confirmation is NO validate error toast!

      _.agHelper.ClickButton("No");
      _.agHelper.AssertContains("was cancelled");

      //One Quotes confirmation - for API true
      // _.agHelper.AssertElementVisible(_.jsEditor._dialogBody("Quotes"));
      // _.agHelper.ClickButton("No");
      // _.agHelper.WaitUntilToastDisappear("Quotes was cancelled");

      _.agHelper.ClickButton("No");
      _.agHelper.AssertContains("was cancelled");

      // //Another for API called via JS callQuotes()
      // _.agHelper.AssertElementVisible(_.jsEditor._dialogBody("Quotes"));
      // _.agHelper.ClickButton("No");

      _.agHelper.ClickButton("No");
      //_.agHelper.WaitUntilToastDisappear('The action "Quotes" has failed');No toast appears!

      _.agHelper.AssertElementAbsence(
        _.jsEditor._dialogBody("WhatTrumpThinks"),
      ); //Since JS call is NO, dependent API confirmation should not appear

      _.agHelper.RefreshPage();
      // _.agHelper.AssertElementVisible(
      //   _.jsEditor._dialogBody((jsName as string) + ".callTrump"),
      // );
      _.agHelper.AssertElementExist(_.jsEditor._dialogInDeployView);
      _.agHelper.ClickButton("Yes");

      _.agHelper.Sleep();
      //_.agHelper.AssertElementVisible(_.jsEditor._dialogBody("WhatTrumpThinks")); //Since JS call is Yes, dependent confirmation should appear aswell!
      _.agHelper.AssertElementExist(_.jsEditor._dialogInDeployView);
      _.agHelper.ClickButton("Yes");

      //_.agHelper.AssertElementVisible(_.jsEditor._dialogBody("Quotes"));
      _.agHelper.AssertElementExist(_.jsEditor._dialogInDeployView);
      _.agHelper.ClickButton("Yes");

      _.agHelper.Sleep(500);
      //_.agHelper.AssertElementVisible(_.jsEditor._dialogBody("Quotes"));
      _.agHelper.AssertElementExist(_.jsEditor._dialogInDeployView);
      _.agHelper.ClickButton("Yes");

      _.agHelper.Sleep(4000); //to let the api's call be finished & populate the text fields before validation!
      _.agHelper
        .GetText(_.locators._textAreainputWidgetv2InDeployed, "text", 1)
        .then(($quote) => cy.wrap($quote).should("not.be.empty"));

      _.agHelper
        .GetText(_.locators._textAreainputWidgetv2InDeployed)
        .then(($trump) => cy.wrap($trump).should("not.be.empty"));
    });

    //Resize!
    // ee.DragDropWidgetNVerify("inputwidgetv2", 100, 100);
    // cy.get("div.t--draggable-inputwidgetv2 > div.iPntND").invoke('css', 'width', '304')
    // cy.get("div.t--draggable-inputwidgetv2 > div.iPntND").invoke('attr', 'style', 'height: 304px')
  });

  it("8. Tc #1912 - API with OnPageLoad & Confirmation both enabled & called directly & setting previous Api's confirmation to false", () => {
    _.deployMode.NavigateBacktoEditor();
    _.agHelper.AssertElementExist(_.jsEditor._dialogInDeployView);
    _.agHelper.ClickButton("No");
    _.agHelper.AssertContains("was cancelled"); //_.agHelper.AssertContains("Quotes was cancelled");

    _.agHelper.WaitUntilAllToastsDisappear();
    _.agHelper.AssertElementExist(_.jsEditor._dialogInDeployView);
    _.agHelper.ClickButton("No"); //Ask Favour abt below
    //_.agHelper.ValidateToastMessage("callQuotes ran successfully"); //Verify this toast comes in EDIT page only

    _.agHelper.AssertElementExist(_.jsEditor._dialogInDeployView);
    _.agHelper.ClickButton("No");
    _.agHelper.AssertContains("was cancelled");
    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    cy.fixture("datasources").then((datasourceFormData) => {
      _.apiPage.CreateAndFillApi(
        datasourceFormData.randomCatfactUrl,
        "CatFacts",
      );
    });
    _.apiPage.ToggleOnPageLoadRun(true);
    _.apiPage.ToggleConfirmBeforeRunningApi(true);

    _.entityExplorer.SelectEntityByName("Image1", "Widgets");
    _.propPane.EnterJSContext(
      "onClick",
      `{{CatFacts.run(() => showAlert('Your cat fact is :'+ CatFacts.data,'success'), () => showAlert('Oh No!','error'))}}`,
    );

    _.entityExplorer.SelectEntityByName("Quotes", "Queries/JS");
    _.apiPage.ToggleOnPageLoadRun(false);
    _.entityExplorer.SelectEntityByName("WhatTrumpThinks");
    _.apiPage.ToggleOnPageLoadRun(false);

    _.entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
    _.jsEditor.EnableDisableAsyncFuncSettings("callQuotes", false, false); //OnPageLoad made true once mapped with widget
    _.jsEditor.EnableDisableAsyncFuncSettings("callTrump", false, false); //OnPageLoad made true once mapped with widget

    _.deployMode.DeployApp();
    _.agHelper.AssertElementVisible(_.jsEditor._dialogBody("CatFacts"));
    _.agHelper.ClickButton("No");
    _.agHelper.ValidateToastMessage("CatFacts was cancelled");

    _.agHelper.WaitUntilToastDisappear("CatFacts was cancelled");
    _.agHelper.GetNClick(_.locators._widgetInDeployed("imagewidget"));
    _.agHelper.AssertElementVisible(_.jsEditor._dialogBody("CatFacts"));
    _.agHelper.ClickButton("Yes");
    cy.get(_.locators._toastMsg).contains(/Your cat fact|Oh No/g);
    _.deployMode.NavigateBacktoEditor();
    _.agHelper.ClickButton("No");
  });

  it("9. Tc #1646, 60 - Honouring the order of execution & Bug 13826 + Bug 13646", () => {
    _.homePage.NavigateToHome();
    _.homePage.ImportApp("JSObjOnLoadApp.json");
    _.homePage.AssertImportToast();

    _.entityExplorer.ExpandCollapseEntity("Queries/JS");
    _.apiPage.CreateAndFillApi(
      "https://anapioficeandfire.com/api/books/{{this.params.id}}",
      "getBooks",
      30000,
    );
    //_.apiPage.OnPageLoadRun(true); //OnPageLoad made true after mapping to JSONForm
    _.apiPage.ToggleConfirmBeforeRunningApi(true);

    _.dataSources.CreateQueryFromOverlay(
      dsName,
      "SELECT distinct city FROM public.city order by city ASC",
      "getCitiesList",
    );

    // _.dataSources.NavigateFromActiveDS(dsName, true);
    // _.agHelper.GetNClick(_.dataSources._templateMenu);
    // _.agHelper.RenameWithInPane("getCitiesList");
    // _.dataSources.EnterQuery(
    //   "SELECT distinct city FROM public.city order by city ASC",
    // );

    _.jsEditor.CreateJSObject(
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

    _.jsEditor.EnableDisableAsyncFuncSettings("getId", false, true);
    _.jsEditor.EnableDisableAsyncFuncSettings("callBooks", false, true); //OnPageLoad will be made true after mapping to widget - onOptionChange

    cy.get("@jsObjName").then((jsObjName) => {
      jsName = jsObjName;

      //Bug 13826
      // _.dataSources.NavigateToActiveDSQueryPane(guid);
      // _.agHelper.GetNClick(_.dataSources._templateMenu);
      // _.agHelper.RenameWithInPane("getCountry");
      // _.dataSources.EnterQuery(
      //   "SELECT country FROM public.city as City join public.country Country on City.country_id=Country.country_id where City.city = {{" +
      //     jsObjName +
      //     ".getSelectedCity()}}",
      // );
      // _.apiPage.ConfirmBeforeRunningApi(true);

      _.entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
      //_.jsEditor.EnableDisableAsyncFuncSettings("callCountry", false, true); Bug # 13826

      _.entityExplorer.SelectEntityByName("Select1", "Widgets");
      _.propPane.UpdatePropertyFieldValue(
        "Options",
        `{{ getCitiesList.data.map((row) => {
          return { label: row.city, value: row.city }
       })
    }}`,
      );
      _.agHelper.ValidateToastMessage(
        "[getCitiesList] will be executed automatically on page load",
      );
      //Commented until Bug 13826 is fixed
      // _.propPane.EnterJSContext(
      //   "onOptionChange",
      //   `{{` +
      //     jsObjName +
      //     `.callCountry();
      //     Select1.selectedOptionValue? showAlert('Your country is: ' + getCountry.data[0].country, 'info'): null`,
      //   true,
      //   true,
      // );

      _.entityExplorer.SelectEntityByName("Image1");

      // _.propPane.EnterJSContext(
      //   "onClick",
      //   `{{` + jsObjName + `.callBooks()}}`,
      //   true,
      //   true,
      // );
      _.propPane.SelectJSFunctionToExecute(
        "onClick",
        jsName as string,
        "callBooks",
      ); //callBooks confirmation also does not appear due to 13646

      _.entityExplorer.SelectEntityByName("JSONForm1");
      _.propPane.UpdatePropertyFieldValue("Source Data", "{{getBooks.data}}");
      //this toast is not coming due to existing JSON date errors but its made true at API
      //_.agHelper.ValidateToastMessage("[getBooks] will be executed automatically on page load");
    });
  });

  it("10. Tc #1646 - Honouring the order of execution & Bug 13826 + Bug 13646 - Delpoy page", () => {
    _.deployMode.DeployApp();
    _.agHelper.AssertElementVisible(_.jsEditor._dialogBody("getBooks"));
    _.agHelper.ClickButton("No");
    _.agHelper.ValidateToastMessage("getBooks was cancelled");
    _.agHelper
      .GetText(_.locators._jsonFormInputField("name"), "val")
      .should("be.empty");
    _.agHelper
      .GetText(_.locators._jsonFormInputField("url"), "val")
      .should("be.empty");

    // Uncomment below aft Bug 13826 is fixed & add for Yes also!
    // _.agHelper.SelectDropDown("Akron");
    // _.agHelper.AssertElementPresence(_.jsEditor._dialogBody("getCountry"));
    // _.agHelper.ClickButton("No");

    _.agHelper.WaitUntilToastDisappear("getBooks was cancelled");
    _.agHelper.GetNClick(_.locators._widgetInDeployed("imagewidget"));
    _.agHelper.AssertElementVisible(_.jsEditor._dialogBody("getBooks"));
    _.agHelper.ClickButton("Yes");
    //callBooks, getId confirmations also expected aft bug 13646 is fixed & covering tc 1646

    _.agHelper
      .GetText(_.locators._jsonFormInputField("name"), "val")
      .should("not.be.empty");
    _.agHelper
      .GetText(_.locators._jsonFormInputField("url"), "val")
      .should("not.be.empty");
    //   //.then(($url) => expect($url).not.be.empty);//failing at time as its not waiting for timeout!

    _.deployMode.NavigateBacktoEditor();
    _.agHelper.AssertElementVisible(_.jsEditor._dialogBody("getBooks"));
    _.agHelper.ClickButton("No");
    _.agHelper.ValidateToastMessage("getBooks was cancelled");

    _.entityExplorer.SelectEntityByName(jsName as string, "Queries/JS");
    _.entityExplorer.ActionContextMenuByEntityName(
      "getCitiesList",
      "Delete",
      "Are you sure?",
    );
    _.entityExplorer.ActionContextMenuByEntityName(
      "getBooks",
      "Delete",
      "Are you sure?",
    );
    _.entityExplorer.ActionContextMenuByEntityName(
      jsName as string,
      "Delete",
      "Are you sure?",
      true,
    );
  });

  //it.skip("13. Tc # 57 - Multiple functions set to true for OnPageLoad & Confirmation before running + Bug 15340", () => {});
});
