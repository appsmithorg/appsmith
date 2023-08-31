import React from "react";
import { Text } from "design-system";
import styled from "styled-components";

const PanelSubTitle = styled.div`
  background-color: #fff8f8;
  padding: 4px 12px;
  justify-content: space-between;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #fbe6dc;
`;

type Props = {
  title: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};
const ListSubTitle = (props: Props) => {
  return (
    <PanelSubTitle>
      {props.leftIcon ? props.leftIcon : null}
      <Text kind="heading-xs">{props.title}</Text>
      {props.rightIcon ? props.rightIcon : null}
    </PanelSubTitle>
  );
};

export default ListSubTitle;
