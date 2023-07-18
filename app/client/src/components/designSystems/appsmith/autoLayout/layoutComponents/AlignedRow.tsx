/* eslint-disable no-console */
import React from "react";
import type { LayoutComponentProps } from "utils/autoLayout/autoLayoutTypes";
import FlexLayout from "./FlexLayout";

const AlignedRow = (props: LayoutComponentProps) => {
  console.log("####", { props });
  const { childrenMap, layout, layoutStyle, rendersWidgets } = props;
  if (rendersWidgets && childrenMap) {
    return (
      <FlexLayout flexDirection="row" {...(layoutStyle || {})}>
        <FlexLayout
          columnGap={4}
          flexDirection="row"
          flexWrap="wrap"
          overflow="visible"
          rowGap={12}
        >
          {(layout[0] as string[]).map((id: string) => childrenMap[id])}
        </FlexLayout>
        <FlexLayout
          columnGap={4}
          flexDirection="row"
          flexWrap="wrap"
          overflow="visible"
          rowGap={12}
        >
          {(layout[1] as string[]).map((id: string) => childrenMap[id])}
        </FlexLayout>
        <FlexLayout
          columnGap={4}
          flexDirection="row"
          flexWrap="wrap"
          overflow="visible"
          rowGap={12}
        >
          {(layout[2] as string[]).map((id: string) => childrenMap[id])}
        </FlexLayout>
      </FlexLayout>
    );
  }
  return <div />;
};

export default AlignedRow;
