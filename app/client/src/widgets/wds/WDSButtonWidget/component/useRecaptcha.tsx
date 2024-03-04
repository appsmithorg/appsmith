import { RecaptchaV2 } from "./RecaptchaV2";
import { RecaptchaV3 } from "./RecaptchaV3";
import type { RecaptchaProps } from "./types";
interface UseRecaptchaReturn {
  onClick?: (...args: any[]) => void;
  recpatcha?: React.ReactElement;
}

export const useRecaptcha = (props: RecaptchaProps): UseRecaptchaReturn => {
  const { onPress: onClickProp, recaptchaKey } = props;

  if (!recaptchaKey) {
    return { onClick: onClickProp };
  }

  if (props.recaptchaType === "V2") {
    return RecaptchaV2(props);
  }

  if (props.recaptchaType === "V3") {
    return RecaptchaV3(props);
  }

  return { onClick: onClickProp };
};
