import React from "react";
import FlexLayout from "./FlexLayout";
import type { LayoutComponentProps } from "utils/autoLayout/autoLayoutTypes";
import Row from "./Row";

const Header = (props: LayoutComponentProps) => {
  const layout: LayoutComponentProps[] = props.layout as LayoutComponentProps[];
  return (
    <FlexLayout alignSelf="stretch" flexDirection="row" flexWrap="nowrap">
      <Row {...layout[0]} />
      <Row {...layout[1]} />
    </FlexLayout>
  );
};

export default Header;
