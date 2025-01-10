import React from "react";
import { useGridLayoutTemplate } from "./hooks/useGridLayoutTemplate";
import { AnimatedGridLayout, LayoutArea } from "components/AnimatedGridLayout";
import Sidebar from "../Sidebar";
import LeftPane from "../LeftPane";
import MainPane from "../MainPane";
import RightPane from "../RightPane";
import { Areas } from "./constants";
import type { BaseLayoutProps } from "./Layout.types";
import { BaseLayout } from "./BaseLayout";

function AnimatedLayoutComponent({ areas, columns, rows }: BaseLayoutProps) {
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
