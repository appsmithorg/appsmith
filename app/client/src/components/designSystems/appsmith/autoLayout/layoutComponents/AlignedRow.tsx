/* eslint-disable no-console */
import React from "react";
import type { LayoutComponentProps } from "utils/autoLayout/autoLayoutTypes";
import FlexLayout from "./FlexLayout";
import "../styles.css";

const AlignedRow = (props: LayoutComponentProps) => {
  console.log("####", { props });
  const { childrenMap, layout, layoutStyle, rendersWidgets } = props;
  if (rendersWidgets && childrenMap) {
    return (
      <FlexLayout flexDirection="row" {...(layoutStyle || {})}>
        <div className="alignment start-alignment">
          {(layout[0] as string[]).map((id: string) => childrenMap[id])}
        </div>
        <div className="alignment center-alignment">
          {(layout[1] as string[]).map((id: string) => childrenMap[id])}
        </div>
        <div className="alignment end-alignment">
          {(layout[2] as string[]).map((id: string) => childrenMap[id])}
        </div>
      </FlexLayout>
    );
  }
  return <div />;
};

export default AlignedRow;
