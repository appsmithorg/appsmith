/// <reference types="Cypress" />
import publishWidgetspage from "../../../../../locators/publishWidgetspage.json";
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
  `//*[name()='svg']//*[name()='text' and contains(text(), '${text}')]`;

describe(
  "Map Chart Widget Functionality",
  { tags: ["@tag.Widget", "@tag.Maps", "@tag.Visual"] },
  function () {
    it("1. Drag and drop a Map Chart widget and verify", function () {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.MAPCHART, 200, 200);
      agHelper.AssertElementExist(_mapChartPlot("AS"));
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.MAPCHART),
      );
      agHelper.AssertElementExist(_mapChartPlot("AS"));
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);
    });

    it("2.1 Update the Map type to different types and verify - part1", function () {
      // Change the map type to World with Antarctica and verify the number of entities
      propPane.SelectPropertiesDropDown("Map type", "World with Antarctica");
      agHelper.AssertElementExist(_mapChartPlot("AT"));

      // Change the map type to Europe and verify the number of entities
      propPane.SelectPropertiesDropDown("Map type", "Europe");
      agHelper.AssertElementExist(_mapChartPlot("FR"));

      // Change the map type to North America and verify the number of entities
      propPane.SelectPropertiesDropDown("Map type", "North America");
      agHelper.AssertElementExist(_mapChartPlot("CA"));

      // Change the map type to South America and verify the number of entities
      propPane.SelectPropertiesDropDown("Map type", "South America");
      agHelper.AssertElementExist(_mapChartPlot("BR"));
    });

    it("2.2 Update the Map type to different types and verify - part2", function () {
      // Change the map type to Oceania and verify the number of entities
      propPane.SelectPropertiesDropDown("Map type", "Oceania");
      agHelper.AssertElementExist(_mapChartPlot("AU"));

      // Change the map type to Africa and verify the number of entities
      propPane.SelectPropertiesDropDown("Map type", "Africa");
      agHelper.AssertElementExist(_mapChartPlot("ZA"));

      // Change the map type to USA and verify the number of entities
      propPane.SelectPropertiesDropDown("Map type", "USA");
      agHelper.AssertElementExist(_mapChartPlot("TX"));

      // Change the map type to Asia and verify the number of entities
      propPane.SelectPropertiesDropDown("Map type", "Asia");
      agHelper.AssertElementExist(_mapChartPlot("IN"));
    });

    it("3. Update the Chart data and verify", function () {
      const data = [
        {
          id: "014",
          value: "2",
        },
      ];

      propPane.TypeTextIntoField("Chart data", JSON.stringify(data));
      agHelper.AssertElementExist(_mapChartPlot("IN: 2"));
    });

    it("4. Verify General settings", function () {
      // update the title and verify
      propPane.TypeTextIntoField("Title", "App Sign Up");
      agHelper.AssertText(_mapChartCaption, "text", "App Sign Up");

      // update the show labels using toggle and verify
      propPane.TogglePropertyState("Show Labels", "Off");
      agHelper.AssertElementAbsence(_mapChartPlot("IN: 2"));

      // update the visibility using JS and verify
      propPane.EnterJSContext("Show Labels", "true");
      agHelper.AssertElementExist(_mapChartPlot("IN: 2"));
    });

    it("5. Update onDataPointClick and Verify", function () {
      // Create the Alert Modal and verify Modal name
      propPane.SelectPropertiesDropDown("Map type", "Asia");
      propPane.SelectPlatformFunction("onDataPointClick", "Show alert");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Data Point {{MapChart1.selectedDataPoint.label}} Clicked",
      );

      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.GetElement(_mapChartPlot("IN: 2")).click();

      agHelper.ValidateToastMessage("Data Point India Clicked");
      agHelper.GetNClick(locators._exitPreviewMode);
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);

      // Convert the onDataPointClick to JS, update and verify
      propPane.EnterJSContext(
        "onDataPointClick",
        "{{showAlert('Converted to Js and clicked '+ MapChart1.selectedDataPoint.label)}}",
      );
      agHelper.GetNClick(locators._enterPreviewMode);
      agHelper.GetElement(_mapChartPlot("IN: 2")).click();
      agHelper.ValidateToastMessage("Converted to Js and clicked India");
      agHelper.GetNClick(locators._exitPreviewMode);
      EditorNavigation.SelectEntityByName("MapChart1", EntityType.Widget);
    });

    it("6. Verify the style changes", function () {
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
      cy.get(publishWidgetspage.mapChartWidget)
        .find("svg")
        .find("path")
        .should("have.attr", "fill", "#aeaeae");

      // Change border radius and verify
      propPane.MoveToTab("Style");
      propPane.EnterJSContext("Border radius", "1.5rem");
      cy.get(publishWidgetspage.mapChartWidget)
        .find(publishWidgetspage.mapChartWidgetContainer)
        .should("have.css", "border-radius", "24px");

      const boxShadow =
        "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)";
      propPane.MoveToTab("Style");
      propPane.EnterJSContext("Box shadow", boxShadow);
      cy.get(publishWidgetspage.mapChartWidget)
        .find(publishWidgetspage.mapChartWidgetContainer)
        .should(
          "have.css",
          "box-shadow",
          "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
        );
    });
  },
);
