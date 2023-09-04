import {
  agHelper,
  dataManager,
  dataSources,
  propPane,
  table,
  apiPage,
} from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";

describe("Test Create Api and Bind to Table widget", function () {
  before(() => {
    agHelper.AddDsl("tableWidgetDsl");
  });

  it("1. Test_Add users api, execute it and go to sniping mode.", function () {
    apiPage.CreateAndFillApi(
      dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
    );
    apiPage.RunAPI();
    dataSources.AddSuggestedWidget(
      Widgets.Table,
      false,
      0,
      dataSources._addSuggestedExisting,
    );
    table.WaitUntilTableLoad(0, 0, "v1");
    propPane.AssertPropertiesDropDownCurrentValue("Table data", "Api1");
  });
});
