import CodeMirror from "codemirror";
import { getPlatformOS } from "utils/helpers";
import type { TEditorModes } from "../EditorConfig";
import { EditorModes } from "../EditorConfig";
import { isSqlMode } from "../sql/config";
import { KEYBOARD_SHORTCUTS_BY_PLATFORM } from "./keyboardShortcutConstants";

export const getCodeCommentKeyMap = () => {
  const platformOS = getPlatformOS() || "default";
  return KEYBOARD_SHORTCUTS_BY_PLATFORM[platformOS].codeComment;
};

export function getLineCommentString(editorMode: TEditorModes) {
  return isSqlMode(editorMode) ? "--" : "//";
}

// Most of the code below is copied from https://github.com/codemirror/codemirror5/blob/master/addon/comment/comment.js
// with minor modifications to support commenting in JS fields with {{ }} syntax
// CodeMirror's APIs don't allow such things, so copied functions and overrode them

/** Get end of line for line comment */
function getEndLineForLineComment(
  from: CodeMirror.Position,
  to: CodeMirror.Position,
  cm: CodeMirror.Editor,
) {
  return Math.min(
    to.ch != 0 || to.line == from.line ? to.line + 1 : to.line,
    cm.lastLine() + 1,
  );
}

/** Get end of line for line comment */
function getEndLineForLineUncomment(
  from: CodeMirror.Position,
  to: CodeMirror.Position,
  cm: CodeMirror.Editor,
) {
  return Math.min(
    to.ch != 0 || to.line == from.line ? to.line : to.line - 1,
    cm.lastLine() + 1,
  );
}

const JS_FIELD_BEGIN = "{{";
const JS_FIELD_END = "}}";

const nonWhitespace = /[^\s\u00a0]/;

const noOptions: CodeMirror.CommentOptions = {};

/**
 * Gives index of the first non whitespace character in the line
 **/
function firstNonWhitespace(str: string, mode: TEditorModes) {
  const found = str.search(
    (
      [EditorModes.JAVASCRIPT, EditorModes.TEXT_WITH_BINDING] as TEditorModes[]
    ).includes(mode) && str.includes(JS_FIELD_BEGIN)
      ? JS_FIELD_BEGIN
      : nonWhitespace,
  );
  return found === -1 ? 0 : found;
}

// Rough heuristic to try and detect lines that are part of multi-line string
function probablyInsideString(
  cm: CodeMirror.Editor,
  pos: CodeMirror.Position,
  line: string,
) {
  return (
    /\bstring\b/.test(cm.getTokenTypeAt(CodeMirror.Pos(pos.line, 0))) &&
    !/^[\'\"\`]/.test(line)
  );
}

function performLineCommenting(
  // this is a fake parameter to specify type for this
  // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html#specifying-the-type-of-this-for-functions
  this: CodeMirror.Editor,
  from: CodeMirror.Position,
  to: CodeMirror.Position,
  options = noOptions,
) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias, @typescript-eslint/no-explicit-any
  const self: CodeMirror.Editor = this as any;
  const mode = self.getMode();
  const firstLine = self.getLine(from.line);
  if (firstLine === null || probablyInsideString(self, from, firstLine)) return;

  // When mode is TEXT, the name is null string, we skip commenting
  const commentString =
    mode.name === EditorModes.TEXT_WITH_BINDING &&
    !(firstLine.includes(JS_FIELD_BEGIN) || firstLine.includes(JS_FIELD_END))
      ? ""
      : options.lineComment || mode.lineComment;

  if (!commentString) {
    if (options.blockCommentStart || mode.blockCommentStart) {
      options.fullLines = true;
      self.blockComment(from, to, options);
    }
    return;
  }

  const end = getEndLineForLineComment(from, to, self);
  const padding = options.padding || " ";
  const blankLines = options.commentBlankLines || from.line === to.line;

  self.operation(function () {
    if (options.indent) {
      for (let i = from.line; i < end; ++i) {
        const line = self.getLine(i);

        const baseString =
          line.search(nonWhitespace) === -1
            ? line
            : line.slice(
                0,
                firstNonWhitespace(
                  line,
                  // When there is JS bindings inside SQL, the mode is JAVASCRIPT instead of SQL
                  // we need to explicitly check if the SQL comment string is passed, make the mode SQL
                  commentString === getLineCommentString(EditorModes.SQL)
                    ? EditorModes.SQL
                    : (mode.name as TEditorModes),
                ),
              );

        const offset = (baseString || "").length;

        if (!blankLines && !nonWhitespace.test(line)) continue;

        // Handle JS field lines starting with {{
        if (line.slice(offset).startsWith(JS_FIELD_BEGIN)) {
          self.replaceRange(
            baseString + JS_FIELD_BEGIN + commentString + padding,
            CodeMirror.Pos(i, 0),
            CodeMirror.Pos(i, offset + JS_FIELD_BEGIN.length),
          );
          continue;
        }

        self.replaceRange(
          baseString + commentString + padding,
          CodeMirror.Pos(i, 0),
          CodeMirror.Pos(i, offset),
        );
      }
    } else {
      for (let i = from.line; i < end; ++i) {
        const line = self.getLine(i);
        if (blankLines || nonWhitespace.test(line)) {
          // Handle JS field lines starting with {{
          if (line.startsWith(JS_FIELD_BEGIN)) {
            self.replaceRange(
              commentString + padding,
              CodeMirror.Pos(i, JS_FIELD_BEGIN.length),
            );
            continue;
          }

          self.replaceRange(commentString + padding, CodeMirror.Pos(i, 0));
        }
      }
    }
  });
}

