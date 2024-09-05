import React from "react";

import { Container } from "./Container";
import { useRecaptcha } from "./useRecaptcha";
import type { UseRecaptchaProps } from "./useRecaptcha";
import { Button, Tooltip } from "@appsmith/wds";
import type { ButtonProps } from "@appsmith/wds";

export interface ButtonComponentProps extends ButtonProps {
  text?: string;
  tooltip?: string;
  isVisible?: boolean;
  isLoading: boolean;
  isDisabled?: boolean;
}

function ButtonComponent(props: ButtonComponentProps & UseRecaptchaProps) {
  const { icon, text, tooltip, ...rest } = props;

  const { onClick, recpatcha } = useRecaptcha(props);

  return (
    <Container>
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
