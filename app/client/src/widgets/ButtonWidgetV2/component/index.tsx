import React from "react";
import { Icon as BIcon } from "@blueprintjs/core";
import type { IconName } from "@blueprintjs/icons";

import { Container } from "./Container";
import { useRecaptcha } from "./useRecaptcha";
import type { UseRecaptchaProps } from "./useRecaptcha";
import type { ButtonVariant, ButtonProps } from "@design-system/widgets";
import { Button, Icon, WithTooltip } from "@design-system/widgets";

export type ButtonComponentProps = {
  text?: string;
  tooltip?: string;
  isLoading: boolean;
  iconName?: IconName;
  isVisible?: boolean;
  isDisabled?: boolean;
  variant?: ButtonVariant;
  type: ButtonProps["type"];
  onClick?: ButtonProps["onPress"];
  iconPosition?: ButtonProps["iconPosition"];
};

function ButtonComponent(props: ButtonComponentProps & UseRecaptchaProps) {
  const { iconName, text, tooltip, ...rest } = props;

  const icon = iconName && (
    <Icon>
      <BIcon icon={iconName} />
    </Icon>
  );

  const { onClick, recpatcha } = useRecaptcha(props);

  return (
    <Container showInAllModes>
      <WithTooltip tooltip={tooltip}>
        <Button icon={icon} isFitContainer onPress={onClick} {...rest}>
          {text}
        </Button>
      </WithTooltip>
      {recpatcha}
    </Container>
  );
}

export default ButtonComponent;
