/* eslint-disable no-console */
import React from "react";
import type { LayoutComponentProps } from "utils/autoLayout/autoLayoutTypes";
import FlexLayout from "./FlexLayout";
import { getLayoutComponent } from "utils/autoLayout/layoutComponentUtils";

const Row = (props: LayoutComponentProps) => {
  console.log("####", { props });
  const { childrenMap, layoutStyle, rendersWidgets } = props;
  if (rendersWidgets && childrenMap) {
    // TODO: Segregate children higher up using an HOC.
    // If a layout renders multiple layouts => segregate children.
    const layout: string[] = props.layout as string[];
    return (
      <FlexLayout flexDirection="row" {...(layoutStyle || {})}>
        {layout.map((id: string) => childrenMap[id])}
      </FlexLayout>
    );
  }
  const layout: LayoutComponentProps[] = props.layout as LayoutComponentProps[];
  return (
    <FlexLayout flexDirection="row" {...(layoutStyle || {})}>
      {layout.map((item: LayoutComponentProps, index: number) => {
        const Comp = getLayoutComponent(item.layoutType);
        return <Comp childrenMap={childrenMap} key={index} {...item} />;
      })}
    </FlexLayout>
  );
};

export default Row;
