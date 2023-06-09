function cov_1leqrv8owk() {
  var path = "/Users/apple/github/appsmith/app/client/src/components/editorComponents/HighlightedCode/themes.ts";
  var hash = "f4eca48432b3aaa545af5c521bfd36dc8752656e";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/Users/apple/github/appsmith/app/client/src/components/editorComponents/HighlightedCode/themes.ts",
    statementMap: {
      "0": {
        start: {
          line: 4,
          column: 21
        },
        end: {
          line: 142,
          column: 1
        }
      },
      "1": {
        start: {
          line: 10,
          column: 30
        },
        end: {
          line: 10,
          column: 52
        }
      },
      "2": {
        start: {
          line: 143,
          column: 20
        },
        end: {
          line: 346,
          column: 1
        }
      },
      "3": {
        start: {
          line: 148,
          column: 30
        },
        end: {
          line: 148,
          column: 52
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 10,
            column: 19
          },
          end: {
            line: 10,
            column: 20
          }
        },
        loc: {
          start: {
            line: 10,
            column: 30
          },
          end: {
            line: 10,
            column: 52
          }
        },
        line: 10
      },
      "1": {
        name: "(anonymous_1)",
        decl: {
          start: {
            line: 148,
            column: 19
          },
          end: {
            line: 148,
            column: 20
          }
        },
        loc: {
          start: {
            line: 148,
            column: 30
          },
          end: {
            line: 148,
            column: 52
          }
        },
        line: 148
      }
    },
    branchMap: {},
    s: {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0
    },
    f: {
      "0": 0,
      "1": 0
    },
    b: {},
    _coverageSchema: "1a1c01bbd47fc00a2c39e90264f33305004495a9",
    hash: "f4eca48432b3aaa545af5c521bfd36dc8752656e"
  };
  var coverage = global[gcv] || (global[gcv] = {});
  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }
  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_1leqrv8owk = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}
