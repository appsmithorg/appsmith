import React from "react";
import { SignaturePadComponentProps } from "../constants";
import SignatureCanvas from "react-signature-canvas";
import styled from "styled-components";
import { LabelWithTooltip } from "design-system";
import { Alignment } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { TextSizes } from "constants/WidgetConstants";
import { LabelPosition } from "components/constants";
import { ReactComponent as ClearCanvasIcon } from "assets/icons/widget/signaturePad/clear-canvas.svg";

const StyledContainer = styled.div`
  position: relative;
`;

const StyledCanvasContainer = styled.div<{
  borderRadius?: string;
  boxShadow?: string;
}>`
  position: relative;

  canvas {
    border-radius: ${({ borderRadius }) => borderRadius};
    box-shadow: ${({ boxShadow }) => `${boxShadow}`};
    border: 1px solid var(--wds-color-border);
  }
`;

const ControlBtnWrapper = styled.div<{
  borderRadius?: string;
  boxShadow?: string;
}>`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 3px 2px;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
  border: 1px solid var(--wds-color-border);
  border-radius: ${({ borderRadius }) => borderRadius};
  box-shadow: ${({ boxShadow }) => `${boxShadow}`};
`;

const ControlBtn = styled.a<{
  borderRadius?: string;
}>`
  height: 20px;
  width: 20px;
  color: white;
  padding: 0px 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s linear;
  margin: 0px 2px;
  border-radius: ${({ borderRadius }) => borderRadius};

  svg {
    height: 11px;
    width: 11px;
  }

  svg.is-download-icon {
    height: 13px;
    width: 15px;

    path {
      fill: var(--wds-color-icon);
    }
  }

  &:hover {
    background: var(--wds-color-bg-hover);

    svg path {
      fill: var(--wds-color-icon-hover);
    }
  }
`;

function SignaturePadComponent(props: SignaturePadComponentProps) {
  const {
    borderRadius,
    boxShadow,
    isDisabled,
    label,
    onSigning,
    padBackgroundColor,
    penColor,
  } = props;

  return (
    <StyledContainer>
      {label && (
        <LabelWithTooltip
          alignment={Alignment.LEFT}
          color={Colors.GREY_900}
          compact
          disabled={false}
          fontSize={TextSizes.PARAGRAPH}
          position={LabelPosition.Top}
          text={label}
        />
      )}

      <StyledCanvasContainer borderRadius={borderRadius} boxShadow={boxShadow}>
        <ControlBtnWrapper borderRadius={borderRadius} boxShadow={boxShadow}>
          <ControlBtn borderRadius={borderRadius}>
            <ClearCanvasIcon />
          </ControlBtn>
        </ControlBtnWrapper>

        <SignatureCanvas
          backgroundColor={padBackgroundColor}
          canvasProps={{ width: 400, height: 200, className: "sigCanvas" }}
          onEnd={onSigning}
          penColor={penColor}
        />
      </StyledCanvasContainer>
    </StyledContainer>
  );
}

export default SignaturePadComponent;
