import { isNil } from "lodash";
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
        text = Number(value);

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
