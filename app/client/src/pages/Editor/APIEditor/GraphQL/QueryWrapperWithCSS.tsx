import { Colors } from "constants/Colors";
import styled from "styled-components";

const QueryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  /* This CSS is adopted from GraphiQL to maintain the consistency with the GraphiQL playground */
  /* COLORS */

  /* Comment */
  .cm-comment {
    color: #999;
  }

  /* Punctuation */
  .cm-punctuation {
    color: #555;
  }

  /* Keyword */
  .cm-keyword,
  span.cm-m-graphql.cm-attribute {
    color: #b11a04;
  }

  /* OperationName, FragmentName */
  .cm-def {
    color: #d2054e;
  }

  /* FieldName */
  .cm-property {
    color: #1f61a0;
  }

  /* FieldAlias */
  .cm-qualifier {
    color: #1c92a9;
  }

  /* ArgumentName and ObjectFieldName */
  .cm-attribute {
    color: #8b2bb9;
  }

  /* Number */
  .cm-number {
    color: #2882f9;
  }

  /* String */
  .cm-string {
    color: #d64292;
  }

  /* Boolean */
  .cm-builtin {
    color: #d47509;
  }

  /* EnumValue */
  .cm-string-2 {
    color: #0b7fc7;
  }

  /* Variable */
  .cm-variable {
    color: #397d13;
  }

  /* Directive */
  .cm-meta {
    color: #b33086;
  }

  /* Type */
  .cm-atom {
    color: #ca9800;
  }

  /* CURSOR */

  /* DEFAULT THEME */

  .cm-s-default .cm-keyword {
    color: #708;
  }

  .cm-s-default .cm-atom {
    color: #219;
  }

  .cm-s-default .cm-number {
    color: #164;
  }

  .cm-s-default .cm-def {
    color: #00f;
  }

  .cm-s-default .cm-variable-2 {
    color: #05a;
  }

  .cm-s-default .cm-variable-3 {
    color: #085;
  }

  .cm-s-default .cm-comment {
    color: #a50;
  }

  .cm-s-default .cm-string {
    color: #a11;
  }

  .cm-s-default .cm-string-2 {
    color: #f50;
  }

  .cm-s-default .cm-meta {
    color: #555;
  }

  .cm-s-default .cm-qualifier {
    color: #555;
  }

  .cm-s-default .cm-builtin {
    color: #30a;
  }

  .cm-s-default .cm-bracket {
    color: #997;
  }

  .cm-s-default .cm-tag {
    color: #170;
  }

  .cm-s-default .cm-attribute {
    color: #00c;
  }

  .cm-s-default .cm-header {
    color: blue;
  }

  .cm-s-default .cm-quote {
    color: #090;
  }

  .cm-s-default .cm-hr {
    color: #999;
  }

  .cm-s-default .cm-link {
    color: #00c;
  }

  .cm-negative {
    color: #d44;
  }

  .cm-positive {
    color: #292;
  }

  .cm-header,
  .cm-strong {
    font-weight: bold;
  }

  .cm-em {
    font-style: italic;
  }

  .cm-link {
    text-decoration: underline;
  }

  .cm-strikethrough {
    text-decoration: line-through;
  }

  .cm-s-default .cm-error {
    color: #f00;
  }

  .cm-invalidchar {
    color: #f00;
  }

  .CodeMirror-composing {
    border-bottom: 2px solid;
  }

  /* Default styles for common addons */

  div.CodeMirror span.CodeMirror-matchingbracket {
    color: #0f0;
  }

  .CodeMirror-matchingtag {
    background: rgba(255, 150, 0, 0.3);
  }

  .CodeMirror-activeline-background {
    background: #e8f2ff;
  }

  /* STOP */

  .CodeMirror-info .type-name {
    color: #ca9800;
  }

  .CodeMirror-info .field-name {
    color: #1f61a0;
  }

  .CodeMirror-info .enum-value {
    color: #0b7fc7;
  }

  .CodeMirror-info .arg-name {
    color: #8b2bb9;
  }

  .CodeMirror-info .directive-name {
    color: #b33086;
  }

  .CodeMirror-jump-token {
    text-decoration: underline;
    cursor: pointer;
  }

  &&&&& .CodeMirror {
    border: 0;
  }

  &&& .CodeMirror-gutters {
    background: ${Colors.GRAY_50};
  }
`;

export default QueryWrapper;
