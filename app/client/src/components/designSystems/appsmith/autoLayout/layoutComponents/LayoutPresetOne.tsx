import React from "react";
import type { LayoutComponentProps } from "utils/autoLayout/autoLayoutTypes";
import Header from "./Header";
import Main from "./Main";
import AlignedRow from "./AlignedRow";
import Column from "./Column";
import Row from "./Row";

const LayoutPresetOne = (props: LayoutComponentProps) => {
  const layout: LayoutComponentProps[] = props.layout as LayoutComponentProps[];
  return (
    <Column {...props}>
      <Row childrenMap={props.childrenMap} {...layout[0]} />
      <Header {...layout[0]} />
      <Main {...layout[1]} />
      <AlignedRow {...layout[2]} />
    </Column>
  );
};

export default LayoutPresetOne;
