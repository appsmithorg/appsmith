import React from "react";
import { Icon as BIcon } from "@blueprintjs/core";
import type { IconName } from "@blueprintjs/icons";

import { Container } from "./Container";
import { useRecaptcha } from "./useRecaptcha";
import type { UseRecaptchaProps } from "./useRecaptcha";
import type { ButtonProps } from "@design-system/widgets";
import { Button, Icon, WithTooltip } from "@design-system/widgets";

export type ButtonComponentProps = {
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
  onClick?: ButtonProps["onPress"];
  iconPosition?: ButtonProps["iconPosition"];
};

function ButtonComponent(props: ButtonComponentProps & UseRecaptchaProps) {
  const { iconName, maxWidth, minHeight, minWidth, text, tooltip, ...rest } =
    props;
  const containerProps = { maxWidth, minHeight, minWidth };

  const icon = iconName && (
    <Icon>
      <BIcon icon={iconName} />
    </Icon>
  );

  const { onClick, recpatcha } = useRecaptcha(props);

  return (
    <Container {...containerProps}>
      <WithTooltip tooltip={tooltip}>
        <Button icon={icon} onPress={onClick} {...rest}>
          {text}
        </Button>
      </WithTooltip>
      {recpatcha}
    </Container>
  );
}

export default ButtonComponent;