cov_1leqrv8owk();
import { Colors } from "constants/Colors";
import { css } from "styled-components";
export const LIGHT = (cov_1leqrv8owk().s[0]++, css`
  code[class*="language-"],
  pre[class*="language-"] {
    color: black;
    background: none;
    text-shadow: 0 1px white;
    font-family: ${props => {
  cov_1leqrv8owk().f[0]++;
  cov_1leqrv8owk().s[1]++;
  return props.theme.fonts.code;
}};
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
    color: var(--ads-v2-color-fg);
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
`);
export const DARK = (cov_1leqrv8owk().s[2]++, css`
  code[class*="language-"],
  pre[class*="language-"] {
    color: ${Colors.CHARCOAL};
    background: none;
    font-family: ${props => {
  cov_1leqrv8owk().f[1]++;
  cov_1leqrv8owk().s[3]++;
  return props.theme.fonts.code;
}};
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
`);
export default {
  LIGHT,
  DARK
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJjb3ZfMWxlcXJ2OG93ayIsImFjdHVhbENvdmVyYWdlIiwiQ29sb3JzIiwiY3NzIiwiTElHSFQiLCJzIiwicHJvcHMiLCJmIiwidGhlbWUiLCJmb250cyIsImNvZGUiLCJEQVJLIiwiQ0hBUkNPQUwiXSwic291cmNlcyI6WyJ0aGVtZXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29sb3JzIH0gZnJvbSBcImNvbnN0YW50cy9Db2xvcnNcIjtcbmltcG9ydCB7IGNzcyB9IGZyb20gXCJzdHlsZWQtY29tcG9uZW50c1wiO1xuXG5leHBvcnQgY29uc3QgTElHSFQgPSBjc3NgXG4gIGNvZGVbY2xhc3MqPVwibGFuZ3VhZ2UtXCJdLFxuICBwcmVbY2xhc3MqPVwibGFuZ3VhZ2UtXCJdIHtcbiAgICBjb2xvcjogYmxhY2s7XG4gICAgYmFja2dyb3VuZDogbm9uZTtcbiAgICB0ZXh0LXNoYWRvdzogMCAxcHggd2hpdGU7XG4gICAgZm9udC1mYW1pbHk6ICR7KHByb3BzKSA9PiBwcm9wcy50aGVtZS5mb250cy5jb2RlfTtcbiAgICBmb250LXNpemU6IDFlbTtcbiAgICB0ZXh0LWFsaWduOiBsZWZ0O1xuICAgIHdoaXRlLXNwYWNlOiBwcmU7XG4gICAgd29yZC1zcGFjaW5nOiBub3JtYWw7XG4gICAgd29yZC1icmVhazogYnJlYWstd29yZDtcbiAgICB3b3JkLXdyYXA6IG5vcm1hbDtcbiAgICBsaW5lLWhlaWdodDogMS41O1xuXG4gICAgLW1vei10YWItc2l6ZTogNDtcbiAgICAtby10YWItc2l6ZTogNDtcbiAgICB0YWItc2l6ZTogNDtcblxuICAgIC13ZWJraXQtaHlwaGVuczogbm9uZTtcbiAgICAtbW96LWh5cGhlbnM6IG5vbmU7XG4gICAgLW1zLWh5cGhlbnM6IG5vbmU7XG4gICAgaHlwaGVuczogbm9uZTtcbiAgfVxuXG4gIHByZVtjbGFzcyo9XCJsYW5ndWFnZS1cIl06Oi1tb3otc2VsZWN0aW9uLFxuICBwcmVbY2xhc3MqPVwibGFuZ3VhZ2UtXCJdIDo6LW1vei1zZWxlY3Rpb24sXG4gIGNvZGVbY2xhc3MqPVwibGFuZ3VhZ2UtXCJdOjotbW96LXNlbGVjdGlvbixcbiAgY29kZVtjbGFzcyo9XCJsYW5ndWFnZS1cIl0gOjotbW96LXNlbGVjdGlvbiB7XG4gICAgdGV4dC1zaGFkb3c6IG5vbmU7XG4gICAgYmFja2dyb3VuZDogI2IzZDRmYztcbiAgfVxuXG4gIHByZVtjbGFzcyo9XCJsYW5ndWFnZS1cIl06OnNlbGVjdGlvbixcbiAgcHJlW2NsYXNzKj1cImxhbmd1YWdlLVwiXSA6OnNlbGVjdGlvbixcbiAgY29kZVtjbGFzcyo9XCJsYW5ndWFnZS1cIl06OnNlbGVjdGlvbixcbiAgY29kZVtjbGFzcyo9XCJsYW5ndWFnZS1cIl0gOjpzZWxlY3Rpb24ge1xuICAgIHRleHQtc2hhZG93OiBub25lO1xuICAgIGJhY2tncm91bmQ6ICNiM2Q0ZmM7XG4gIH1cblxuICBAbWVkaWEgcHJpbnQge1xuICAgIGNvZGVbY2xhc3MqPVwibGFuZ3VhZ2UtXCJdLFxuICAgIHByZVtjbGFzcyo9XCJsYW5ndWFnZS1cIl0ge1xuICAgICAgdGV4dC1zaGFkb3c6IG5vbmU7XG4gICAgfVxuICB9XG5cbiAgLyogQ29kZSBibG9ja3MgKi9cbiAgcHJlW2NsYXNzKj1cImxhbmd1YWdlLVwiXSB7XG4gICAgcGFkZGluZzogMWVtO1xuICAgIG1hcmdpbjogMC41ZW0gMDtcbiAgICBvdmVyZmxvdzogYXV0bztcbiAgfVxuXG4gIDpub3QocHJlKSA+IGNvZGVbY2xhc3MqPVwibGFuZ3VhZ2UtXCJdLFxuICBwcmVbY2xhc3MqPVwibGFuZ3VhZ2UtXCJdIHtcbiAgICBiYWNrZ3JvdW5kOiAjZjVmMmYwO1xuICB9XG5cbiAgLyogSW5saW5lIGNvZGUgKi9cbiAgOm5vdChwcmUpID4gY29kZVtjbGFzcyo9XCJsYW5ndWFnZS1cIl0ge1xuICAgIHBhZGRpbmc6IDAuMWVtO1xuICAgIGJvcmRlci1yYWRpdXM6IDAuM2VtO1xuICAgIHdoaXRlLXNwYWNlOiBub3JtYWw7XG4gIH1cblxuICAudG9rZW4uY29tbWVudCxcbiAgLnRva2VuLnByb2xvZyxcbiAgLnRva2VuLmRvY3R5cGUsXG4gIC50b2tlbi5jZGF0YSB7XG4gICAgY29sb3I6IHNsYXRlZ3JheTtcbiAgfVxuXG4gIC50b2tlbi5wdW5jdHVhdGlvbiB7XG4gICAgY29sb3I6IHZhcigtLWFkcy12Mi1jb2xvci1mZyk7XG4gIH1cblxuICAudG9rZW4ubmFtZXNwYWNlIHtcbiAgICBvcGFjaXR5OiAwLjc7XG4gIH1cblxuICAudG9rZW4ucHJvcGVydHksXG4gIC50b2tlbi50YWcsXG4gIC50b2tlbi5ib29sZWFuLFxuICAudG9rZW4ubnVtYmVyLFxuICAudG9rZW4uY29uc3RhbnQsXG4gIC50b2tlbi5zeW1ib2wsXG4gIC50b2tlbi5kZWxldGVkIHtcbiAgICBjb2xvcjogIzkwNTtcbiAgfVxuXG4gIC50b2tlbi5zZWxlY3RvcixcbiAgLnRva2VuLmF0dHItbmFtZSxcbiAgLnRva2VuLnN0cmluZyxcbiAgLnRva2VuLmNoYXIsXG4gIC50b2tlbi5idWlsdGluLFxuICAudG9rZW4uaW5zZXJ0ZWQge1xuICAgIGNvbG9yOiAjNjkwO1xuICB9XG5cbiAgLnRva2VuLm9wZXJhdG9yLFxuICAudG9rZW4uZW50aXR5LFxuICAudG9rZW4udXJsLFxuICAubGFuZ3VhZ2UtY3NzIC50b2tlbi5zdHJpbmcsXG4gIC5zdHlsZSAudG9rZW4uc3RyaW5nIHtcbiAgICBjb2xvcjogIzlhNmUzYTtcbiAgICBiYWNrZ3JvdW5kOiBoc2xhKDAsIDAlLCAxMDAlLCAwLjUpO1xuICB9XG5cbiAgLnRva2VuLmF0cnVsZSxcbiAgLnRva2VuLmF0dHItdmFsdWUsXG4gIC50b2tlbi5rZXl3b3JkIHtcbiAgICBjb2xvcjogIzA3YTtcbiAgfVxuXG4gIC50b2tlbi5mdW5jdGlvbixcbiAgLnRva2VuLmNsYXNzLW5hbWUge1xuICAgIGNvbG9yOiAjZGQ0YTY4O1xuICB9XG5cbiAgLnRva2VuLnJlZ2V4LFxuICAudG9rZW4uaW1wb3J0YW50LFxuICAudG9rZW4udmFyaWFibGUge1xuICAgIGNvbG9yOiAjZTkwO1xuICB9XG5cbiAgLnRva2VuLmltcG9ydGFudCxcbiAgLnRva2VuLmJvbGQge1xuICAgIGZvbnQtd2VpZ2h0OiBib2xkO1xuICB9XG4gIC50b2tlbi5pdGFsaWMge1xuICAgIGZvbnQtc3R5bGU6IGl0YWxpYztcbiAgfVxuXG4gIC50b2tlbi5lbnRpdHkge1xuICAgIGN1cnNvcjogaGVscDtcbiAgfVxuYDtcbmV4cG9ydCBjb25zdCBEQVJLID0gY3NzYFxuICBjb2RlW2NsYXNzKj1cImxhbmd1YWdlLVwiXSxcbiAgcHJlW2NsYXNzKj1cImxhbmd1YWdlLVwiXSB7XG4gICAgY29sb3I6ICR7Q29sb3JzLkNIQVJDT0FMfTtcbiAgICBiYWNrZ3JvdW5kOiBub25lO1xuICAgIGZvbnQtZmFtaWx5OiAkeyhwcm9wcykgPT4gcHJvcHMudGhlbWUuZm9udHMuY29kZX07XG4gICAgZm9udC1zaXplOiAxZW07XG4gICAgdGV4dC1hbGlnbjogbGVmdDtcbiAgICB0ZXh0LXNoYWRvdzogMCAtMC4xZW0gMC4yZW0gYmxhY2s7XG4gICAgd2hpdGUtc3BhY2U6IHByZTtcbiAgICB3b3JkLXNwYWNpbmc6IG5vcm1hbDtcbiAgICB3b3JkLWJyZWFrOiBub3JtYWw7XG4gICAgd29yZC13cmFwOiBub3JtYWw7XG4gICAgbGluZS1oZWlnaHQ6IDEuNTtcblxuICAgIC1tb3otdGFiLXNpemU6IDQ7XG4gICAgLW8tdGFiLXNpemU6IDQ7XG4gICAgdGFiLXNpemU6IDQ7XG5cbiAgICAtd2Via2l0LWh5cGhlbnM6IG5vbmU7XG4gICAgLW1vei1oeXBoZW5zOiBub25lO1xuICAgIC1tcy1oeXBoZW5zOiBub25lO1xuICAgIGh5cGhlbnM6IG5vbmU7XG4gIH1cblxuICBwcmVbY2xhc3MqPVwibGFuZ3VhZ2UtXCJdLFxuICA6bm90KHByZSkgPiBjb2RlW2NsYXNzKj1cImxhbmd1YWdlLVwiXSB7XG4gICAgYmFja2dyb3VuZDogaHNsKDAsIDAlLCA4JSk7IC8qICMxNDE0MTQgKi9cbiAgfVxuXG4gIC8qIENvZGUgYmxvY2tzICovXG4gIHByZVtjbGFzcyo9XCJsYW5ndWFnZS1cIl0ge1xuICAgIGJvcmRlci1yYWRpdXM6IDAuNWVtO1xuICAgIGJvcmRlcjogMC4zZW0gc29saWQgaHNsKDAsIDAlLCAzMyUpOyAvKiAjMjgyQTJCICovXG4gICAgYm94LXNoYWRvdzogMXB4IDFweCAwLjVlbSBibGFjayBpbnNldDtcbiAgICBtYXJnaW46IDAuNWVtIDA7XG4gICAgb3ZlcmZsb3c6IGF1dG87XG4gICAgcGFkZGluZzogMWVtO1xuICB9XG5cbiAgcHJlW2NsYXNzKj1cImxhbmd1YWdlLVwiXTo6LW1vei1zZWxlY3Rpb24ge1xuICAgIC8qIEZpcmVmb3ggKi9cbiAgICBiYWNrZ3JvdW5kOiBoc2woMjAwLCA0JSwgMTYlKTsgLyogIzI4MkEyQiAqL1xuICB9XG5cbiAgcHJlW2NsYXNzKj1cImxhbmd1YWdlLVwiXTo6c2VsZWN0aW9uIHtcbiAgICAvKiBTYWZhcmkgKi9cbiAgICBiYWNrZ3JvdW5kOiBoc2woMjAwLCA0JSwgMTYlKTsgLyogIzI4MkEyQiAqL1xuICB9XG5cbiAgLyogVGV4dCBTZWxlY3Rpb24gY29sb3VyICovXG4gIHByZVtjbGFzcyo9XCJsYW5ndWFnZS1cIl06Oi1tb3otc2VsZWN0aW9uLFxuICBwcmVbY2xhc3MqPVwibGFuZ3VhZ2UtXCJdIDo6LW1vei1zZWxlY3Rpb24sXG4gIGNvZGVbY2xhc3MqPVwibGFuZ3VhZ2UtXCJdOjotbW96LXNlbGVjdGlvbixcbiAgY29kZVtjbGFzcyo9XCJsYW5ndWFnZS1cIl0gOjotbW96LXNlbGVjdGlvbiB7XG4gICAgdGV4dC1zaGFkb3c6IG5vbmU7XG4gICAgYmFja2dyb3VuZDogaHNsYSgwLCAwJSwgOTMlLCAwLjE1KTsgLyogI0VERURFRCAqL1xuICB9XG5cbiAgcHJlW2NsYXNzKj1cImxhbmd1YWdlLVwiXTo6c2VsZWN0aW9uLFxuICBwcmVbY2xhc3MqPVwibGFuZ3VhZ2UtXCJdIDo6c2VsZWN0aW9uLFxuICBjb2RlW2NsYXNzKj1cImxhbmd1YWdlLVwiXTo6c2VsZWN0aW9uLFxuICBjb2RlW2NsYXNzKj1cImxhbmd1YWdlLVwiXSA6OnNlbGVjdGlvbiB7XG4gICAgdGV4dC1zaGFkb3c6IG5vbmU7XG4gICAgYmFja2dyb3VuZDogaHNsYSgwLCAwJSwgOTMlLCAwLjE1KTsgLyogI0VERURFRCAqL1xuICB9XG5cbiAgLyogSW5saW5lIGNvZGUgKi9cbiAgOm5vdChwcmUpID4gY29kZVtjbGFzcyo9XCJsYW5ndWFnZS1cIl0ge1xuICAgIGJvcmRlci1yYWRpdXM6IDAuM2VtO1xuICAgIGJvcmRlcjogMC4xM2VtIHNvbGlkIGhzbCgwLCAwJSwgMzMlKTsgLyogIzU0NTQ1NCAqL1xuICAgIGJveC1zaGFkb3c6IDFweCAxcHggMC4zZW0gLTAuMWVtIGJsYWNrIGluc2V0O1xuICAgIHBhZGRpbmc6IDAuMTVlbSAwLjJlbSAwLjA1ZW07XG4gICAgd2hpdGUtc3BhY2U6IG5vcm1hbDtcbiAgfVxuXG4gIC50b2tlbi5jb21tZW50LFxuICAudG9rZW4ucHJvbG9nLFxuICAudG9rZW4uZG9jdHlwZSxcbiAgLnRva2VuLmNkYXRhIHtcbiAgICBjb2xvcjogaHNsKDAsIDAlLCA0NyUpOyAvKiAjNzc3Nzc3ICovXG4gIH1cblxuICAudG9rZW4ucHVuY3R1YXRpb24ge1xuICAgIG9wYWNpdHk6IDAuNztcbiAgfVxuXG4gIC50b2tlbi5uYW1lc3BhY2Uge1xuICAgIG9wYWNpdHk6IDAuNztcbiAgfVxuXG4gIC50b2tlbi50YWcsXG4gIC50b2tlbi5ib29sZWFuLFxuICAudG9rZW4ubnVtYmVyLFxuICAudG9rZW4uZGVsZXRlZCB7XG4gICAgY29sb3I6IGhzbCgxNCwgNTglLCA1NSUpOyAvKiAjQ0Y2QTRDICovXG4gIH1cblxuICAudG9rZW4ua2V5d29yZCxcbiAgLnRva2VuLnByb3BlcnR5LFxuICAudG9rZW4uc2VsZWN0b3IsXG4gIC50b2tlbi5jb25zdGFudCxcbiAgLnRva2VuLnN5bWJvbCxcbiAgLnRva2VuLmJ1aWx0aW4ge1xuICAgIGNvbG9yOiByZ2IoMywgMTc5LCAxMDEpO1xuICB9XG5cbiAgLnRva2VuLmF0dHItbmFtZSxcbiAgLnRva2VuLmF0dHItdmFsdWUsXG4gIC50b2tlbi5zdHJpbmcsXG4gIC50b2tlbi5jaGFyLFxuICAudG9rZW4ub3BlcmF0b3IsXG4gIC50b2tlbi5lbnRpdHksXG4gIC50b2tlbi51cmwsXG4gIC5sYW5ndWFnZS1jc3MgLnRva2VuLnN0cmluZyxcbiAgLnN0eWxlIC50b2tlbi5zdHJpbmcsXG4gIC50b2tlbi52YXJpYWJsZSxcbiAgLnRva2VuLmluc2VydGVkIHtcbiAgICBjb2xvcjogaHNsKDc2LCAyMSUsIDUyJSk7IC8qICM4RjlENkEgKi9cbiAgfVxuXG4gIC50b2tlbi5hdHJ1bGUge1xuICAgIGNvbG9yOiBoc2woMjE4LCAyMiUsIDU1JSk7IC8qICM3NTg3QTYgKi9cbiAgfVxuXG4gIC50b2tlbi5yZWdleCxcbiAgLnRva2VuLmltcG9ydGFudCB7XG4gICAgY29sb3I6IGhzbCg0MiwgNzUlLCA2NSUpOyAvKiAjRTlDMDYyICovXG4gIH1cblxuICAudG9rZW4uaW1wb3J0YW50LFxuICAudG9rZW4uYm9sZCB7XG4gICAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIH1cbiAgLnRva2VuLml0YWxpYyB7XG4gICAgZm9udC1zdHlsZTogaXRhbGljO1xuICB9XG5cbiAgLnRva2VuLmVudGl0eSB7XG4gICAgY3Vyc29yOiBoZWxwO1xuICB9XG5cbiAgcHJlW2RhdGEtbGluZV0ge1xuICAgIHBhZGRpbmc6IDFlbSAwIDFlbSAzZW07XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICB9XG5cbiAgLyogTWFya3VwICovXG4gIC5sYW5ndWFnZS1tYXJrdXAgLnRva2VuLnRhZyxcbiAgLmxhbmd1YWdlLW1hcmt1cCAudG9rZW4uYXR0ci1uYW1lLFxuICAubGFuZ3VhZ2UtbWFya3VwIC50b2tlbi5wdW5jdHVhdGlvbiB7XG4gICAgY29sb3I6IGhzbCgzMywgMzMlLCA1MiUpOyAvKiAjQUM4ODVCICovXG4gIH1cblxuICAvKiBNYWtlIHRoZSB0b2tlbnMgc2l0IGFib3ZlIHRoZSBsaW5lIGhpZ2hsaWdodCBzbyB0aGUgY29sb3VycyBkb24ndCBsb29rIGZhZGVkLiAqL1xuICAudG9rZW4ge1xuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICB6LWluZGV4OiAxO1xuICB9XG5cbiAgLmxpbmUtaGlnaGxpZ2h0IHtcbiAgICBiYWNrZ3JvdW5kOiBoc2xhKDAsIDAlLCAzMyUsIDAuMjUpOyAvKiAjNTQ1NDU0ICovXG4gICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KFxuICAgICAgdG8gcmlnaHQsXG4gICAgICBoc2xhKDAsIDAlLCAzMyUsIDAuMSkgNzAlLFxuICAgICAgaHNsYSgwLCAwJSwgMzMlLCAwKVxuICAgICk7IC8qICM1NDU0NTQgKi9cbiAgICBib3JkZXItYm90dG9tOiAxcHggZGFzaGVkIGhzbCgwLCAwJSwgMzMlKTsgLyogIzU0NTQ1NCAqL1xuICAgIGJvcmRlci10b3A6IDFweCBkYXNoZWQgaHNsKDAsIDAlLCAzMyUpOyAvKiAjNTQ1NDU0ICovXG4gICAgbGVmdDogMDtcbiAgICBsaW5lLWhlaWdodDogaW5oZXJpdDtcbiAgICBtYXJnaW4tdG9wOiAwLjc1ZW07IC8qIFNhbWUgYXMgLnByaXNt4oCZcyBwYWRkaW5nLXRvcCAqL1xuICAgIHBhZGRpbmc6IGluaGVyaXQgMDtcbiAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgcmlnaHQ6IDA7XG4gICAgd2hpdGUtc3BhY2U6IHByZTtcbiAgICB6LWluZGV4OiAwO1xuICB9XG5cbiAgLmxpbmUtaGlnaGxpZ2h0OmJlZm9yZSxcbiAgLmxpbmUtaGlnaGxpZ2h0W2RhdGEtZW5kXTphZnRlciB7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogaHNsKDIxNSwgMTUlLCA1OSUpOyAvKiAjODc5NEE2ICovXG4gICAgYm9yZGVyLXJhZGl1czogOTk5cHg7XG4gICAgYm94LXNoYWRvdzogMCAxcHggd2hpdGU7XG4gICAgY29sb3I6IGhzbCgyNCwgMjAlLCA5NSUpOyAvKiAjRjVGMkYwICovXG4gICAgY29udGVudDogYXR0cihkYXRhLXN0YXJ0KTtcbiAgICBmb250OiBib2xkIDY1JS8xLjUgc2Fucy1zZXJpZjtcbiAgICBsZWZ0OiAwLjZlbTtcbiAgICBtaW4td2lkdGg6IDFlbTtcbiAgICBwYWRkaW5nOiAwIDAuNWVtO1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgdGV4dC1zaGFkb3c6IG5vbmU7XG4gICAgdG9wOiAwLjRlbTtcbiAgICB2ZXJ0aWNhbC1hbGlnbjogMC4zZW07XG4gIH1cblxuICAubGluZS1oaWdobGlnaHRbZGF0YS1lbmRdOmFmdGVyIHtcbiAgICBib3R0b206IDAuNGVtO1xuICAgIGNvbnRlbnQ6IGF0dHIoZGF0YS1lbmQpO1xuICAgIHRvcDogYXV0bztcbiAgfVxuYDtcbmV4cG9ydCBkZWZhdWx0IHsgTElHSFQsIERBUksgfTtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBZVk7SUFBQUEsY0FBQSxZQUFBQSxDQUFBO01BQUEsT0FBQUMsY0FBQTtJQUFBO0VBQUE7RUFBQSxPQUFBQSxjQUFBO0FBQUE7QUFBQUQsY0FBQTtBQWZaLFNBQVNFLE1BQU0sUUFBUSxrQkFBa0I7QUFDekMsU0FBU0MsR0FBRyxRQUFRLG1CQUFtQjtBQUV2QyxPQUFPLE1BQU1DLEtBQUssSUFBQUosY0FBQSxHQUFBSyxDQUFBLE9BQUdGLEdBQUk7QUFDekI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFvQkcsS0FBSyxJQUFLO0VBQUFOLGNBQUEsR0FBQU8sQ0FBQTtFQUFBUCxjQUFBLEdBQUFLLENBQUE7RUFBQSxPQUFBQyxLQUFLLENBQUNFLEtBQUssQ0FBQ0MsS0FBSyxDQUFDQyxJQUFJO0FBQUQsQ0FBRTtBQUNyRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELE9BQU8sTUFBTUMsSUFBSSxJQUFBWCxjQUFBLEdBQUFLLENBQUEsT0FBR0YsR0FBSTtBQUN4QjtBQUNBO0FBQ0EsYUFBYUQsTUFBTSxDQUFDVSxRQUFTO0FBQzdCO0FBQ0EsbUJBQW9CTixLQUFLLElBQUs7RUFBQU4sY0FBQSxHQUFBTyxDQUFBO0VBQUFQLGNBQUEsR0FBQUssQ0FBQTtFQUFBLE9BQUFDLEtBQUssQ0FBQ0UsS0FBSyxDQUFDQyxLQUFLLENBQUNDLElBQUk7QUFBRCxDQUFFO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0QsZUFBZTtFQUFFTixLQUFLO0VBQUVPO0FBQUssQ0FBQyJ9