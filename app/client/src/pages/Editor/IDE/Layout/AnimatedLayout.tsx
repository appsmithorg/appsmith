import React from "react";
import { useGridLayoutTemplate } from "./hooks/useGridLayoutTemplate";
import EditorWrapperContainer from "pages/Editor/commons/EditorWrapperContainer";
import { AnimatedGridLayout, LayoutArea } from "components/AnimatedGridLayout";
import BottomBar from "components/BottomBar";
import Sidebar from "../Sidebar";
import LeftPane from "../LeftPane";
import MainPane from "../MainPane";
import RightPane from "../RightPane";
import { Areas } from "./constants";

function AnimatedLayout() {
  const { areas, columns, rows } = useGridLayoutTemplate();
  return (
    <>
      <EditorWrapperContainer>
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
      </EditorWrapperContainer>
      <BottomBar />
    </>
  );
}

export { AnimatedLayout };
