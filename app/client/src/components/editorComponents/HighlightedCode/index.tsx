import React, { useRef, useEffect, MutableRefObject } from "react";
import styled from "styled-components";
import Prism from "prismjs";
import themes from "./themes";
import { SKINS } from "constants/DefaultTheme";
// TODO(abhinav): This is rudimentary. Enhance it.
Prism.languages["appsmith-binding"] = {
  punctuation: /^{{|\.|}}$/,
  property: {
    pattern: /(\.?)\w+/,
    lookbehind: false,
  },
};
const StyledCode = styled.div<{ skin: SKINS }>`
  ${props => (props.skin === SKINS.DARK ? themes.DARK : themes.LIGHT)}
`;

/* When adding an entry please make sure to include it in the craco.common.config.js as well */
export enum SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES {
  JAVASCRIPT = "language-javascript",
  APPSMITH = "language-appsmith-binding", // Please note that we're using the CSS class name required by prismjs.
}

type HighlightedCodeProps = {
  codeText: string;
  language?: SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES;
  skin?: SKINS;
};

export const HighlightedCode = (props: HighlightedCodeProps) => {
  const codeBlockRef: MutableRefObject<HTMLElement | null> = useRef(null);

  // Highlight when component renders with new props.
  // Skin is irrelevant here, as it only uses css.
  // Skinning is handled in StyledCode component.
  useEffect(() => {
    if (codeBlockRef.current) {
      // When this is run, the code text is tokenized
      // into HTML on which the theme CSS is applied
      Prism.highlightElement(codeBlockRef.current);
    }
  }, [props.codeText, props.language]);

  // Set the default language to javascript if not provided.
  const language =
    props.language || SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES.JAVASCRIPT;

  return (
    <StyledCode skin={props.skin || SKINS.DARK}>
      <code ref={codeBlockRef} className={language}>
        {props.codeText}
      </code>
    </StyledCode>
  );
};

export default HighlightedCode;
