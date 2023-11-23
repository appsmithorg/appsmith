import React from "react";
import { Icon as BIcon } from "@blueprintjs/core";
import type { IconName } from "@blueprintjs/icons";

import { Container } from "./Container";
import { useRecaptcha } from "./useRecaptcha";
import type { UseRecaptchaProps } from "./useRecaptcha";
import { Button, Tooltip } from "@design-system/widgets";
import type { ButtonProps } from "@design-system/widgets";

export interface ButtonComponentProps {
  text?: string;
  tooltip?: string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  isVisible?: boolean;
  isLoading: boolean;
  iconName?: IconName;
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

  const icon =
    iconName &&
    (() => {
      return <BIcon icon={iconName} />;
    });

  const { onClick, recpatcha } = useRecaptcha(props);

  return (
    <Container {...containerProps}>
      <Tooltip tooltip={tooltip}>
        <Button icon={icon} {...rest} onPress={onClick}>
          {text}
        </Button>
      </Tooltip>
      {recpatcha}
    </Container>
  );
}

export default ButtonComponent;