function performLineUncommenting(
  // this is a fake parameter to specify type for this
  // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html#specifying-the-type-of-this-for-functions
  this: CodeMirror.Editor,
  from: CodeMirror.Position,
  to: CodeMirror.Position,
  options = noOptions,
) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const self = this;
  const mode = self.getMode();
  const end = getEndLineForLineUncomment(from, to, self);
  const start = Math.min(from.line, end);

  // Try finding line comments
  const lineString = options.lineComment || mode.lineComment;
  const lines: string[] = [];
  const padding = options.padding || " ";
  let didCommentCode;
  lineComment: {
    if (!lineString) break lineComment;
    for (let i = start; i <= end; ++i) {
      const line = self.getLine(i);
      const found = line.indexOf(lineString);

      if (found == -1 && nonWhitespace.test(line)) break lineComment;
      if (
        found > -1 &&
        // Handle JS fields with {{}}
        !line.trim().includes(JS_FIELD_BEGIN) &&
        nonWhitespace.test(line.slice(0, found))
      )
        break lineComment;
      lines.push(line);
    }
    self.operation(function () {
      for (let i = start; i <= end; ++i) {
        const line = lines[i - start];
        const pos = line.indexOf(lineString);
        let endPos = pos + lineString.length;
        if (pos < 0) continue;
        if (line.slice(endPos, endPos + padding.length) == padding)
          endPos += padding.length;
        didCommentCode = true;
        self.replaceRange(
          "",
          CodeMirror.Pos(i, pos),
          CodeMirror.Pos(i, endPos),
        );
      }
    });
    if (didCommentCode) return true;
  }

  // Try block comments
  const startString = options.blockCommentStart || mode.blockCommentStart;
  const endString = options.blockCommentEnd || mode.blockCommentEnd;
  if (!startString || !endString) return false;
  const blockCommentLead = options.blockCommentLead || mode.blockCommentLead;
  const startLine = self.getLine(start);
  const open = startLine.indexOf(startString);
  if (open == -1) return false;
  const endLine = end === start ? startLine : self.getLine(end);
  const close = endLine.indexOf(
    endString,
    end === start ? open + startString.length : 0,
  );
  const insideStart = CodeMirror.Pos(start, open + 1),
    insideEnd = CodeMirror.Pos(end, close + 1);
  if (
    close === -1 ||
    !/comment/.test(self.getTokenTypeAt(insideStart)) ||
    !/comment/.test(self.getTokenTypeAt(insideEnd)) ||
    self.getRange(insideStart, insideEnd, "\n").indexOf(endString) > -1
  )
    return false;

  // Avoid killing block comments completely outside the selection.
  // Positions of the last startString before the start of the selection, and the first endString after it.
  let lastStart = startLine.lastIndexOf(startString, from.ch);
  let firstEnd =
    lastStart === -1
      ? -1
      : startLine
          .slice(0, from.ch)
          .indexOf(endString, lastStart + startString.length);
  if (
    lastStart !== -1 &&
    firstEnd !== -1 &&
    firstEnd + endString.length != from.ch
  )
    return false;
  // Positions of the first endString after the end of the selection, and the last startString before it.
  firstEnd = endLine.indexOf(endString, to.ch);
  const almostLastStart = endLine
    .slice(to.ch)
    .lastIndexOf(startString, firstEnd - to.ch);
  lastStart =
    firstEnd === -1 || almostLastStart === -1 ? -1 : to.ch + almostLastStart;
  if (firstEnd !== -1 && lastStart != -1 && lastStart !== to.ch) return false;

  self.operation(function () {
    self.replaceRange(
      "",
      CodeMirror.Pos(
        end,
        close -
          (padding && endLine.slice(close - padding.length, close) == padding
            ? padding.length
            : 0),
      ),
      CodeMirror.Pos(end, close + endString.length),
    );
    let openEnd = open + startString.length;
    if (
      padding &&
      startLine.slice(openEnd, openEnd + padding.length) == padding
    )
      openEnd += padding.length;
    self.replaceRange(
      "",
      CodeMirror.Pos(start, open),
      CodeMirror.Pos(start, openEnd),
    );
    if (blockCommentLead) {
      for (let i = start + 1; i <= end; ++i) {
        const line = self.getLine(i);
        const found = line.indexOf(blockCommentLead);
        if (found == -1 || nonWhitespace.test(line.slice(0, found))) continue;
        let foundEnd = found + blockCommentLead.length;
        if (
          padding &&
          line.slice(foundEnd, foundEnd + padding.length) == padding
        )
          foundEnd += padding.length;
        self.replaceRange(
          "",
          CodeMirror.Pos(i, found),
          CodeMirror.Pos(i, foundEnd),
        );
      }
    }
  });
  return true;
}

/** This function handles commenting which includes functions copied from comment add on with modifications */
export const handleCodeComment =
  (lineCommentingString: string) => (cm: CodeMirror.Editor) => {
    cm.lineComment = performLineCommenting;

    cm.uncomment = performLineUncommenting;

    // This is the actual command that does the comment toggling
    cm.toggleComment({
      commentBlankLines: true,
      // Always provide the line comment, otherwise it'll not work for JS fields when
      // the mode is set to text/plain (when whole text wrapped in {{}} is selected)
      lineComment: lineCommentingString,
      indent: true,
    });
  };
