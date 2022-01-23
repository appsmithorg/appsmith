import React from "react";
import {
  Button as CButton,
  ButtonProps as CButtonProps,
} from "@chakra-ui/react";

function Button(props: CButtonProps) {
  return <CButton {...props} />;
}

export default Button;
