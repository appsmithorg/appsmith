import React, { memo, useState } from "react";
import type { BaseCellComponentProps } from "../Constants";
import ButtonGroupComponent from "widgets/ButtonGroupWidget/component";
import type { ButtonGroupComponentProps } from "widgets/ButtonGroupWidget/component";
import { ButtonVariantTypes } from "components/constants";
import type { ButtonVariant } from "components/constants";

export interface ButtonGroupCellProps extends BaseCellComponentProps {
  groupButtons?: ButtonGroupComponentProps["groupButtons"];
  orientation?: "horizontal" | "vertical";
  buttonVariant?: ButtonVariant;
  isDisabled?: boolean;
}

function ButtonGroupCell(props: ButtonGroupCellProps) {
  const {
    groupButtons = {},
    orientation = "horizontal",
    buttonVariant = ButtonVariantTypes.PRIMARY,
    isDisabled,
    isCellVisible,
  } = props;

  const [loadingButtons, setLoadingButtons] = useState<Record<string, boolean>>(
    {},
  );

  if (!isCellVisible) return null;

  // Create onComplete handlers for each button
  const wrappedGroupButtons = Object.entries(groupButtons).reduce(
    (acc, [key, button]) => {
      const onComplete = () => {
        setLoadingButtons((prev) => ({
          ...prev,
          [key]: false,
        }));
      };

      const onClick = () => {
        if (button.onClick) {
          setLoadingButtons((prev) => ({
            ...prev,
            [key]: true,
          }));
          // onClick is a string in this context
          setTimeout(onComplete, 1000);
        }
      };

      return {
        ...acc,
        [key]: {
          ...button,
          onClick,
          isLoading: loadingButtons[key] || false,
          isDisabled: isDisabled || button.isDisabled,
        },
      };
    },
    {},
  );

  return (
    <ButtonGroupComponent
      buttonVariant={buttonVariant}
      groupButtons={wrappedGroupButtons}
      orientation={orientation}
      isDisabled={!!isDisabled}
      renderMode="CANVAS"
      buttonClickHandler={(
        onClick: string | undefined,
        onComplete: () => void,
      ) => {
        if (onClick) {
          // In a real implementation, this would execute the onClick action
          // For now, we just simulate with a timeout
          setTimeout(onComplete, 1000);
        }
      }}
      width={300}
      minPopoverWidth={200}
      widgetId="table-button-group"
      boxShadow="none"
      borderRadius="0"
    />
  );
}

const MemoizedButtonGroupCell = memo(ButtonGroupCell);

export { MemoizedButtonGroupCell as ButtonGroupCell };
