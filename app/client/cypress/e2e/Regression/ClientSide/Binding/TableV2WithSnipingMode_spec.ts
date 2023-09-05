import {
  agHelper,
  apiPage,
  table,
  dataManager,
  dataSources,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";

describe("Test Create Api and Bind to Table widget V2", function () {
  before(() => {
    agHelper.AddDsl("tableV2WidgetDsl");
  });

  it("1. Test_Add users api, execute it and connect to a table", function () {
    apiPage.CreateAndFillApi(
      dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
    );
    apiPage.RunAPI();
    dataSources.AddSuggestedWidget(Widgets.Table);
    table.WaitUntilTableLoad(0, 0, "v2");
    propPane.AssertPropertiesDropDownCurrentValue("Table data", "Api1");
  });
});
