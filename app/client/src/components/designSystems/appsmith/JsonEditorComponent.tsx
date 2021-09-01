import React from "react";
import styled from "styled-components";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";

const JsonEditorContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

export interface JsonEditorComponentProps extends ComponentProps {
  isVisible: boolean;
}

function JsonEditorComponent(props: JsonEditorComponentProps) {
  const { isVisible } = props;

  return <JsonEditorContainer>{`Json editor`}</JsonEditorContainer>;
}

export default JsonEditorComponent;
