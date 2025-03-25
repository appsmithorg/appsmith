import React from "react";
import { Button, Tooltip } from "@appsmith/wds";
import type { ButtonProps } from "@appsmith/wds";

import { Container } from "./Container";
import { useRecaptcha } from "./useRecaptcha";
import type { UseRecaptchaProps } from "./useRecaptcha";
import { useWDSZoneWidgetContext } from "../../WDSZoneWidget/widget/context";

export interface ButtonComponentProps extends ButtonProps {
  text?: string;
  tooltip?: string;
  isVisible?: boolean;
  isLoading: boolean;
  isDisabled?: boolean;
  onClick?: (onReset?: () => void) => void;
}

function ButtonComponent(props: ButtonComponentProps & UseRecaptchaProps) {
  const { icon, onClick: onClickProp, text, tooltip, ...rest } = props;
  const { isFormValid, onReset } = useWDSZoneWidgetContext();
  const { onClick, recpatcha } = useRecaptcha({
    ...props,
    onClick: onClickProp,
    onReset,
  });

  const isDisabled =
    props.isDisabled || (props.disableOnInvalidForm && isFormValid === false);

  return (
    <Container>
      <Tooltip tooltip={tooltip}>
        <Button
          icon={icon}
          {...rest}
          isDisabled={isDisabled}
          onPress={() => onClick?.(onReset)}
        >
          {text}
        </Button>
      </Tooltip>
      {recpatcha}
    </Container>
  );
}

export default ButtonComponent;
