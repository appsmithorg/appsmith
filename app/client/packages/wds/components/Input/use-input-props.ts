import { useId } from "@mantine/hooks";
import { InputSharedProps } from "./Input";
import { InputWrapperBaseProps } from "./InputWrapper/InputWrapper";

interface BaseProps extends InputWrapperBaseProps, InputSharedProps {
  id?: string;
}

interface UseInputPropsReturnType extends Record<string, any> {
  wrapperProps: Record<string, any>;
  inputProps: Record<string, any>;
}

export function useInputProps<T extends BaseProps, U extends Partial<T>>(
  props: T,
): UseInputPropsReturnType {
  const {
    className,
    description,
    descriptionProps,
    error,
    errorProps,
    id,
    inputContainer,
    inputWrapperOrder,
    label,
    labelPosition,
    labelProps,
    required,
    withAsterisk,
    wrapperProps,
    ...rest
  } = props;

  const uid = useId(id);

  return {
    ...rest,
    wrapperProps: {
      label,
      description,
      error,
      required,
      className,
      errorProps,
      labelProps,
      descriptionProps,
      id: uid,
      inputContainer,
      labelPosition,
      inputWrapperOrder,
      withAsterisk,
      ...wrapperProps,
    },
    inputProps: {
      required,
      id: uid,
      invalid: !!error,
    },
  };
}
