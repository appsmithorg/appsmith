import {
  apiPage,
  draggableWidgets,
  entityExplorer,
  table,
  dataManager,
  dataSources,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";

describe("Test Create Api and Bind to Table widget V2", function () {
  it("1. Test_Add users api, execute it and connect to a table", function () {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE);
    entityExplorer.NavigateToSwitcher("Explorer");

    apiPage.CreateAndFillApi(
      dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
    );
    apiPage.RunAPI();
    dataSources.AddSuggestedWidget(
      Widgets.Table,
      dataSources._addSuggestedExisting,
    );
    table.WaitUntilTableLoad(0, 0, "v2");
    propPane.AssertPropertiesDropDownCurrentValue("Table data", "Api1");
  });
});
