import React, { memo, useState } from "react";
import type {
  BaseCellComponentProps,
  GroupButtonConfig,
  CompactMode,
} from "../Constants";
import { Button } from "@blueprintjs/core";
import type { ButtonVariant } from "components/constants";
import { ButtonVariantTypes } from "components/constants";
import styled from "styled-components";
import { objectKeys } from "@appsmith/utils";

const ButtonGroupContainer = styled.div<{
  orientation?: "horizontal" | "vertical";
}>`
  display: flex;
  flex-direction: ${(props) =>
    props.orientation === "vertical" ? "column" : "row"};
  gap: 4px;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
`;

export interface ButtonGroupCellProps extends BaseCellComponentProps {
  groupButtons?: Record<string, GroupButtonConfig>;
  orientation?: "horizontal" | "vertical";
  buttonVariant?: ButtonVariant;
  isDisabled?: boolean;
  compactMode: CompactMode;
  allowCellWrapping?: boolean;
  fontStyle?: string;
  textColor?: string;
  textSize?: string;
}

function ButtonGroupCell(props: ButtonGroupCellProps) {
  const {
    buttonVariant = ButtonVariantTypes.PRIMARY,
    groupButtons = {},
    isCellVisible,
    isDisabled,
    orientation = "horizontal",
  } = props;

  const [loadingButtons, setLoadingButtons] = useState<Record<string, boolean>>(
    {},
  );

  if (!isCellVisible) return null;

  const handleClick = (buttonId: string, onClick?: string) => {
    if (onClick) {
      setLoadingButtons((prev) => ({
        ...prev,
        [buttonId]: true,
      }));

      // Simulate action completion
      setTimeout(() => {
        setLoadingButtons((prev) => ({
          ...prev,
          [buttonId]: false,
        }));
      }, 1000);
    }
  };

  return (
    <ButtonGroupContainer orientation={orientation}>
      {objectKeys(groupButtons)
        .filter((id) => groupButtons[id].isVisible !== false)
        .map((id) => {
          const button = groupButtons[id];
          return (
            <Button
              alignText={button.iconAlign}
              disabled={isDisabled || button.isDisabled}
              fill
              icon={button.iconName}
              intent={
                buttonVariant === ButtonVariantTypes.PRIMARY
                  ? "primary"
                  : "none"
              }
              key={id}
              loading={loadingButtons[id]}
              minimal={buttonVariant === ButtonVariantTypes.TERTIARY}
              onClick={() => handleClick(id, button.onClick)}
              outlined={buttonVariant === ButtonVariantTypes.SECONDARY}
              small
              text={button.label}
            />
          );
        })}
    </ButtonGroupContainer>
  );
}

const MemoizedButtonGroupCell = memo(ButtonGroupCell);

export { MemoizedButtonGroupCell as ButtonGroupCell };
