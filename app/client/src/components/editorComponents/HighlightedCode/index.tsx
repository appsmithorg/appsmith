import type { MutableRefObject, Ref } from "react";
import React, { useRef, useEffect, forwardRef } from "react";
import styled from "styled-components";
import Prism from "prismjs";
import themes from "./themes";
import { Skin } from "constants/DefaultTheme";

// TODO(abhinav): This is rudimentary. Enhance it.
Prism.languages["appsmith-binding"] = {
  punctuation: {
    pattern: /^{{|}}$/,
  },
  property: {
    pattern: /(\.\w+)/,
  },
};

const StyledCode = styled.div<{ skin: Skin }>`
  ${(props) => (props.skin === Skin.DARK ? themes.DARK : themes.LIGHT)};
  padding: 0 0px;

  }
`;

/* When adding an entry please make sure to include it in the craco.common.config.js as well */
export enum SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES {
  JAVASCRIPT = "language-javascript",
  APPSMITH = "language-appsmith-binding", // Please note that we're using the CSS class name required by prismjs.
}

type HighlightedCodeProps = {
  codeText: string;
  language?: SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES;
  skin: Skin;
  multiline?: boolean;
  onClick?: () => void;
  className?: string;
};
/* eslint-disable react/display-name */
export const HighlightedCode = forwardRef(
  (props: HighlightedCodeProps, ref: Ref<HTMLDivElement>) => {
    const codeRef: MutableRefObject<HTMLElement | null> = useRef(null);

    // Highlight when component renders with new props.
    // Skin is irrelevant here, as it only uses css.
    // Skinning is handled in StyledCode component.
    useEffect(() => {
      if (codeRef.current) {
        // When this is run, the code text is tokenized
        // into HTML on which the theme CSS is applied
        Prism.highlightElement(codeRef.current);
      }
    }, [props.codeText, props.language, codeRef]);

    // Set the default language to javascript if not provided.
    const language =
      props.language || SYNTAX_HIGHLIGHTING_SUPPORTED_LANGUAGES.JAVASCRIPT;

    return (
      <StyledCode
        className={props.className}
        onClick={props.onClick}
        ref={ref}
        skin={props.skin}
      >
        {!props.multiline && (
          <code className={language} ref={codeRef}>
            {props.codeText}
          </code>
        )}
      </StyledCode>
    );
  },
);

export default HighlightedCode;
