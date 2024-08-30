/// <reference types="Cypress" />
import viewWidgetsPage from "../../../../../locators/ViewWidgets.json";
import {
  agHelper,
  entityExplorer,
  propPane,
  draggableWidgets,
  deployMode,
  locators,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const _mapChartCaption = "text:last-child";
const _mapChartPlot = (text: string) =>
  "//text()[contains(., '" + text + "')]/..";

describe(
  "Map Chart Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Maps", "@tag.Visual"] },
  function () {
    it("1. Drag and drop a Map Chart widget and verify", function () {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MAPCHART, 200, 200);
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.VerifySnapshot(locators._root, "mapchartsimple");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);
    });

    it("2.1 Update the Map type to different types and verify - part1", function () {
      // Change the map type to World with Antarctica and verify the number of entities
      propPane.SelectPropertiesDropDown("Map type", "World with Antarctica");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.VerifySnapshot(locators._root, "mapwithantarctica");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);

      // Change the map type to World and verify the number of entities
      propPane.SelectPropertiesDropDown("Map type", "World");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.VerifySnapshot(locators._root, "mapwithworld");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);

      // Change the map type to Europe and verify the number of entities
      propPane.SelectPropertiesDropDown("Map type", "Europe");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.VerifySnapshot(locators._root, "mapwitheurope");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);

      // Change the map type to North America and verify the number of entities
      propPane.SelectPropertiesDropDown("Map type", "North America");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.VerifySnapshot(locators._root, "mapwithnorthamerica");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);

      // Change the map type to South America and verify the number of entities
      propPane.SelectPropertiesDropDown("Map type", "South America");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.VerifySnapshot(locators._root, "mapwithsouthamerica");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);
    });

    it("2.2 Update the Map type to different types and verify - part2", function () {
      // Change the map type to Oceania and verify the number of entities
      propPane.SelectPropertiesDropDown("Map type", "Oceania");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.VerifySnapshot(locators._root, "mapwithoceania");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);

      // Change the map type to Africa and verify the number of entities
      propPane.SelectPropertiesDropDown("Map type", "Africa");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.VerifySnapshot(locators._root, "mapwithafrica");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);

      // Change the map type to USA and verify the number of entities
      propPane.SelectPropertiesDropDown("Map type", "USA");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.VerifySnapshot(locators._root, "mapwithusa");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);

      // Change the map type to Asia and verify the number of entities
      propPane.SelectPropertiesDropDown("Map type", "Asia");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.VerifySnapshot(locators._root, "mapwithasia");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);
    });

    it("3. Update the Chart data and verify", function () {
      const data = [
        {
          id: "014",
          value: "2",
        },
      ];

      propPane.TypeTextIntoField("Chart data", JSON.stringify(data));
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.VerifySnapshot(locators._root, "mapwithcustomdata");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);
    });

    it("4. Verify General settings", function () {
      // update the title and verify
      propPane.TypeTextIntoField("Title", "App Sign Up");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.AssertText(_mapChartCaption, "text", "App Sign Up");
      agHelper.VerifySnapshot(locators._root, "mapwithcustomtitle");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);

      // update the visibility using toggle and verify
      propPane.TogglePropertyState("Visible", "Off");
      deployMode.DeployApp();
      agHelper.AssertElementAbsence(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.VerifySnapshot(locators._root, "mapwithvisibilityoff");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);

      // update the visibility using JS and verify
      propPane.EnterJSContext("Visible", "true");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.VerifySnapshot(locators._root, "mapwithvisibilityon");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);

      // update the show labels using toggle and verify
      propPane.TogglePropertyState("Show Labels", "Off");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.VerifySnapshot(locators._root, "mapwithshowlabelsoff");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);

      // update the visibility using JS and verify
      propPane.EnterJSContext("Show Labels", "true");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.VerifySnapshot(locators._root, "mapwithshowlableson");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);
    });

    it.skip("5. Update onDataPointClick and Verify", function () {
      // Create the Alert Modal and verify Modal name
      propPane.SelectPropertiesDropDown("Map type", "Asia");
      propPane.SelectPlatformFunction("onDataPointClick", "Show alert");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Data Point {{MapChart1.selectedDataPoint.label}} Clicked",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.GetNClick(_mapChartPlot("RU: 1.30"), 0, true);
      agHelper.ValidateToastMessage("Data Point Russian Federation Clicked");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);

      // Convert the onDataPointClick to JS, update and verify
      propPane.EnterJSContext(
        "onDataPointClick",
        "{{showAlert('Converted to Js and clicked '+ MapChart1.selectedDataPoint.label)}}",
      );
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.GetNClick(_mapChartPlot("CN: .40"), 0, true);
      agHelper.ValidateToastMessage("Converted to Js and clicked China");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);
    });

    it.skip("6. Verify the style changes", function () {
      // Change Color Range and verify
      const colorRange = [
        {
          minValue: 2,
          maxValue: 3,
          code: "#000",
        },
      ];
      propPane.MoveToTab("Style");
      propPane.TypeTextIntoField("Color Range", JSON.stringify(colorRange));
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.VerifySnapshot(locators._root, "mapChartWithColorRange");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);

      // Change border radius and verify
      propPane.MoveToTab("Style");
      propPane.EnterJSContext("Border radius", "1.5rem");
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.VerifySnapshot(locators._root, "mapChartWithBorderRadius");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);

      // Change box shadow and verify
      const boxShadow =
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
      propPane.MoveToTab("Style");
      propPane.EnterJSContext("Box shadow", boxShadow);
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.VerifySnapshot(locators._root, "mapChartWithBoxShadow");
      deployMode.NavigateBacktoEditor();
    });
  },
);
