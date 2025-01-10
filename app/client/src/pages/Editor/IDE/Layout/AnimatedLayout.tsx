import React from "react";
import { AnimatedGridLayout, LayoutArea } from "components/AnimatedGridLayout";
import { Areas } from "./constants";
import type { BaseLayoutProps } from "./Layout.types";
import { BaseLayout } from "./BaseLayout";
import { usePaneComponents } from "../services/PaneComponentsContext";

function AnimatedLayoutComponent({ areas, columns, rows }: BaseLayoutProps) {
  const { LeftPane, MainPane, RightPane, Sidebar } = usePaneComponents();

  if (columns.length === 0) {
    return null;
  }

  return (
    <BaseLayout areas={areas} columns={columns} rows={rows}>
      <AnimatedGridLayout
        areas={areas}
        columns={columns}
        height="100%"
        rows={rows}
        width="100vw"
      >
        <LayoutArea name={Areas.Sidebar}>
          <Sidebar />
        </LayoutArea>
        <LayoutArea name={Areas.Explorer}>
          <LeftPane />
        </LayoutArea>
        <LayoutArea name={Areas.WidgetEditor}>
          <MainPane id="app-body" />
        </LayoutArea>
        <LayoutArea name={Areas.PropertyPane}>
          <RightPane />
        </LayoutArea>
      </AnimatedGridLayout>
    </BaseLayout>
  );
}

export const AnimatedLayout = React.memo(AnimatedLayoutComponent);
