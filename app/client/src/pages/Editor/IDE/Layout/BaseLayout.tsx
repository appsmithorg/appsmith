import React from "react";
import type { BaseLayoutProps } from "./Layout.types";
import EditorWrapperContainer from "pages/Editor/commons/EditorWrapperContainer";
import BottomBar from "components/BottomBar";
import { GitProtectedBranchCallout } from "./components/GitProtectedBranchCallout";

export function BaseLayout({ children }: BaseLayoutProps) {
  return (
    <>
      <GitProtectedBranchCallout />
      <EditorWrapperContainer>
        {children}
      </EditorWrapperContainer>
      <BottomBar />
    </>
  );
}
