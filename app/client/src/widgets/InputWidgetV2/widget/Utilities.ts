import { isNil } from "lodash";
import { getLocale } from "utils/helpers";
import { InputTypes } from "widgets/BaseInputWidget/constants";

/*
 * Function to parse text as number based on InputType
 *  - NUMBER : Number(text)
 *  - Others: text
 */
export function getParsedText(value: string, inputType: InputTypes) {
  let text;

  switch (inputType) {
    case InputTypes.NUMBER:
      if (isNil(value) || value === "") {
        text = null;
      } else {
        const decimalSeperator = getLocaleDecimalSeperator();
        const typeCastValue = String(value);
        text = typeCastValue.includes(decimalSeperator)
          ? Number(
              typeCastValue.replace(
                new RegExp("\\" + decimalSeperator, "g"),
                ".",
              ),
            )
          : Number(typeCastValue);

        if (isNaN(text)) {
          text = null;
        }
      }
      break;
    default:
      text = value;
      break;
  }

  return text;
}

export function getLocaleDecimalSeperator() {
  return Intl.NumberFormat(getLocale())
    .format(1.1)
    .replace(/\p{Number}/gu, "");
}
