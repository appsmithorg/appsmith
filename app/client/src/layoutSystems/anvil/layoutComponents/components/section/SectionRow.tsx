import React from "react";
import { useSelector } from "react-redux";
import { isEditOnlyModeSelector } from "selectors/editorSelectors";
import { FlexLayout, type FlexLayoutProps } from "../FlexLayout";

export const SectionRow = (props: FlexLayoutProps) => {
  const isEditOnlyMode = useSelector(isEditOnlyModeSelector);

  return (
    <FlexLayout {...props} wrap={isEditOnlyMode ? "nowrap" : "wrap"}>
      {props.children}
    </FlexLayout>
  );
};
