import React from "react";
import type { IconName } from "@blueprintjs/icons";
import type { MaybeElement, Alignment } from "@blueprintjs/core";

import type { ComponentProps } from "widgets/BaseComponent";
import type { ButtonPlacement, ButtonVariant } from "components/constants";

import { DragContainer } from "./DragContainer";
import { Button } from "@design-system/widgets";
import { withRecaptcha } from "./withRecaptcha";
import type { RecaptchaProps } from "./RecaptchaV2";

interface ButtonComponentProps extends ComponentProps {
  text?: string;
  icon?: IconName | MaybeElement;
  tooltip?: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  isDisabled?: boolean;
  isLoading: boolean;
  rightIcon?: IconName | MaybeElement;
  type: "button" | "submit" | "reset";
  buttonColor?: string;
  buttonVariant?: ButtonVariant;
  borderRadius?: string;
  boxShadow?: string;
  boxShadowColor?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  placement?: ButtonPlacement;
  className?: string;
}

function ButtonComponent(props: ButtonComponentProps & RecaptchaProps) {
  const { text, ...rest } = props;

  return (
    <DragContainer showInAllModes>
      <Button isFitContainer {...rest}>
        {text}
      </Button>
    </DragContainer>
  );
}

export default withRecaptcha(ButtonComponent);
