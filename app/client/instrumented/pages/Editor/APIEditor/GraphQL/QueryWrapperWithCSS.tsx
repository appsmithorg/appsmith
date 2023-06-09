function cov_247cefnkf4() {
  var path = "/Users/apple/github/appsmith/app/client/src/pages/Editor/APIEditor/GraphQL/QueryWrapperWithCSS.tsx";
  var hash = "062dd32716284c08f24bf9dd65d8f961c9172941";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/pages/Editor/APIEditor/GraphQL/QueryWrapperWithCSS.tsx",
    statementMap: {
      "0": {
        start: {
          line: 4,
          column: 21
        },
        end: {
          line: 248,
          column: 1
        }
      }
    },
    fnMap: {},
    branchMap: {},
    s: {
      "0": 0
    },
    f: {},
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "062dd32716284c08f24bf9dd65d8f961c9172941"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_247cefnkf4 = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_247cefnkf4();
// import { Colors } from "constants/Colors";
import styled from "styled-components";
const QueryWrapper = (cov_247cefnkf4().s[0]++, styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-left: 2px;
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
    background: var(--ads-v2-color-bg-subtle);
  }
`);
export default QueryWrapper;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMjQ3Y2VmbmtmNCIsImFjdHVhbENvdmVyYWdlIiwic3R5bGVkIiwiUXVlcnlXcmFwcGVyIiwicyIsImRpdiJdLCJzb3VyY2VzIjpbIlF1ZXJ5V3JhcHBlcldpdGhDU1MudHN4Il0sInNvdXJjZXNDb250ZW50IjpbIi8vIGltcG9ydCB7IENvbG9ycyB9IGZyb20gXCJjb25zdGFudHMvQ29sb3JzXCI7XG5pbXBvcnQgc3R5bGVkIGZyb20gXCJzdHlsZWQtY29tcG9uZW50c1wiO1xuXG5jb25zdCBRdWVyeVdyYXBwZXIgPSBzdHlsZWQuZGl2YFxuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICB3aWR0aDogMTAwJTtcbiAgcGFkZGluZy1sZWZ0OiAycHg7XG4gIC8qIFRoaXMgQ1NTIGlzIGFkb3B0ZWQgZnJvbSBHcmFwaGlRTCB0byBtYWludGFpbiB0aGUgY29uc2lzdGVuY3kgd2l0aCB0aGUgR3JhcGhpUUwgcGxheWdyb3VuZCAqL1xuICAvKiBDT0xPUlMgKi9cblxuICAvKiBDb21tZW50ICovXG4gIC5jbS1jb21tZW50IHtcbiAgICBjb2xvcjogIzk5OTtcbiAgfVxuXG4gIC8qIFB1bmN0dWF0aW9uICovXG4gIC5jbS1wdW5jdHVhdGlvbiB7XG4gICAgY29sb3I6ICM1NTU7XG4gIH1cblxuICAvKiBLZXl3b3JkICovXG4gIC5jbS1rZXl3b3JkLFxuICBzcGFuLmNtLW0tZ3JhcGhxbC5jbS1hdHRyaWJ1dGUge1xuICAgIGNvbG9yOiAjYjExYTA0O1xuICB9XG5cbiAgLyogT3BlcmF0aW9uTmFtZSwgRnJhZ21lbnROYW1lICovXG4gIC5jbS1kZWYge1xuICAgIGNvbG9yOiAjZDIwNTRlO1xuICB9XG5cbiAgLyogRmllbGROYW1lICovXG4gIC5jbS1wcm9wZXJ0eSB7XG4gICAgY29sb3I6ICMxZjYxYTA7XG4gIH1cblxuICAvKiBGaWVsZEFsaWFzICovXG4gIC5jbS1xdWFsaWZpZXIge1xuICAgIGNvbG9yOiAjMWM5MmE5O1xuICB9XG5cbiAgLyogQXJndW1lbnROYW1lIGFuZCBPYmplY3RGaWVsZE5hbWUgKi9cbiAgLmNtLWF0dHJpYnV0ZSB7XG4gICAgY29sb3I6ICM4YjJiYjk7XG4gIH1cblxuICAvKiBOdW1iZXIgKi9cbiAgLmNtLW51bWJlciB7XG4gICAgY29sb3I6ICMyODgyZjk7XG4gIH1cblxuICAvKiBTdHJpbmcgKi9cbiAgLmNtLXN0cmluZyB7XG4gICAgY29sb3I6ICNkNjQyOTI7XG4gIH1cblxuICAvKiBCb29sZWFuICovXG4gIC5jbS1idWlsdGluIHtcbiAgICBjb2xvcjogI2Q0NzUwOTtcbiAgfVxuXG4gIC8qIEVudW1WYWx1ZSAqL1xuICAuY20tc3RyaW5nLTIge1xuICAgIGNvbG9yOiAjMGI3ZmM3O1xuICB9XG5cbiAgLyogVmFyaWFibGUgKi9cbiAgLmNtLXZhcmlhYmxlIHtcbiAgICBjb2xvcjogIzM5N2QxMztcbiAgfVxuXG4gIC8qIERpcmVjdGl2ZSAqL1xuICAuY20tbWV0YSB7XG4gICAgY29sb3I6ICNiMzMwODY7XG4gIH1cblxuICAvKiBUeXBlICovXG4gIC5jbS1hdG9tIHtcbiAgICBjb2xvcjogI2NhOTgwMDtcbiAgfVxuXG4gIC8qIENVUlNPUiAqL1xuXG4gIC8qIERFRkFVTFQgVEhFTUUgKi9cblxuICAuY20tcy1kZWZhdWx0IC5jbS1rZXl3b3JkIHtcbiAgICBjb2xvcjogIzcwODtcbiAgfVxuXG4gIC5jbS1zLWRlZmF1bHQgLmNtLWF0b20ge1xuICAgIGNvbG9yOiAjMjE5O1xuICB9XG5cbiAgLmNtLXMtZGVmYXVsdCAuY20tbnVtYmVyIHtcbiAgICBjb2xvcjogIzE2NDtcbiAgfVxuXG4gIC5jbS1zLWRlZmF1bHQgLmNtLWRlZiB7XG4gICAgY29sb3I6ICMwMGY7XG4gIH1cblxuICAuY20tcy1kZWZhdWx0IC5jbS12YXJpYWJsZS0yIHtcbiAgICBjb2xvcjogIzA1YTtcbiAgfVxuXG4gIC5jbS1zLWRlZmF1bHQgLmNtLXZhcmlhYmxlLTMge1xuICAgIGNvbG9yOiAjMDg1O1xuICB9XG5cbiAgLmNtLXMtZGVmYXVsdCAuY20tY29tbWVudCB7XG4gICAgY29sb3I6ICNhNTA7XG4gIH1cblxuICAuY20tcy1kZWZhdWx0IC5jbS1zdHJpbmcge1xuICAgIGNvbG9yOiAjYTExO1xuICB9XG5cbiAgLmNtLXMtZGVmYXVsdCAuY20tc3RyaW5nLTIge1xuICAgIGNvbG9yOiAjZjUwO1xuICB9XG5cbiAgLmNtLXMtZGVmYXVsdCAuY20tbWV0YSB7XG4gICAgY29sb3I6ICM1NTU7XG4gIH1cblxuICAuY20tcy1kZWZhdWx0IC5jbS1xdWFsaWZpZXIge1xuICAgIGNvbG9yOiAjNTU1O1xuICB9XG5cbiAgLmNtLXMtZGVmYXVsdCAuY20tYnVpbHRpbiB7XG4gICAgY29sb3I6ICMzMGE7XG4gIH1cblxuICAuY20tcy1kZWZhdWx0IC5jbS1icmFja2V0IHtcbiAgICBjb2xvcjogIzk5NztcbiAgfVxuXG4gIC5jbS1zLWRlZmF1bHQgLmNtLXRhZyB7XG4gICAgY29sb3I6ICMxNzA7XG4gIH1cblxuICAuY20tcy1kZWZhdWx0IC5jbS1hdHRyaWJ1dGUge1xuICAgIGNvbG9yOiAjMDBjO1xuICB9XG5cbiAgLmNtLXMtZGVmYXVsdCAuY20taGVhZGVyIHtcbiAgICBjb2xvcjogYmx1ZTtcbiAgfVxuXG4gIC5jbS1zLWRlZmF1bHQgLmNtLXF1b3RlIHtcbiAgICBjb2xvcjogIzA5MDtcbiAgfVxuXG4gIC5jbS1zLWRlZmF1bHQgLmNtLWhyIHtcbiAgICBjb2xvcjogIzk5OTtcbiAgfVxuXG4gIC5jbS1zLWRlZmF1bHQgLmNtLWxpbmsge1xuICAgIGNvbG9yOiAjMDBjO1xuICB9XG5cbiAgLmNtLW5lZ2F0aXZlIHtcbiAgICBjb2xvcjogI2Q0NDtcbiAgfVxuXG4gIC5jbS1wb3NpdGl2ZSB7XG4gICAgY29sb3I6ICMyOTI7XG4gIH1cblxuICAuY20taGVhZGVyLFxuICAuY20tc3Ryb25nIHtcbiAgICBmb250LXdlaWdodDogYm9sZDtcbiAgfVxuXG4gIC5jbS1lbSB7XG4gICAgZm9udC1zdHlsZTogaXRhbGljO1xuICB9XG5cbiAgLmNtLWxpbmsge1xuICAgIHRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lO1xuICB9XG5cbiAgLmNtLXN0cmlrZXRocm91Z2gge1xuICAgIHRleHQtZGVjb3JhdGlvbjogbGluZS10aHJvdWdoO1xuICB9XG5cbiAgLmNtLXMtZGVmYXVsdCAuY20tZXJyb3Ige1xuICAgIGNvbG9yOiAjZjAwO1xuICB9XG5cbiAgLmNtLWludmFsaWRjaGFyIHtcbiAgICBjb2xvcjogI2YwMDtcbiAgfVxuXG4gIC5Db2RlTWlycm9yLWNvbXBvc2luZyB7XG4gICAgYm9yZGVyLWJvdHRvbTogMnB4IHNvbGlkO1xuICB9XG5cbiAgLyogRGVmYXVsdCBzdHlsZXMgZm9yIGNvbW1vbiBhZGRvbnMgKi9cblxuICBkaXYuQ29kZU1pcnJvciBzcGFuLkNvZGVNaXJyb3ItbWF0Y2hpbmdicmFja2V0IHtcbiAgICBjb2xvcjogIzBmMDtcbiAgfVxuXG4gIC5Db2RlTWlycm9yLW1hdGNoaW5ndGFnIHtcbiAgICBiYWNrZ3JvdW5kOiByZ2JhKDI1NSwgMTUwLCAwLCAwLjMpO1xuICB9XG5cbiAgLkNvZGVNaXJyb3ItYWN0aXZlbGluZS1iYWNrZ3JvdW5kIHtcbiAgICBiYWNrZ3JvdW5kOiAjZThmMmZmO1xuICB9XG5cbiAgLyogU1RPUCAqL1xuXG4gIC5Db2RlTWlycm9yLWluZm8gLnR5cGUtbmFtZSB7XG4gICAgY29sb3I6ICNjYTk4MDA7XG4gIH1cblxuICAuQ29kZU1pcnJvci1pbmZvIC5maWVsZC1uYW1lIHtcbiAgICBjb2xvcjogIzFmNjFhMDtcbiAgfVxuXG4gIC5Db2RlTWlycm9yLWluZm8gLmVudW0tdmFsdWUge1xuICAgIGNvbG9yOiAjMGI3ZmM3O1xuICB9XG5cbiAgLkNvZGVNaXJyb3ItaW5mbyAuYXJnLW5hbWUge1xuICAgIGNvbG9yOiAjOGIyYmI5O1xuICB9XG5cbiAgLkNvZGVNaXJyb3ItaW5mbyAuZGlyZWN0aXZlLW5hbWUge1xuICAgIGNvbG9yOiAjYjMzMDg2O1xuICB9XG5cbiAgLkNvZGVNaXJyb3ItanVtcC10b2tlbiB7XG4gICAgdGV4dC1kZWNvcmF0aW9uOiB1bmRlcmxpbmU7XG4gICAgY3Vyc29yOiBwb2ludGVyO1xuICB9XG5cbiAgJiYmJiYgLkNvZGVNaXJyb3Ige1xuICAgIGJvcmRlcjogMDtcbiAgfVxuXG4gICYmJiAuQ29kZU1pcnJvci1ndXR0ZXJzIHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1hZHMtdjItY29sb3ItYmctc3VidGxlKTtcbiAgfVxuYDtcblxuZXhwb3J0IGRlZmF1bHQgUXVlcnlXcmFwcGVyO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVZO0lBQUFBLGNBQUEsWUFBQUEsQ0FBQTtNQUFBLE9BQUFDLGNBQUE7SUFBQTtFQUFBO0VBQUEsT0FBQUEsY0FBQTtBQUFBO0FBQUFELGNBQUE7QUFmWjtBQUNBLE9BQU9FLE1BQU0sTUFBTSxtQkFBbUI7QUFFdEMsTUFBTUMsWUFBWSxJQUFBSCxjQUFBLEdBQUFJLENBQUEsT0FBR0YsTUFBTSxDQUFDRyxHQUFJO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFFRCxlQUFlRixZQUFZIn0=