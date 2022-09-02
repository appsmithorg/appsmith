import { isNil } from "lodash";
import { InputTypes } from "widgets/BaseInputWidget/constants";
import { getLocaleDecimalSeperator } from "widgets/WidgetUtils";

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
