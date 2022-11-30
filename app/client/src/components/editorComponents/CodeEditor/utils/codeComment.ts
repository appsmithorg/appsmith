import CodeMirror from "codemirror";
import { isMacOrIOS } from "utils/helpers";

export const getCodeCommentKeyMap = () => {
  return isMacOrIOS() ? "Cmd-/" : "Ctrl-/";
};

// Most of the code below is copied from https://github.com/codemirror/codemirror5/blob/master/addon/comment/comment.js
// with minor modifications to support commenting in JS fields with {{ }} syntax
// CodeMirror's APIs don't allow such things, so copied functions and overrode them

const JS_FIELD_BEGIN = "{{";

const nonWS = /[^\s\u00a0]/;

/**
 * Gives index of the first non whitespace character in the line
 **/
function firstNonWS(str: string) {
  const found = str.search(nonWS);
  return found == -1 ? 0 : found;
}

// Rough heuristic to try and detect lines that are part of multi-line string
function probablyInsideString(
  cm: CodeMirror.Editor,
  pos: CodeMirror.Position,
  line: any,
) {
  return (
    /\bstring\b/.test(cm.getTokenTypeAt(CodeMirror.Pos(pos.line, 0))) &&
    !/^[\'\"\`]/.test(line)
  );
}

function getMode(cm: CodeMirror.Editor, pos: CodeMirror.Position) {
  const mode = cm.getMode();
  return mode.useInnerComments === false || !mode.innerMode
    ? mode
    : cm.getModeAt(pos);
}

/** This function handles commenting which includes functions copied from comment add on with modifications */
export const handleCodeComment = (cm: CodeMirror.Editor) => {
  const noOptions: CodeMirror.CommentOptions = {};

  cm.lineComment = function(from, to, options = noOptions) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this,
      mode = getMode(self, from);
    const firstLine = self.getLine(from.line);
    if (firstLine == null || probablyInsideString(self, from, firstLine))
      return;

    const commentString = options.lineComment || mode.lineComment;
    if (!commentString) {
      if (options.blockCommentStart || mode.blockCommentStart) {
        options.fullLines = true;
        self.blockComment(from, to, options);
      }
      return;
    }

    const end = Math.min(
      to.ch != 0 || to.line == from.line ? to.line + 1 : to.line,
      self.lastLine() + 1,
    );
    const pad = options.padding == null ? " " : options.padding;
    const blankLines = options.commentBlankLines || from.line == to.line;

    self.operation(function() {
      if (options.indent) {
        /* Commented below line to handle baseString individually for each line */
        // let baseString = null;
        // for (let i = from.line; i < end; ++i) {
        //   const line = self.getLine(i);

        //   const whitespace =
        //     line.search(nonWS) === -1 ? line : line.slice(0, firstNonWS(line));
        //   if (baseString == null || baseString.length > whitespace.length) {
        //     baseString = whitespace;
        //   }
        // }
        /* Changes end */

        for (let i = from.line; i < end; ++i) {
          const line = self.getLine(i);

          /* Added below code to handle baseString individually for each line */
          const baseString =
            line.search(nonWS) === -1 ? line : line.slice(0, firstNonWS(line));
          /* Changes end */

          const cut = (baseString || "").length;

          if (!blankLines && !nonWS.test(line)) continue;
          /* Commented below line to handle baseString individually for each line */
          // if (line.slice(0, cut) != baseString) cut = firstNonWS(line);
          /* Changes end */

          /* Handle JS field lines starting with {{ */
          if (line.slice(cut).startsWith(JS_FIELD_BEGIN)) {
            self.replaceRange(
              baseString + JS_FIELD_BEGIN + commentString + pad,
              CodeMirror.Pos(i, 0),
              CodeMirror.Pos(i, cut + JS_FIELD_BEGIN.length),
            );
            continue;
          }
          /* End changes for JS field handling */

          self.replaceRange(
            baseString + commentString + pad,
            CodeMirror.Pos(i, 0),
            CodeMirror.Pos(i, cut),
          );
        }
      } else {
        for (let i = from.line; i < end; ++i) {
          const line = self.getLine(i);
          if (blankLines || nonWS.test(line)) {
            /* Handle JS field lines starting with {{ */
            if (line.startsWith(JS_FIELD_BEGIN)) {
              self.replaceRange(
                commentString + pad,
                CodeMirror.Pos(i, JS_FIELD_BEGIN.length),
              );
              continue;
            }
            /* End changes for JS field handling */

            self.replaceRange(commentString + pad, CodeMirror.Pos(i, 0));
          }
        }
      }
    });
  };

  cm.uncomment = function(from, to, options) {
    if (!options) options = noOptions;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const mode = getMode(self, from);
    const end = Math.min(
      to.ch != 0 || to.line == from.line ? to.line : to.line - 1,
      self.lastLine(),
    );
    const start = Math.min(from.line, end);

    // Try finding line comments
    const lineString = options.lineComment || mode.lineComment;
    const lines: string[] = [];
    const pad = options.padding == null ? " " : options.padding;
    let didSomething;
    lineComment: {
      if (!lineString) break lineComment;
      for (let i = start; i <= end; ++i) {
        const line = self.getLine(i);
        const found = line.indexOf(lineString);
        /* Lines commented to handle JS fields with text without {{}} */
        // if (
        //   found > -1 &&
        //   !/comment/.test(self.getTokenTypeAt(CodeMirror.Pos(i, found + 1)))
        // )
        //   found = -1;
        /* Change ends */

        if (found == -1 && nonWS.test(line)) break lineComment;
        if (
          found > -1 &&
          /* Handle JS fields with {{}} */
          !line.trim().startsWith(JS_FIELD_BEGIN) &&
          /* End changes for JS fields handling */
          nonWS.test(line.slice(0, found))
        )
          break lineComment;
        lines.push(line);
      }
      self.operation(function() {
        for (let i = start; i <= end; ++i) {
          const line = lines[i - start];
          const pos = line.indexOf(lineString);
          let endPos = pos + lineString.length;
          if (pos < 0) continue;
          if (line.slice(endPos, endPos + pad.length) == pad)
            endPos += pad.length;
          didSomething = true;
          self.replaceRange(
            "",
            CodeMirror.Pos(i, pos),
            CodeMirror.Pos(i, endPos),
          );
        }
      });
      if (didSomething) return true;
    }

    // Try block comments
    const startString = options.blockCommentStart || mode.blockCommentStart;
    const endString = options.blockCommentEnd || mode.blockCommentEnd;
    if (!startString || !endString) return false;
    const lead = options.blockCommentLead || mode.blockCommentLead;
    const startLine = self.getLine(start);
    const open = startLine.indexOf(startString);
    if (open == -1) return false;
    const endLine = end == start ? startLine : self.getLine(end);
    const close = endLine.indexOf(
      endString,
      end == start ? open + startString.length : 0,
    );
    const insideStart = CodeMirror.Pos(start, open + 1),
      insideEnd = CodeMirror.Pos(end, close + 1);
    if (
      close == -1 ||
      !/comment/.test(self.getTokenTypeAt(insideStart)) ||
      !/comment/.test(self.getTokenTypeAt(insideEnd)) ||
      self.getRange(insideStart, insideEnd, "\n").indexOf(endString) > -1
    )
      return false;

    // Avoid killing block comments completely outside the selection.
    // Positions of the last startString before the start of the selection, and the first endString after it.
    let lastStart = startLine.lastIndexOf(startString, from.ch);
    let firstEnd =
      lastStart == -1
        ? -1
        : startLine
            .slice(0, from.ch)
            .indexOf(endString, lastStart + startString.length);
    if (
      lastStart != -1 &&
      firstEnd != -1 &&
      firstEnd + endString.length != from.ch
    )
      return false;
    // Positions of the first endString after the end of the selection, and the last startString before it.
    firstEnd = endLine.indexOf(endString, to.ch);
    const almostLastStart = endLine
      .slice(to.ch)
      .lastIndexOf(startString, firstEnd - to.ch);
    lastStart =
      firstEnd == -1 || almostLastStart == -1 ? -1 : to.ch + almostLastStart;
    if (firstEnd != -1 && lastStart != -1 && lastStart != to.ch) return false;

    self.operation(function() {
      self.replaceRange(
        "",
        CodeMirror.Pos(
          end,
          close -
            (pad && endLine.slice(close - pad.length, close) == pad
              ? pad.length
              : 0),
        ),
        CodeMirror.Pos(end, close + endString.length),
      );
      let openEnd = open + startString.length;
      if (pad && startLine.slice(openEnd, openEnd + pad.length) == pad)
        openEnd += pad.length;
      self.replaceRange(
        "",
        CodeMirror.Pos(start, open),
        CodeMirror.Pos(start, openEnd),
      );
      if (lead)
        for (let i = start + 1; i <= end; ++i) {
          const line = self.getLine(i);
          const found = line.indexOf(lead);
          if (found == -1 || nonWS.test(line.slice(0, found))) continue;
          let foundEnd = found + lead.length;
          if (pad && line.slice(foundEnd, foundEnd + pad.length) == pad)
            foundEnd += pad.length;
          self.replaceRange(
            "",
            CodeMirror.Pos(i, found),
            CodeMirror.Pos(i, foundEnd),
          );
        }
    });
    return true;
  };

  // This is the actual command that does the comment toggling
  cm.toggleComment({
    commentBlankLines: true,
    // Always provide the line comment, otherwise it'll not work for JS fields when
    // the mode is set to text/plain (when whole text wrapped in {{}} is selected)
    lineComment: "//",
    indent: true,
  });
};
