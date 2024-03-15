import type { RecaptchaType } from "components/constants";
import type { ButtonComponentProps } from ".";

export interface UseRecaptchaProps {
  recaptchaKey?: string;
  recaptchaType?: RecaptchaType;
  onRecaptchaSubmitError?: (error: string) => void;
  onRecaptchaSubmitSuccess?: (token: string) => void;
  handleRecaptchaV2Loading?: (isLoading: boolean) => void;
}

export type RecaptchaProps = ButtonComponentProps & UseRecaptchaProps;
