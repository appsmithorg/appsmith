import React from "react";
import Sidebar from "pages/Editor/IDE/Sidebar";
import LeftPane from "../LeftPane";
import MainPane from "../MainPane";
import RightPane from "../RightPane";
import styled from "styled-components";
import { Areas } from "./constants";
import type { BaseLayoutProps } from "./Layout.types";
import { BaseLayout } from "./BaseLayout";

const GridContainer = styled.div`
  display: grid;
  width: 100vw;
  height: 100%;
`;

const LayoutContainer = styled.div<{ name: string }>`
  position: relative;
  grid-area: ${(props) => props.name};
`;

function StaticLayoutComponent({ areas, columns, rows }: BaseLayoutProps) {
  const isSidebarVisible = columns[0] !== "0px";

  return (
    <BaseLayout areas={areas} columns={columns} rows={rows}>
      <GridContainer
        style={{
          gridTemplateRows: rows.join(" "),
          gridTemplateAreas: areas
            .map((area) => `"${area.join(" ")}"`)
            .join("\n"),
          gridTemplateColumns: columns.join(" "),
        }}
      >
        <LayoutContainer name={Areas.Sidebar}>
          {isSidebarVisible ? <Sidebar /> : <div />}
        </LayoutContainer>
        <LayoutContainer name={Areas.Explorer}>
          <LeftPane />
        </LayoutContainer>
        <LayoutContainer name={Areas.WidgetEditor}>
          <MainPane id="app-body" />
        </LayoutContainer>
        <LayoutContainer name={Areas.PropertyPane}>
          <RightPane />
        </LayoutContainer>
      </GridContainer>
    </BaseLayout>
  );
}

export const StaticLayout = React.memo(StaticLayoutComponent);
