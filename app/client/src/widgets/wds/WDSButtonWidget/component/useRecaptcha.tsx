import { RecaptchaV2 } from "./RecaptchaV2";
import { RecaptchaV3 } from "./RecaptchaV3";
import type { ButtonComponentProps } from ".";
import type { RecaptchaType } from "components/constants";

export interface UseRecaptchaProps {
  recaptchaKey?: string;
  recaptchaType?: RecaptchaType;
  onRecaptchaSubmitError?: (error: string) => void;
  onRecaptchaSubmitSuccess?: (token: string, onReset?: () => void) => void;
  handleRecaptchaV2Loading?: (isLoading: boolean) => void;
}

export type RecaptchaProps = ButtonComponentProps &
  UseRecaptchaProps & {
    onReset?: () => void;
    onClick?: (onReset?: () => void) => void;
  };

interface UseRecaptchaReturn {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick?: (...args: any[]) => void;
  recpatcha?: React.ReactElement;
}

export const useRecaptcha = (props: RecaptchaProps): UseRecaptchaReturn => {
  const { onClick: onClickProp, recaptchaKey } = props;

  if (!recaptchaKey) {
    return { onClick: () => onClickProp?.(props?.onReset) };
  }

  if (props.recaptchaType === "V2") {
    return RecaptchaV2(props);
  }

  if (props.recaptchaType === "V3") {
    return RecaptchaV3(props);
  }

  return { onClick: onClickProp };
};
