import React from "react";
import type { LayoutComponentProps } from "utils/autoLayout/autoLayoutTypes";
import FlexLayout from "./FlexLayout";
import Column from "./Column";

const Main = (props: LayoutComponentProps) => {
  const layout: LayoutComponentProps[] = props.layout as LayoutComponentProps[];
  return (
    <FlexLayout
      flexDirection="row"
      flexWrap="wrap"
      height="auto"
      maxHeight="300px"
      overflow="auto"
    >
      {layout.map((item: LayoutComponentProps, index: number) => {
        return <Column key={index} {...item} />;
      })}
    </FlexLayout>
  );
};

export default Main;
