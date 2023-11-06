import {
  dataSources,
  deployMode,
  locators,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "excludeForAirgap",
  "Google Sheets datasource row objects placeholder",
  function () {
    let pluginName = "Google Sheets";

    it("1. Verify GSheets dropdown options", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Google Sheets");
      VerifyFunctionDropdown([
        "Read / Write / Delete | Selected google sheets",
        "Read / Write / Delete | All google sheets",
        "Read / Write | All google sheets",
        "Read | All google sheets",
      ]);
      dataSources.SaveDSFromDialog(false);
    });

    function VerifyFunctionDropdown(scopeOptions: string[]) {
      agHelper.GetNClick(dataSources._gsScopeDropdown);
      cy.get(dataSources._gsScopeOptions).then(function ($ele) {
        expect($ele.eq(0).text()).to.be.oneOf(scopeOptions);
        expect($ele.eq(1).text()).to.be.oneOf(scopeOptions);
        expect($ele.eq(2).text()).to.be.oneOf(scopeOptions);
      });
      agHelper.GetNClick(dataSources._gsScopeDropdown);
    }

    it("2. Bug # 25004 - Verify Google Sheets documentation opens", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn(pluginName);
      agHelper.Sleep(); //for plugin page to settle
      deployMode.StubWindowNAssert(
        locators._learnMore,
        "querying-google-sheets#create-queries",
        "getPluginForm",
      );
      agHelper.GetNClick(locators._visibleTextSpan("Don't save"));
      agHelper.Sleep();
      agHelper.GoBack();
      agHelper.Sleep();
    });
  },
);
