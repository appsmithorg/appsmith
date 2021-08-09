import React from "react";
import styled from "styled-components";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";

interface RecorderContainerProps {
  isDisabled: boolean;
}

const RecorderContainer = styled.div<RecorderContainerProps>`
  display: flex;
  width: 100%;
  height: 100%;
`;

export interface RecorderComponentProps extends ComponentProps {
  isDisabled: boolean;
}

function RecorderComponent(props: RecorderComponentProps) {
  const { isDisabled } = props;

  return (
    <RecorderContainer isDisabled={isDisabled}>
      Recorder Widget
    </RecorderContainer>
  );
}

export default RecorderComponent;
