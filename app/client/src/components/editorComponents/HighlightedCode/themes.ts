import { Colors } from "constants/Colors";
import { css } from "styled-components";

export const LIGHT = css`
  code[class*="language-"],
  pre[class*="language-"] {
    color: black;
    background: none;
    text-shadow: 0 1px white;
    font-family: ${(props) => props.theme.fonts.code};
    font-size: 1em;
    text-align: left;
    white-space: pre;
    word-spacing: normal;
    word-break: break-word;
    word-wrap: normal;
    line-height: 1.5;

    -moz-tab-size: 4;
    -o-tab-size: 4;
    tab-size: 4;

    -webkit-hyphens: none;
    -moz-hyphens: none;
    -ms-hyphens: none;
    hyphens: none;
  }

  pre[class*="language-"]::-moz-selection,
  pre[class*="language-"] ::-moz-selection,
  code[class*="language-"]::-moz-selection,
  code[class*="language-"] ::-moz-selection {
    text-shadow: none;
    background: #b3d4fc;
  }

  pre[class*="language-"]::selection,
  pre[class*="language-"] ::selection,
  code[class*="language-"]::selection,
  code[class*="language-"] ::selection {
    text-shadow: none;
    background: #b3d4fc;
  }

  @media print {
    code[class*="language-"],
    pre[class*="language-"] {
      text-shadow: none;
    }
  }

  /* Code blocks */
  pre[class*="language-"] {
    padding: 1em;
    margin: 0.5em 0;
    overflow: auto;
  }

  :not(pre) > code[class*="language-"],
  pre[class*="language-"] {
    background: #f5f2f0;
  }

  /* Inline code */
  :not(pre) > code[class*="language-"] {
    padding: 0.1em;
    border-radius: 0.3em;
    white-space: normal;
  }

  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: slategray;
  }

  .token.punctuation {
    color: #999;
  }

  .token.namespace {
    opacity: 0.7;
  }

  .token.property,
  .token.tag,
  .token.boolean,
  .token.number,
  .token.constant,
  .token.symbol,
  .token.deleted {
    color: #905;
  }

  .token.selector,
  .token.attr-name,
  .token.string,
  .token.char,
  .token.builtin,
  .token.inserted {
    color: #690;
  }

  .token.operator,
  .token.entity,
  .token.url,
  .language-css .token.string,
  .style .token.string {
    color: #9a6e3a;
    background: hsla(0, 0%, 100%, 0.5);
  }

  .token.atrule,
  .token.attr-value,
  .token.keyword {
    color: #07a;
  }

  .token.function,
  .token.class-name {
    color: #dd4a68;
  }

  .token.regex,
  .token.important,
  .token.variable {
    color: #e90;
  }

  .token.important,
  .token.bold {
    font-weight: bold;
  }
  .token.italic {
    font-style: italic;
  }

  .token.entity {
    cursor: help;
  }
`;
export const DARK = css`
  code[class*="language-"],
  pre[class*="language-"] {
    color: ${Colors.CHARCOAL};
    background: none;
    font-family: ${(props) => props.theme.fonts.code};
    font-size: 1em;
    text-align: left;
    text-shadow: 0 -0.1em 0.2em black;
    white-space: pre;
    word-spacing: normal;
    word-break: normal;
    word-wrap: normal;
    line-height: 1.5;

    -moz-tab-size: 4;
    -o-tab-size: 4;
    tab-size: 4;

    -webkit-hyphens: none;
    -moz-hyphens: none;
    -ms-hyphens: none;
    hyphens: none;
  }

  pre[class*="language-"],
  :not(pre) > code[class*="language-"] {
    background: hsl(0, 0%, 8%); /* #141414 */
  }

  /* Code blocks */
  pre[class*="language-"] {
    border-radius: 0.5em;
    border: 0.3em solid hsl(0, 0%, 33%); /* #282A2B */
    box-shadow: 1px 1px 0.5em black inset;
    margin: 0.5em 0;
    overflow: auto;
    padding: 1em;
  }

  pre[class*="language-"]::-moz-selection {
    /* Firefox */
    background: hsl(200, 4%, 16%); /* #282A2B */
  }

  pre[class*="language-"]::selection {
    /* Safari */
    background: hsl(200, 4%, 16%); /* #282A2B */
  }

  /* Text Selection colour */
  pre[class*="language-"]::-moz-selection,
  pre[class*="language-"] ::-moz-selection,
  code[class*="language-"]::-moz-selection,
  code[class*="language-"] ::-moz-selection {
    text-shadow: none;
    background: hsla(0, 0%, 93%, 0.15); /* #EDEDED */
  }

  pre[class*="language-"]::selection,
  pre[class*="language-"] ::selection,
  code[class*="language-"]::selection,
  code[class*="language-"] ::selection {
    text-shadow: none;
    background: hsla(0, 0%, 93%, 0.15); /* #EDEDED */
  }

  /* Inline code */
  :not(pre) > code[class*="language-"] {
    border-radius: 0.3em;
    border: 0.13em solid hsl(0, 0%, 33%); /* #545454 */
    box-shadow: 1px 1px 0.3em -0.1em black inset;
    padding: 0.15em 0.2em 0.05em;
    white-space: normal;
  }

  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: hsl(0, 0%, 47%); /* #777777 */
  }

  .token.punctuation {
    opacity: 0.7;
  }

  .token.namespace {
    opacity: 0.7;
  }

  .token.tag,
  .token.boolean,
  .token.number,
  .token.deleted {
    color: hsl(14, 58%, 55%); /* #CF6A4C */
  }

  .token.keyword,
  .token.property,
  .token.selector,
  .token.constant,
  .token.symbol,
  .token.builtin {
    color: rgb(3, 179, 101);
  }

  .token.attr-name,
  .token.attr-value,
  .token.string,
  .token.char,
  .token.operator,
  .token.entity,
  .token.url,
  .language-css .token.string,
  .style .token.string,
  .token.variable,
  .token.inserted {
    color: hsl(76, 21%, 52%); /* #8F9D6A */
  }

  .token.atrule {
    color: hsl(218, 22%, 55%); /* #7587A6 */
  }

  .token.regex,
  .token.important {
    color: hsl(42, 75%, 65%); /* #E9C062 */
  }

  .token.important,
  .token.bold {
    font-weight: bold;
  }
  .token.italic {
    font-style: italic;
  }

  .token.entity {
    cursor: help;
  }

  pre[data-line] {
    padding: 1em 0 1em 3em;
    position: relative;
  }

  /* Markup */
  .language-markup .token.tag,
  .language-markup .token.attr-name,
  .language-markup .token.punctuation {
    color: hsl(33, 33%, 52%); /* #AC885B */
  }

  /* Make the tokens sit above the line highlight so the colours don't look faded. */
  .token {
    position: relative;
    z-index: 1;
  }

  .line-highlight {
    background: hsla(0, 0%, 33%, 0.25); /* #545454 */
    background: linear-gradient(
      to right,
      hsla(0, 0%, 33%, 0.1) 70%,
      hsla(0, 0%, 33%, 0)
    ); /* #545454 */
    border-bottom: 1px dashed hsl(0, 0%, 33%); /* #545454 */
    border-top: 1px dashed hsl(0, 0%, 33%); /* #545454 */
    left: 0;
    line-height: inherit;
    margin-top: 0.75em; /* Same as .prism’s padding-top */
    padding: inherit 0;
    pointer-events: none;
    position: absolute;
    right: 0;
    white-space: pre;
    z-index: 0;
  }

  .line-highlight:before,
  .line-highlight[data-end]:after {
    background-color: hsl(215, 15%, 59%); /* #8794A6 */
    border-radius: 999px;
    box-shadow: 0 1px white;
    color: hsl(24, 20%, 95%); /* #F5F2F0 */
    content: attr(data-start);
    font: bold 65%/1.5 sans-serif;
    left: 0.6em;
    min-width: 1em;
    padding: 0 0.5em;
    position: absolute;
    text-align: center;
    text-shadow: none;
    top: 0.4em;
    vertical-align: 0.3em;
  }

  .line-highlight[data-end]:after {
    bottom: 0.4em;
    content: attr(data-end);
    top: auto;
  }
`;
export default { LIGHT, DARK };
