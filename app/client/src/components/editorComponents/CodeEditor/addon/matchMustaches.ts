import CodeMirror from "codemirror";

function markMustache(cm: any) {
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

function matchAppsmithBindingBrackets(cm: any, changeObj: any) {
  debugger;
  const ranges = cm.listSelections();
  if (mustacheScanned) {
    // when user typing
    // only if user typed { or } then
  } else {
    // initial Scan
  }
  // let match = findMatchingBracket(cm, ranges[i].head, {});
  //
  // Approach
  // 1. find open {{
  // 2. find matching closed curly braces and check if it is mustache,
  // 3. if yes then mark starting and ending as bold.
  // 4. repeat
}

function cmUpdateCallback(params: unknown) {
  debugger;
}

function matchMustaches(a: unknown, b: unknown) {
  return;
}

CodeMirror.defineOption("matchMustaches", false, function(
  cm: any,
  val: any,
  old: any,
) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore: No types available
  if (old && old != CodeMirror.Init) {
    //
    cm.off("change", matchAppsmithBindingBrackets);
  }
  if (val) {
    //
    cm.on("change", matchAppsmithBindingBrackets);
  }
});

// CodeMirror.defineExtension("matchMustaches", function() {
//   matchMustaches(this, true);
// });

CodeMirror.defineInitHook(cmUpdateCallback);
