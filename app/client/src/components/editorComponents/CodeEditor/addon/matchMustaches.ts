import CodeMirror from "codemirror";
import { throttle, findIndex } from "lodash";

const getAllLines = (cm: CodeMirror.Editor) => {
  const lines: Array<CodeMirror.LineHandle> = [];
  cm.eachLine((line) => lines.push(line));
  return lines;
};

interface CMEditor extends CodeMirror.Editor {
  findMatchingBracket: (
    pos: CodeMirror.Position,
    config?: any,
    oldConfig?: any,
  ) => {
    from: CodeMirror.Position;
    to: CodeMirror.Position;
    match: boolean;
    forward?: boolean;
  };
}

function markMustaches(
  cm: CodeMirror.Editor,
  openMustacheStartPos: CodeMirror.Position,
  closeMustacheStartPos: CodeMirror.Position,
) {
  debugger;

  const openMustacheEndPos = CodeMirror.Pos(
    openMustacheStartPos.line,
    openMustacheStartPos.ch + 1,
  );
  // mark opening mustaches
  cm.markText(openMustacheStartPos, openMustacheEndPos, {
    className: "binding-brackets",
  });

  const closeMustacheEndPos = CodeMirror.Pos(
    closeMustacheStartPos.line,
    closeMustacheStartPos.ch + 1,
  );
  // mark closing mustaches
  cm.markText(closeMustacheStartPos, closeMustacheEndPos, {
    className: "binding-brackets",
  });
}

const mustacheScanned = false;

function matchAppsmithBindingBrackets(cm: CodeMirror.Editor, changeObj: any) {
  debugger;

  if (mustacheScanned) {
    // when user typing
    // only if user typed { or } then
  }
  // let match = findMatchingBracket(cm, ranges[i].head, {});
  //
}

const throttledChangeHandler = throttle(matchAppsmithBindingBrackets, 500);

function onMountHandler(cm: CMEditor) {
  // Approach
  // 1. find open {{
  // 2. find matching closed curly braces and check if it is mustache,
  // 3. if yes then mark starting and ending as bold.
  // 4. repeat

  let lineIndex = 0;
  const lines = getAllLines(cm);
  for (lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const currentLine = lines[lineIndex];
    debugger;
    // find open mustache in currentLine's text
    const openMustacheTextStartIndex = currentLine.text.indexOf("{{");
    if (openMustacheTextStartIndex > -1) {
      // search of closing mustache when openMustache is found
      const openMustacheEndIndex = openMustacheTextStartIndex + 1;
      const openMustacheLineIndex = lineIndex;
      const match = cm.findMatchingBracket(
        CodeMirror.Pos(openMustacheLineIndex, openMustacheEndIndex),
      );

      if (match.match) {
        // found closingMustache

        // let's mark / highlight mustaches
        const closeMustacheLineIndex = match.to.line;
        const closeMustacheTextStartIndex = match.to.ch - 1;
        markMustaches(
          cm,
          CodeMirror.Pos(openMustacheLineIndex, openMustacheEndIndex),
          CodeMirror.Pos(closeMustacheLineIndex, closeMustacheTextStartIndex),
        );
        // jump to line of closing mustache
        lineIndex = closeMustacheLineIndex - 1;
      }
    }
  }
}

CodeMirror.defineOption("matchMustaches", false, function(
  cm: CodeMirror.Editor,
  val: any,
  old: any,
) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: No types available
  if (old && old != CodeMirror.Init) {
    // un-subscribing to all text changes in the currentEditor
    cm.off("change", matchAppsmithBindingBrackets);
  }
  if (val) {
    // subscribing to all text changes in the currentEditor
    cm.on("change", matchAppsmithBindingBrackets);
  }
});

// This is called when currentEditor is initialized
CodeMirror.defineInitHook(onMountHandler);
