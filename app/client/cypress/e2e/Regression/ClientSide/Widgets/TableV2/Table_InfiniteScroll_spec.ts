import OneClickBindingLocator from "../../../../../locators/OneClickBindingLocator";
import { featureFlagIntercept } from "../../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  assertHelper,
  dataSources,
  deployMode,
  entityExplorer,
  locators,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  AppSidebar,
  AppSidebarButton,
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";
import { OneClickBinding } from "../../OneClickBinding/spec_utility";

const oneClickBinding = new OneClickBinding();

describe(
  "Table widget - Infinite Scroll tests",
  { tags: ["@tag.Widget", "@tag.Table"] },
  () => {
    before(() => {
      // Enable the infinite scroll feature flag
      featureFlagIntercept({
        release_table_infinitescroll_enabled: true,
      });

      let dsName: any = "";
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
      });
      // Create a new page and add a table widget
      AppSidebar.navigate(AppSidebarButton.Editor);
      entityExplorer.DragNDropWidget("tablewidgetv2", 350, 500);
      assertHelper.AssertNetworkStatus("updateLayout");
      agHelper.GetNClick(locators._createNew);
      entityExplorer.DragNDropWidget("textwidget", 100, 100);
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      oneClickBinding.ChooseAndAssertForm(dsName, dsName, "public.astronauts");
      agHelper.GetNClick(OneClickBindingLocator.connectData);
      agHelper.AssertClassExists(locators._jsToggle("tabledata"), "is-active");
    });

    it("1. should enable infinite scroll and verify records are loaded automatically when scrolling", () => {
      // Enable infinite scroll in the property pane
      propPane.TogglePropertyState("Infinite scroll", "On");

      // Wait for network call to complete
      assertHelper.AssertNetworkStatus("@postExecute", 200);

      // Verify initial rows are visible
      table.ReadTableRowColumnData(0, 1, "v2").then(($cellData) => {
        expect($cellData).to.not.be.empty;
      });

      table.ReadTableRowColumnData(1, 1, "v2").then(($cellData) => {
        expect($cellData).to.not.be.empty;
      });

      // Store the current number of rows
      let initialRowCount = 0;
      cy.get(".t--widget-tablewidgetv2 .tbody .tr").then(($rows) => {
        initialRowCount = $rows.length;

        // Scroll vertically to trigger infinite scroll
        cy.get(".t--widget-tablewidgetv2 .virtual-list").scrollTo(0, 1000, {
          duration: 500,
        });

        // Wait for network call to complete after scrolling
        assertHelper.AssertNetworkStatus("@postExecute", 200);

        // Use waitUntil to wait for the condition that more rows are loaded
        cy.waitUntil(
          () =>
            cy
              .get(".t--widget-tablewidgetv2 .tbody .tr")
              .then(($newRows) => $newRows.length > initialRowCount),
          {
            errorMsg: "New rows were not loaded after scrolling",
            timeout: 10000,
            interval: 500,
          },
        );

        // Verify more rows were loaded
        cy.get(".t--widget-tablewidgetv2 .tbody .tr").then(($newRows) => {
          const newRowCount = $newRows.length;
          expect(newRowCount).to.be.greaterThan(initialRowCount);
        });
      });
    });

    it("2. should test row selection with infinite scroll", () => {
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Text", "{{Table1.selectedRowIndex}}");

      cy.get(".t--widget-tablewidgetv2 .virtual-list").scrollTo("topLeft");

      // Select a row
      table.SelectTableRow(1, 0, true, "v2");

      agHelper.GetNAssertElementText(locators._textWidget, "1", "contain.text");

      propPane.TogglePropertyState("Enable multi-row selection", "On");
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue(
        "Text",
        "{{Table1.selectedRowIndices}}",
      );

      // Select multiple rows
      table.SelectTableRow(1, 0, true, "v2");
      table.SelectTableRow(2, 0, true, "v2");

      agHelper.GetNAssertElementText(
        locators._textWidget,
        "[  0,  1,  2]",
        "contain.text",
      );
    });

    it("3. should test triggeredRows with infinite scroll", () => {
      propPane.TogglePropertyState("Enable multi-row selection", "Off");
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("Text", "{{Table1.selectedRowIndex}}");

      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);

      cy.get(".t--widget-tablewidgetv2 .virtual-list").scrollTo("topLeft");
      // Add a button column for triggering actions
      table.AddColumn("action");

      table.ChangeColumnType("action", "Button");
      // Changing the computed value (data) to "orderAmount"
      propPane.UpdatePropertyFieldValue("Text", "Trigger");
      // Selecting button action to show message
      propPane.SelectPlatformFunction("onClick", "Show alert");
      agHelper.EnterActionValue(
        "Message",
        "Row index: {{Table1.triggeredRowIndex}}",
      );
      table.FreezeColumn("left");

      // Click the button in a row
      agHelper.ClickButton("Trigger", 3);

      // Verify the alert
      agHelper.WaitUntilToastDisappear("Row index: 3");

      agHelper.ClickButton("Trigger", 4);

      // Verify the alert
      agHelper.WaitUntilToastDisappear("Row index: 4");
    });

    it("4. should test infinite scroll in deployed mode", () => {
      // Deploy the application
      deployMode.DeployApp();

      table.ReadTableRowColumnData(0, 1, "v2").then(($cellData) => {
        expect($cellData).to.not.be.empty;
      });

      table.ReadTableRowColumnData(1, 1, "v2").then(($cellData) => {
        expect($cellData).to.not.be.empty;
      });

      // Store the current number of rows
      let initialRowCount = 0;
      cy.get(".t--widget-tablewidgetv2 .tbody .tr").then(($rows) => {
        initialRowCount = $rows.length;

        // Scroll to the bottom of the table to trigger automatic loading of more records
        cy.get(".t--widget-tablewidgetv2 .virtual-list").scrollTo("bottom");

        // Wait for network call to complete
        assertHelper.AssertNetworkStatus("@postExecute", 200);

        // Verify more rows were loaded
        cy.get(".t--widget-tablewidgetv2 .tbody .tr").then(($newRows) => {
          expect($newRows.length).to.be.greaterThan(initialRowCount);
        });
      });

      cy.get(".t--widget-tablewidgetv2 .virtual-list").scrollTo("topLeft");

      // Test row selection in deployed mode : Multiple row selection was on
      table.SelectTableRow(2, 0, true, "v2");

      agHelper.GetNAssertElementText(
        locators._textWidgetContaioner,
        "2",
        "contain.text",
      );

      // Click the button in a row
      agHelper.ClickButton("Trigger", 1);

      // Verify the alert
      agHelper.WaitUntilToastDisappear("Row index: 1");

      agHelper.ClickButton("Trigger", 2);

      // Verify the alert
      agHelper.WaitUntilToastDisappear("Row index: 2");
    });
  },
);
