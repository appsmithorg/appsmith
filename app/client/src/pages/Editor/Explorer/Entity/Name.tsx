import React from "react";
import styled from "styled-components";
const Wrapper = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 4px;
`;

export interface EntityNameProps {
  name: string;
  isEditing?: boolean;
  onChange?: (name: string) => void;
}

export const EntityName = (props: EntityNameProps) => {
  return <Wrapper>{props.name}</Wrapper>;
};

export default EntityName;
