import { importSvg } from "@design-system/widgets-old/src/utils/icon-loadables";
import { Text } from "design-system";
import React from "react";
import styled from "styled-components";

const DROP_TARGET_CONTAINER_TOP_MARGIN = 20;
const DROP_TARGET_CONTAINER_LEFT_MARGIN = 50;
const DROP_TARGET_CONTAINER_PADDING = 16;

export const DropTargetContainer = styled.div`
  position: absolute;
  top: ${DROP_TARGET_CONTAINER_TOP_MARGIN}px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  align-items: flex-start;
`;

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: ${DROP_TARGET_CONTAINER_PADDING}px;
  margin-left: ${DROP_TARGET_CONTAINER_LEFT_MARGIN}px;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 220px;
  margin-top: 20px;
`;

const BuildingBlockExplorerDropTarget = () => {
  return (
    <DropTargetContainer>
      <MainContainer>
        <ClickIcon />

        <TextContainer>
          <Text kind="heading-s" style={{ marginBottom: "4px" }}>
            Drag & drop a building block
          </Text>

          <Text kind="body-m" style={{ textAlign: "left" }}>
            Make a working app in seconds using functional blocks
          </Text>
        </TextContainer>
      </MainContainer>

      <ArrowIcon height={100} width={100} />
    </DropTargetContainer>
  );
};

const ClickIcon = importSvg(
  async () =>
    import(
      "../../../../assets/icons/templates/building-block-explorer-drop-target-icon.svg"
    ),
);
const ArrowIcon = importSvg(
  async () =>
    import(
      "../../../../assets/icons/templates/building-block-explorer-drop-target-arrow.svg"
    ),
);

export default BuildingBlockExplorerDropTarget;
