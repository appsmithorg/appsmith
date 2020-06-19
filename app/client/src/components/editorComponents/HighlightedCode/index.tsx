import React, { useRef, useEffect, MutableRefObject } from "react";
import styled from "styled-components";
import Prism from "prismjs";
import themes from "./themes";
import { Skin } from "constants/DefaultTheme";
import { noop } from "lodash";
import useClipboard from "utils/hooks/useClipboard";
import { Icon } from "@blueprintjs/core";
import { Colors } from "constants/Colors";

// TODO(abhinav): This is rudimentary. Enhance it.
Prism.languages["appsmith-binding"] = {
  punctuation: /^{{|\.|}}$/,
  property: {
    pattern: /(\.?)\w+/,
    lookbehind: false,
  },
};

const StyledCode = styled.div<{ skin: Skin; actionable: boolean }>`
  position: relative;
  cursor: ${props => (props.actionable ? "pointer" : "default")};
  ${props => (props.skin === Skin.DARK ? themes.DARK : themes.LIGHT)};
  padding: 0 5px;
  & div.clipboard-message {
    position: absolute;
    left: 0;
    height: 100%;
    top: 0;
    width: 100%;

    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    z-index: 1;
    &.success {
      background: ${Colors.BLACK_PEARL};
    }
    &.error {
      background: ${Colors.RED};
    }
  }
  & {
    .copy-icon {
      display: none;
      float: right;
      color: ${Colors.GRAY};
    }
  }
  &:hover {
    .copy-icon {
      display: inline;
    }
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
  skin?: Skin;
  enableCopyToClipboard?: boolean;
  multiline?: boolean;
};

export const HighlightedCode = (props: HighlightedCodeProps) => {
  const codeBlockRef: MutableRefObject<HTMLElement | null> = useRef(null);
  const preBlockRef: MutableRefObject<HTMLPreElement | null> = useRef(null);
  const codeRef:
    | MutableRefObject<HTMLElement | null>
    | MutableRefObject<HTMLPreElement | null> = props.multiline
    ? preBlockRef
    : codeBlockRef;

  const write = useClipboard(codeRef);

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

  const copyToClipboard = () => {
    write(props.codeText);
  };

  return (
    <StyledCode
      skin={props.skin || Skin.DARK}
      onClick={!!props.enableCopyToClipboard ? copyToClipboard : noop}
      actionable={!!props.enableCopyToClipboard}
    >
      {!props.multiline && (
        <code ref={codeRef} className={language}>
          {props.codeText}
        </code>
      )}
      {!!props.enableCopyToClipboard && (
        <Icon icon="duplicate" className="copy-icon" />
      )}
    </StyledCode>
  );
};

export default HighlightedCode;
