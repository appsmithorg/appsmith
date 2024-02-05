import React from "react";

import { Container } from "./Container";
import { useRecaptcha } from "./useRecaptcha";
import type { UseRecaptchaProps } from "./useRecaptcha";
import { Button, Tooltip } from "@design-system/widgets";
import type { ButtonProps, IconProps } from "@design-system/widgets";

export interface ButtonComponentProps {
  text?: string;
  tooltip?: string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  isVisible?: boolean;
  isLoading: boolean;
  iconName?: IconProps["name"];
  isDisabled?: boolean;
  variant?: ButtonProps["variant"];
  color?: ButtonProps["color"];
  type: ButtonProps["type"];
  onPress?: ButtonProps["onPress"];
  iconPosition?: ButtonProps["iconPosition"];
}

function ButtonComponent(props: ButtonComponentProps & UseRecaptchaProps) {
  const { iconName, maxWidth, minHeight, minWidth, text, tooltip, ...rest } =
    props;
  const containerProps = { maxWidth, minHeight, minWidth };

  const { onClick, recpatcha } = useRecaptcha(props);

  return (
    <Container {...containerProps}>
      <Tooltip tooltip={tooltip}>
        <Button icon={iconName} {...rest} onPress={onClick}>
          {text}
        </Button>
      </Tooltip>
      {recpatcha}
    </Container>
  );
}

export default ButtonComponent;
