import { importSvg } from "@design-system/widgets-old/src/utils/icon-loadables";
import { Text } from "design-system";
import React from "react";
import styled from "styled-components";

export const DropTargetContainer = styled.div`
  position: absolute;
  top: 20px;
  left: 10px;
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
  padding: 16px 16px;
  margin-left: 50px;
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
