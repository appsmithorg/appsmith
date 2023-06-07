import type { Completion } from "./CodemirrorTernService";
import { isBracketOrDotNotation } from "@shared/ast";
import { getCodeFromMoustache } from "../../components/editorComponents/ActionCreator/utils";
import { isNil } from "lodash";

export const transformBlankSpacedObjectKeyToBracketNotation = (
  lineValue: string,
  completion: Completion,
) => {
  const completions = [];
  const wordArray = getCodeFromMoustache(lineValue).split(" ");
  if (wordArray.length > 0) {
    completions.push({
      ...completion,
      name: "bracket-notation",
      text: getTransformedText(wordArray),
      render: (element: HTMLElement) => {
        element.setAttribute("object", "Bracket notation");
        element.innerHTML = "bracket notation";
      },
    });
  }
};

export const getTransformedText = (input: string[]) => {
  let text = "";
  const arrayWithObjInformation = [];
  // loop over all elements and store the following
  // if bracket/dot notation - true
  // if invalid JS (eg ., single operators like + - by themselves) - null
  // else store false
  for (const word of input) {
    arrayWithObjInformation.push(isBracketOrDotNotation(word));
  }

  for (const [index, word] of input.entries()) {
    const isObj = arrayWithObjInformation[index];
    const isPreviousWordObj =
      index !== 0 ? arrayWithObjInformation[index - 1] : null;
    if (isPreviousWordObj && !isNil(isObj)) {
      text = isObj ? `${text}[${word}]` : `${text}['${word}']`;
      // store true in the array with obj info because we transformed this to
      // bracket notation
      // this helps for cases like this.a b c -> this.a['b']['c']
      arrayWithObjInformation[index] = true;
    } else {
      text = `${text} ${word}`;
    }
  }
  return text.trim();
};
