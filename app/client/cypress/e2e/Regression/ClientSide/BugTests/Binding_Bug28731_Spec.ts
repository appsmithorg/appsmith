import OneClickBindingLocator from "../../../../locators/OneClickBindingLocator";
import {
  agHelper,
  entityExplorer,
  apiPage,
  dataManager,
  draggableWidgets,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "transformed one-click binding",
  { tags: ["@tag.JS", "@tag.Binding", "@tag.Binding"] },
  function () {
    it("Transforms API data to match widget exppected type ", function () {
      // Create anAPI that mreturns object response
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiObjectUrl,
      );
      apiPage.RunAPI();

      // Table
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 300, 300);

      agHelper.GetNClick(OneClickBindingLocator.datasourceDropdownSelector);
      agHelper.GetNClick(
        OneClickBindingLocator.datasourceQuerySelector("Api1"),
      );
      propPane.ToggleJSMode("Table Data", true);
      agHelper.AssertContains("{{Api1.data.users}}");

      // Select widget
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.SELECT, 100, 100);

      propPane.ToggleJSMode("sourcedata", false);
      agHelper.GetNClick(OneClickBindingLocator.datasourceDropdownSelector);
      agHelper.GetNClick(
        OneClickBindingLocator.datasourceQuerySelector("Api1"),
      );
      propPane.ToggleJSMode("Source Data", true);
      agHelper.AssertContains(
        "{{Api1.data.users.map( (obj) =>{ return  {'label': obj.address, 'value': obj.avatar } })}}",
      );
    });
  },
);
