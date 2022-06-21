import React from "react";
import styled from "styled-components";

const StyledDynamicHeightOverlay = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const OVERLAY_COLOR = "#F32B8B";

interface OverlayDisplayProps {
  maxDynamicHeight: number;
}

const OverlayDisplay = styled.div<OverlayDisplayProps>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: ${(props) => props.maxDynamicHeight * 10}px;
  border-bottom: 1px solid ${OVERLAY_COLOR};
  background-color: rgba(243, 43, 139, 0.1);
`;

interface MinMaxHeightProps {
  maxDynamicHeight: number;
  minDynamicHeight: number;
}

const StyledOverlayHandles = styled.div`
  position: absolute;
  right: -16px;
`;

const OverlayHandle = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
`;

const OverlayHandleDot = styled.div`
  cursor: pointer;
  border-radius: 50%;
`;

const OverlayHandleLabel = styled.div`
  padding: 1px 4px;
  background: #191919;
  font-weight: 400;
  font-size: 10px;
  line-height: 16px;
  color: #ffffff;
  text-align: center;
  white-space: nowrap;
  margin-left: 4px;
`;

interface MinHeightOverlayHandleProps {
  minDynamicHeight: number;
}

interface MaxHeightOverlayHandleProps {
  maxDynamicHeight: number;
}

const MinHeightOverlayHandle = styled(OverlayHandle)<
  MinHeightOverlayHandleProps
>`
  top: ${(props) => props.minDynamicHeight * 10}px;
`;

const MinHeightOverlayHandleDot = styled(OverlayHandleDot)`
  width: 6px;
  height: 6px;
  border: 1px solid ${OVERLAY_COLOR};
`;

const MaxHeightOverlayHandle = styled(OverlayHandle)<
  MaxHeightOverlayHandleProps
>`
  top: ${(props) => props.maxDynamicHeight * 10}px;
`;

const MaxHeightOverlayHandleDot = styled(OverlayHandleDot)`
  width: 10px;
  height: 10px;
  background-color: ${OVERLAY_COLOR};
`;

const OverlayHandles: React.FC<MinMaxHeightProps> = ({
  maxDynamicHeight,
  minDynamicHeight,
}) => {
  return (
    <StyledOverlayHandles>
      <MinHeightOverlayHandle minDynamicHeight={minDynamicHeight}>
        <MinHeightOverlayHandleDot />
        <OverlayHandleLabel>
          Min-height: {minDynamicHeight} rows
        </OverlayHandleLabel>
      </MinHeightOverlayHandle>
      <MaxHeightOverlayHandle maxDynamicHeight={maxDynamicHeight}>
        <MaxHeightOverlayHandleDot />
        <OverlayHandleLabel>
          Max-height: {maxDynamicHeight} rows
        </OverlayHandleLabel>
      </MaxHeightOverlayHandle>
    </StyledOverlayHandles>
  );
};

const DynamicHeightOverlay: React.FC<MinMaxHeightProps> = ({
  children,
  maxDynamicHeight,
  minDynamicHeight,
}) => {
  return (
    <StyledDynamicHeightOverlay>
      <OverlayDisplay maxDynamicHeight={maxDynamicHeight} />
      <OverlayHandles
        maxDynamicHeight={maxDynamicHeight}
        minDynamicHeight={minDynamicHeight}
      />
      {children}
    </StyledDynamicHeightOverlay>
  );
};

export default DynamicHeightOverlay;
