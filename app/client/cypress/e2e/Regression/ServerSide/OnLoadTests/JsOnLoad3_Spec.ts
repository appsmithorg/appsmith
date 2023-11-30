import {
  agHelper,
  apiPage,
  dataSources,
  deployMode,
  entityExplorer,
  entityItems,
  homePage,
  jsEditor,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";

let dsName: any, jsName: any;

describe("JSObjects OnLoad Actions tests", function () {
  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  it("1. Tc 60, 1912 - Verify JSObj calling API - OnPageLoad calls & Confirmation No then Yes!", () => {
    EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
    agHelper.AddDsl("JSApiOnLoadDsl", locators._widgetInCanvas("imagewidget"));
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
    });
    cy.fixture("datasources").then((datasourceFormData: any) => {
      AppSidebar.navigate(AppSidebarButton.Editor);
      PageLeftPane.expandCollapseItem("Queries/JS");
      apiPage.CreateAndFillApi(
        "https://api.forismatic.com/api/1.0/?method=getQuote&lang=en&format=json",
        "Quotes",
        30000,
      );
      apiPage.ToggleConfirmBeforeRunning(true);

      apiPage.CreateAndFillApi(
        datasourceFormData["randomTrumpApi"],
        "WhatTrumpThinks",
        30000,
      );
      apiPage.ToggleConfirmBeforeRunning(true);
    });
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
      EditorNavigation.SelectEntityByName(
        jsName as string,
        EntityType.JSObject,
      );
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
      // cy.get(locators._toastMsg).contains(regex)

      EditorNavigation.SelectEntityByName("Input1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Default value",
        "{{" + jsObjName + ".callQuotes.data}}",
      );
      cy.get(locators._toastMsg)
        .children()
        .should("contain", "Quotes") //Quotes api also since its .data is accessed in callQuotes()
        .and("contain", jsName as string)
        .and("contain", "will be executed automatically on page load");

      //agHelper.WaitUntilToastDisappear("Quotes");

      EditorNavigation.SelectEntityByName("Input2", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Default value",
        "{{" + jsObjName + ".callTrump.data}}",
      );

      agHelper.AssertContains(
        (("[" + jsName) as string) +
          ".callTrump] will be executed automatically on page load",
        "be.visible",
        locators._toastMsg,
      );

      // agHelper.WaitUntilToastDisappear(
      //   (("[" + jsName) as string) +
      //     ".callTrump] will be executed automatically on page load",
      // );

      deployMode.DeployApp();

      //Commenting & changnig flow since either of confirmation modals can appear first!

      // //Confirmation - first JSObj then API
      // agHelper.AssertElementVisibility(
      //   jsEditor._dialogBody((jsName as string) + ".callTrump"),
      // );
      // jsEditor.ConfirmationClick("No");
      // agHelper.WaitUntilToastDisappear(
      //   `${jsName + ".callTrump"} was cancelled`,
      // ); //When Confirmation is NO validate error toast!

      jsEditor.ConfirmationClick("No");
      agHelper.AssertContains("cancelled"); //Quotes
      //One Quotes confirmation - for API true
      // agHelper.AssertElementVisibility(jsEditor._dialogBody("Quotes"));
      // jsEditor.ConfirmationClick("No");
      agHelper.WaitUntilAllToastsDisappear();

      jsEditor.ConfirmationClick("No");
      agHelper.AssertContains("cancelled"); //callTrump

      // //Another for API called via JS callQuotes()
      // agHelper.AssertElementVisibility(jsEditor._dialogBody("Quotes"));
      // jsEditor.ConfirmationClick("No");
      //agHelper.WaitUntilToastDisappear('The action "Quotes" has failed');No toast appears!

      agHelper.AssertElementAbsence(jsEditor._dialogBody("WhatTrumpThinks")); //Since JS call is NO, dependent API confirmation should not appear

      agHelper.RefreshPage("viewPage");
      // agHelper.AssertElementVisibility(
      //   jsEditor._dialogBody((jsName as string) + ".callTrump"),
      // );
      agHelper.AssertElementExist(jsEditor._dialogInDeployView);
      jsEditor.ConfirmationClick("Yes"); //call trumpy - jsobj

      //agHelper.GetNClick(".ads-v2-button__content-children", 1, true);
      agHelper.Sleep(2000);

      //agHelper.AssertElementVisibility(jsEditor._dialogBody("WhatTrumpThinks")); //Since JS call is Yes, dependent confirmation should appear aswell!
      agHelper.AssertElementExist(jsEditor._dialogInDeployView);
      jsEditor.ConfirmationClick("Yes"); //trumpy - api
      agHelper.Sleep(3000);

      //agHelper.AssertElementVisibility(jsEditor._dialogBody("Quotes"));
      agHelper.AssertElementExist(jsEditor._dialogInDeployView);
      jsEditor.ConfirmationClick("Yes"); //quotes - api

      //agHelper.Sleep(2000);
      //agHelper.AssertElementVisibility(jsEditor._dialogBody("Quotes"));
      //agHelper.AssertElementExist(jsEditor._dialogInDeployView);
      //agHelper.GetNClick(".ads-v2-button__content-children", 1, true);
      agHelper.Sleep(4000); //to let the api's call be finished & populate the text fields before validation!
      agHelper
        .GetText(locators._textAreainputWidgetv2InDeployed, "text", 1)
        .then(($quote: any) => cy.wrap($quote).should("not.be.empty"));

      agHelper
        .GetText(locators._textAreainputWidgetv2InDeployed)
        .then(($trump: any) => cy.wrap($trump).should("not.be.empty"));
    });

    //Resize!
    // ee.DragDropWidgetNVerify("inputwidgetv2", 100, 100);
    // cy.get("div.t--draggable-inputwidgetv2 > div.iPntND").invoke('css', 'width', '304')
    // cy.get("div.t--draggable-inputwidgetv2 > div.iPntND").invoke('attr', 'style', 'height: 304px')
  });

  it("2. Tc #1912 - API with OnPageLoad & Confirmation both enabled & called directly & setting previous Api's confirmation to false", () => {
    deployMode.NavigateBacktoEditor();
    agHelper.AssertElementExist(jsEditor._dialogInDeployView);
    jsEditor.ConfirmationClick("No");
    agHelper.AssertContains("cancelled"); //agHelper.AssertContains("Quotes was cancelled");

    agHelper.WaitUntilAllToastsDisappear();
    agHelper.AssertElementExist(jsEditor._dialogInDeployView);
    jsEditor.ConfirmationClick("No"); //Ask Favour abt below
    //agHelper.ValidateToastMessage("callQuotes ran successfully"); //Verify this toast comes in EDIT page only
    agHelper.AssertContains("cancelled");

    jsEditor.ConfirmationClick("No");
    // agHelper.AssertElementExist(jsEditor._dialogInDeployView);
    // jsEditor.ConfirmationClick("No");
    agHelper.AssertContains("cancelled");
    PageLeftPane.expandCollapseItem("Queries/JS");
    cy.fixture("datasources").then((datasourceFormData) => {
      apiPage.CreateAndFillApi(datasourceFormData.randomCatfactUrl, "CatFacts");
    });
    apiPage.ToggleOnPageLoadRun(true);
    apiPage.ToggleConfirmBeforeRunning(true);

    EditorNavigation.SelectEntityByName("Image1", EntityType.Widget);
    propPane.EnterJSContext(
      "onClick",
      `{{CatFacts.run(() => showAlert('Your cat fact is :'+ CatFacts.data,'success'), () => showAlert('Oh No!','error'))}}`,
    );

    EditorNavigation.SelectEntityByName("Quotes", EntityType.JSObject);
    apiPage.ToggleOnPageLoadRun(false);
    EditorNavigation.SelectEntityByName("WhatTrumpThinks", EntityType.JSObject);
    apiPage.ToggleOnPageLoadRun(false);

    EditorNavigation.SelectEntityByName(jsName as string, EntityType.JSObject);
    jsEditor.EnableDisableAsyncFuncSettings("callQuotes", false, false); //OnPageLoad made true once mapped with widget
    jsEditor.EnableDisableAsyncFuncSettings("callTrump", false, false); //OnPageLoad made true once mapped with widget

    deployMode.DeployApp();
    agHelper.AssertElementVisibility(jsEditor._dialogBody("CatFacts"));
    jsEditor.ConfirmationClick("No");
    agHelper.ValidateToastMessage("CatFacts was cancelled");

    agHelper.WaitUntilToastDisappear("CatFacts was cancelled");
    agHelper.GetNClick(locators._widgetInDeployed("imagewidget"));
    agHelper.AssertElementVisibility(jsEditor._dialogBody("CatFacts"));
    jsEditor.ConfirmationClick("Yes");
    cy.get(locators._toastMsg).contains(/Your cat fact|Oh No/g);
    deployMode.NavigateBacktoEditor();
    jsEditor.ConfirmationClick("No");
  });

  it("3. Tc #1646, 60 - Honouring the order of execution & Bug 13826 + Bug 13646", () => {
    homePage.NavigateToHome();
    homePage.ImportApp("JSObjOnLoadApp.json");
    homePage.AssertImportToast();

    PageLeftPane.expandCollapseItem("Queries/JS");
    apiPage.CreateAndFillApi(
      "https://anapioficeandfire.com/api/books/{{this.params.id}}",
      "getBooks",
      30000,
    );
    //apiPage.OnPageLoadRun(true); //OnPageLoad made true after mapping to JSONForm
    apiPage.ToggleConfirmBeforeRunning(true);

    dataSources.CreateQueryFromOverlay(
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

      EditorNavigation.SelectEntityByName(
        jsName as string,
        EntityType.JSObject,
      );
      //jsEditor.EnableDisableAsyncFuncSettings("callCountry", false, true); Bug # 13826

      EditorNavigation.SelectEntityByName("Select1", EntityType.Widget);
      propPane.EnterJSContext(
        "Source Data",
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

      EditorNavigation.SelectEntityByName("Image1", EntityType.Widget);

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

      EditorNavigation.SelectEntityByName("JSONForm1", EntityType.Widget);
      propPane.EnterJSContext("sourcedata", "{{getBooks.data}}", true, false);
      //this toast is not coming due to existing JSON date errors but its made true at API
      //agHelper.ValidateToastMessage("[getBooks] will be executed automatically on page load");
    });
  });

  it("4. Tc #1646 - Honouring the order of execution & Bug 13826 + Bug 13646 - Delpoy page", () => {
    deployMode.DeployApp();
    agHelper.AssertElementVisibility(jsEditor._dialogBody("getBooks"));
    jsEditor.ConfirmationClick("No");
    agHelper.ValidateToastMessage("getBooks was cancelled");
    agHelper
      .GetText(locators._jsonFormInputField("name"), "val")
      .should("be.empty");
    agHelper
      .GetText(locators._jsonFormInputField("url"), "val")
      .should("be.empty");

    // Uncomment below aft Bug 13826 is fixed & add for Yes also!
    // agHelper.SelectDropDown("Akron");
    // agHelper.AssertElementPresence(jsEditor._dialogBody("getCountry"));
    // jsEditor.ConfirmationClick("No");

    agHelper.WaitUntilToastDisappear("getBooks was cancelled");
    agHelper.GetNClick(locators._widgetInDeployed("imagewidget"));
    agHelper.AssertElementVisibility(jsEditor._dialogBody("getBooks"));
    jsEditor.ConfirmationClick("Yes");
    //callBooks, getId confirmations also expected aft bug 13646 is fixed & covering tc 1646

    agHelper
      .GetText(locators._jsonFormInputField("name"), "val")
      .should("not.be.empty");
    agHelper
      .GetText(locators._jsonFormInputField("url"), "val")
      .should("not.be.empty");
    //   //.then(($url) => expect($url).not.be.empty);//failing at time as its not waiting for timeout!

    deployMode.NavigateBacktoEditor();
    agHelper.AssertElementVisibility(jsEditor._dialogBody("getBooks"));
    jsEditor.ConfirmationClick("No");
    agHelper.ValidateToastMessage("getBooks was cancelled");

    EditorNavigation.SelectEntityByName(jsName as string, EntityType.JSObject);
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "getCitiesList",
      action: "Delete",
      entityType: entityItems.Query,
    });
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: "getBooks",
      action: "Delete",
      entityType: entityItems.Query,
    });
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: jsName as string,
      action: "Delete",
      entityType: entityItems.Query,
    });
  });

  //it.skip("13. Tc # 57 - Multiple functions set to true for OnPageLoad & Confirmation before running + Bug 15340", () => {});
});
