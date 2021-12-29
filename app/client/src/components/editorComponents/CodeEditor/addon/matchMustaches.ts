import CodeMirror from "codemirror";
import { throttle } from "lodash";

interface CMEditor extends CodeMirror.Editor {
  findMatchingBracket: (
    pos: CodeMirror.Position,
    config: any,
    oldConfig: any,
  ) => {
    from: CodeMirror.Position;
    to: CodeMirror.Position;
    match: boolean;
    forward: boolean;
  };
}

function matchMustaches(cm: CMEditor, tr: boolean) {
  debugger;
  // cm.markText(match.from, Pos(match.from.line, match.from.ch + 1), {
  //   className: "binding-brackets",
  // });
  // editor.markText(
  //   { ch: ending.start, line: lineNo },
  //   { ch: ending.end, line: lineNo },
  //   {
  //     className: "binding-brackets",
  //   },
  // );
  // editor.markText(
  //   { ch: opening.start, line: lineNo },
  //   { ch: opening.end, line: lineNo },
  //   {
  //     className: "binding-brackets",
  //   },
  // );
}

const mustacheScanned = false;

function matchAppsmithBindingBrackets(cm: CMEditor, changeObj: any) {
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
  const lines = [];
  cm.eachLine((line, index) => {
    debugger;
    cm.findMatchingBracket(CodeMirror.Pos(index), config);
  });

  debugger;
}

CodeMirror.defineOption("matchMustaches", false, function(
  cm: CodeMirror.Editor,
  val: any,
  old: any,
) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: No types available
  if (old && old != CodeMirror.Init) {
    cm.off("change", throttledChangeHandler);
  }
  if (val) {
    cm.on("change", throttledChangeHandler);
  }
});

CodeMirror.defineInitHook(onMountHandler);
