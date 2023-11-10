import type { ReactNode } from "react";
import React from "react";
import { render, screen, fireEvent } from "test/testUtils";
import "jest-styled-components"; // If you want to check styles
import ListItemWrapper from "./DatasourceListItem";
import type { Datasource } from "entities/Datasource";
import {
  UIComponentTypes,
  type Plugin,
  DatasourceComponentTypes,
} from "api/PluginApi";
import { PluginPackageName, PluginType } from "entities/Action";

interface ComponentWithChildrenProps {
  children: ReactNode;
}

jest.mock(
  "Tooltip",
  () =>
    ({ children }: ComponentWithChildrenProps) =>
      children,
);

describe("ListItemWrapper", () => {
  it("displays the tooltip on hover over the name", () => {
    const ds: Datasource = {
      id: "1",
      pluginId: "plugin-123",
      name: "Test Datasource",
      type: "Test Type",
      workspaceId: "workspace-123",
      datasourceStorages: {},
      success: true,
      isMock: true,
      invalids: ["invalid1", "invalid2"],
      messages: ["message1", "message2"],
    };

    const plugin: Plugin = {
      id: "dfdf",
      name: "Postgres",
      type: PluginType.DB,
      packageName: PluginPackageName.POSTGRES,
      uiComponent: UIComponentTypes.DbEditorForm,
      datasourceComponent: DatasourceComponentTypes.AutoForm,
      allowUserDatasources: true,
      templates: {
        template1: "template1",
      },
    };

    // Render the component
    render(
      <ListItemWrapper
        currentEnvironment="env-1"
        ds={ds}
        onClick={() => true}
        plugin={plugin}
        selected={false}
      />,
    );

    // Get the tooltip element
    const tooltip = screen.getByText("Test Datasource");

    // By default, the tooltip should not be visible
    expect(tooltip).not.toBeVisible();

    // Simulate a mouse hover event over the Datasource name
    fireEvent.mouseOver(tooltip);

    // Now, the tooltip should be visible
    expect(tooltip).toBeVisible();
  });
});
