import React, { forwardRef } from "react";

import type {
  TextInputRef as HeadlessTextInputRef,
  TextInputProps as HeadlessTextInputProps,
} from "@design-system/headless";

import { StyledTextInput } from "./index.styled";
import { Text } from "../Text";
import { Spinner } from "../Spinner";
import { Icon as HeadlessIcon } from "@design-system/headless";

export type TextInputProps = HeadlessTextInputProps;

const _TextInput = (props: TextInputProps, ref: HeadlessTextInputRef) => {
  const { label, ...rest } = props;
  const wrappedLabel = label && <Text>{label}</Text>;

  return (
    <StyledTextInput
      label={wrappedLabel}
      loadingIcon={
        <HeadlessIcon>
          <Spinner />
        </HeadlessIcon>
      }
      ref={ref}
      {...rest}
      icon={null}
    />
  );
};

export const TextInput = forwardRef(_TextInput);
