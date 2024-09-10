import React from "react";
import { useGridLayoutTemplate } from "./hooks/useGridLayoutTemplate";
import EditorWrapperContainer from "pages/Editor/commons/EditorWrapperContainer";
import { AnimatedGridLayout, LayoutArea } from "components/AnimatedGridLayout";
import { useSelector } from "react-redux";
import BottomBar from "components/BottomBar";
import Sidebar from "../Sidebar";
import LeftPane from "../LeftPane";
import MainPane from "../MainPane";
import RightPane from "../RightPane";
import { Areas } from "./constants";
import ProtectedCallout from "../ProtectedCallout";
import { protectedModeSelector } from "selectors/gitSyncSelectors";

function AnimatedLayout() {
  const isProtectedMode = useSelector(protectedModeSelector);
  const { areas, columns, rows } = useGridLayoutTemplate();
  if (columns.length === 0) {
    return null;
  }
  return (
    <>
      {isProtectedMode && <ProtectedCallout />}
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
