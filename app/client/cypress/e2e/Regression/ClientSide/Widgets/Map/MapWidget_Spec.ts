/// <reference types="Cypress" />
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

const location = [
  {
    lat: 28.7040592,
    long: 77.10249019999999,
    title: "Delhi, India",
  },
  {
    lat: 28.4594965,
    long: 77.0266383,
    title: "Gurugram, Haryana, India",
  },
  {
    lat: 40.7127753,
    long: -74.0059728,
    title: "New York, NY, USA",
  },
];

describe(
  "Map Widget",
  { tags: ["@tag.Widget", "@tag.Maps", "@tag.Visual", "@tag.Binding"] },
  function () {
    it("1.Drag Map Widget and Verify the Map Widget with Initial Location", () => {
      //Add map and verify
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MAP, 200, 200);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.MAP));
      agHelper.VerifySnapshot(locators._root, "mapsimple");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Map1", EntityType.Widget);

      // Add Initial location and verify
      propPane.TypeTextIntoField("Initial location", "New York, NY, USA");
      agHelper.PressEnter();
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.MAP));
      agHelper.VerifySnapshot(locators._root, "mapWithInitalLocation");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Map1", EntityType.Widget);

      // convert Initial location to JS, update and verify
      propPane.EnterJSContext("Initial location", JSON.stringify(location[0]));
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.MAP));
      agHelper.VerifySnapshot(locators._root, "mapWithinItalLocationAsJS");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Map1", EntityType.Widget);
    });

    it("2.Verify the Map Widget with Default markers", () => {
      // With single default marker
      propPane.TypeTextIntoField(
        "Default Markers",
        JSON.stringify(location.slice(0, 1)),
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.MAP));
      agHelper.VerifySnapshot(locators._root, "mapWithDefaultMarker1");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Map1", EntityType.Widget);

      // With multiple default marker
      propPane.TypeTextIntoField(
        "Default Markers",
        JSON.stringify(location.slice(0, 2)),
      );
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.MAP));
      agHelper.VerifySnapshot(locators._root, "mapWithDefaultMarker2");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Map1", EntityType.Widget);
    });

    it("3.Verify the Map Widget with zoom level", () => {
      // With multiple default marker
      propPane.SetZoomLevel(70);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.MAP));
      agHelper.VerifySnapshot(locators._root, "mapWithDefaultZoomOut");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Map1", EntityType.Widget);

      // Zoom in and verify
      propPane.SetZoomLevel(30);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.MAP));
      agHelper.VerifySnapshot(locators._root, "mapWithDefaultZoomIn");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Map1", EntityType.Widget);
    });

    it("4.1 Verify the Map Widget with different general settings", () => {
      // With visibility off
      propPane.TogglePropertyState("Visible", "Off");
      deployMode.DeployApp();
      agHelper.VerifySnapshot(locators._root, "mapWithVisibilityOff");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Map1", EntityType.Widget);

      // Convert visibility to JS and set the visibility "On" and verify
      propPane.EnterJSContext("Visible", "true");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.MAP));
      agHelper.VerifySnapshot(locators._root, "mapWithVisibilityOnWithJS");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Map1", EntityType.Widget);

      // Toggle off Enable pick location and verify
      propPane.TogglePropertyState("Enable pick location", "Off");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.MAP));
      agHelper.VerifySnapshot(locators._root, "mapWithPickLocationOff");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Map1", EntityType.Widget);

      // Toggle off Map & marker centering and verify
      propPane.TogglePropertyState("Map & marker centering", "Off");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.MAP));
      agHelper.VerifySnapshot(locators._root, "mapWithMapNMarkerCenteringOff");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Map1", EntityType.Widget);
    });

    it("4.2 Verify the Map Widget with different general settings", () => {
      // Toggle On Enabling clustering and verify
      propPane.TogglePropertyState("Enable clustering", "On");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.MAP));
      agHelper.VerifySnapshot(locators._root, "mapWithEnablingClusteringON");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Map1", EntityType.Widget);

      // Convert Enabling clustering and disable it and verify
      propPane.EnterJSContext("Enable clustering", "false");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.MAP));
      agHelper.VerifySnapshot(locators._root, "mapWithEnablingClusteringOff");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Map1", EntityType.Widget);

      // Toggle off Enable search location and verify
      propPane.TogglePropertyState("Enable search location", "Off");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.MAP));
      agHelper.VerifySnapshot(locators._root, "mapWithEnableSearchLocationOff");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Map1", EntityType.Widget);
    });

    it("5 Verify the style changes", () => {
      // Change border radius and verify
      propPane.MoveToTab("Style");
      propPane.EnterJSContext("Border radius", "1.5rem");
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.MAP));
      agHelper.VerifySnapshot(locators._root, "mapWithBorderRadius");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Map1", EntityType.Widget);

      // Change box shadow and verify
      const boxShadow =
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
      propPane.MoveToTab("Style");
      propPane.EnterJSContext("Box shadow", boxShadow);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.MAP));
      agHelper.VerifySnapshot(locators._root, "mapWithBoxShadow");
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Map1", EntityType.Widget);
    });
  },
);
