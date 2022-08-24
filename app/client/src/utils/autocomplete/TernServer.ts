/* eslint-disable @typescript-eslint/ban-ts-comment */
// Heavily inspired from https://github.com/codemirror/CodeMirror/blob/master/addon/tern/tern.js
import tern, { Server, Def } from "tern";
import ecma from "constants/defs/ecmascript.json";
import lodash from "constants/defs/lodash.json";
import base64 from "constants/defs/base64-js.json";
import moment from "constants/defs/moment.json";
import xmlJs from "constants/defs/xmlParser.json";
import forge from "constants/defs/forge.json";
import browser from "constants/defs/browser.json";
import CodeMirror, { Hint, Pos, cmpPos } from "codemirror";
import {
  getDynamicStringSegments,
  isDynamicValue,
} from "utils/DynamicBindingUtils";
import {
  GLOBAL_DEFS,
  GLOBAL_FUNCTIONS,
} from "utils/autocomplete/EntityDefinitions";
import { FieldEntityInformation } from "components/editorComponents/CodeEditor/EditorConfig";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { AutocompleteSorter } from "./AutocompleteSortRules";
import { getCompletionsForKeyword } from "./keywordCompletion";

const DEFS: Def[] = [
  // @ts-expect-error: Types are not available
  ecma,
  browser,
  GLOBAL_FUNCTIONS,
  GLOBAL_DEFS,
  lodash,
  base64,
  moment,
  xmlJs,
  forge,
];

const bigDoc = 250;
const cls = "CodeMirror-Tern-";
const hintDelay = 1700;

export type Completion = Hint & {
  origin: string;
  type: AutocompleteDataType | string;
  data: {
    doc: string;
  };
  render?: any;
  isHeader?: boolean;
};

export type CommandsCompletion = Completion & {
  action?: () => void;
  shortcut: string;
  triggerCompletionsPostPick?: boolean;
};

type TernDocs = Record<string, TernDoc>;

type TernDoc = {
  doc: CodeMirror.Doc;
  name: string;
  changed: { to: number; from: number } | null;
};

export enum AutocompleteDataType {
  OBJECT = "OBJECT",
  NUMBER = "NUMBER",
  ARRAY = "ARRAY",
  FUNCTION = "FUNCTION",
  BOOLEAN = "BOOLEAN",
  STRING = "STRING",
  UNKNOWN = "UNKNOWN",
}

type ArgHints = {
  start: CodeMirror.Position;
  type: { args: any[]; rettype: null | string };
  name: string;
  guess: boolean;
  doc: CodeMirror.Doc;
};

type RequestQuery = {
  type: string;
  types?: boolean;
  docs?: boolean;
  urls?: boolean;
  origins?: boolean;
  caseInsensitive?: boolean;
  preferFunction?: boolean;
  end?: CodeMirror.Position;
  guess?: boolean;
  inLiteral?: boolean;
  fullDocs?: any;
  lineCharPositions?: any;
  start?: any;
  file?: any;
  includeKeywords?: boolean;
  depth?: number;
  sort?: boolean;
};

export type DataTreeDefEntityInformation = {
  type: ENTITY_TYPE;
  subType: string;
};

export function getDataType(type: string): AutocompleteDataType {
  if (type === "?") return AutocompleteDataType.UNKNOWN;
  else if (type === "number") return AutocompleteDataType.NUMBER;
  else if (type === "string") return AutocompleteDataType.STRING;
  else if (type === "bool") return AutocompleteDataType.BOOLEAN;
  else if (type === "array") return AutocompleteDataType.ARRAY;
  else if (/^fn\(/.test(type)) return AutocompleteDataType.FUNCTION;
  else if (/^\[/.test(type)) return AutocompleteDataType.ARRAY;
  else return AutocompleteDataType.OBJECT;
}

export function typeToIcon(type: string, isKeyword: boolean) {
  let suffix;
  if (isKeyword) suffix = "keyword";
  else if (type === "?") suffix = "unknown";
  else if (type === "number" || type === "string" || type === "bool")
    suffix = type;
  else if (/^fn\(/.test(type)) suffix = "fn";
  else if (/^\[/.test(type)) suffix = "array";
  else suffix = "object";
  return cls + "completion " + cls + "completion-" + suffix;
}

class TernServer {
  server: Server;
  docs: TernDocs = Object.create(null);
  cachedArgHints: ArgHints | null = null;
  active: any;
  fieldEntityInformation: FieldEntityInformation = {};
  defEntityInformation: Map<string, DataTreeDefEntityInformation> = new Map<
    string,
    DataTreeDefEntityInformation
  >();

  constructor() {
    this.server = new tern.Server({
      async: true,
      defs: DEFS,
    });
  }

  resetServer() {
    this.server = new tern.Server({
      async: true,
      defs: DEFS,
    });
    this.docs = Object.create(null);
  }

  complete(cm: CodeMirror.Editor) {
    cm.showHint({
      hint: this.getHint.bind(this),
      completeSingle: false,
      extraKeys: {
        Up: (cm: CodeMirror.Editor, handle: any) => {
          handle.moveFocus(-1);
          if (this.active.isHeader === true) {
            handle.moveFocus(-1);
          }
        },
        Down: (cm: CodeMirror.Editor, handle: any) => {
          handle.moveFocus(1);
          if (this.active.isHeader === true) {
            handle.moveFocus(1);
          }
        },
      },
    });
  }

  showType(cm: CodeMirror.Editor) {
    this.showContextInfo(cm, "type");
  }

  showDocs(cm: CodeMirror.Editor) {
    this.showContextInfo(cm, "documentation", (data: any) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    });
  }

  updateDef(
    name: string,
    def: Def,
    entityInfo?: Map<string, DataTreeDefEntityInformation>,
  ) {
    this.server.deleteDefs(name);
    // @ts-expect-error: Types are not available
    this.server.addDefs(def);
    if (entityInfo) this.defEntityInformation = entityInfo;
  }

  removeDef(name: string) {
    this.server.deleteDefs(name);
  }

  requestCallback(error: any, data: any, cm: CodeMirror.Editor, resolve: any) {
    if (error) return this.showError(cm, error);
    if (data.completions.length === 0) {
      return this.showError(cm, "No suggestions");
    }
    const doc = this.findDoc(cm.getDoc());
    const cursor = cm.getCursor();
    const { extraChars, value: focusedValue } = this.getFocusedDocValueAndPos(
      doc,
    );

    let completions: Completion[] = [];
    let after = "";
    const { end, start } = data;

    const from = {
      ...start,
      ch: start.ch + extraChars,
      line: cursor.line,
    };
    const to = {
      ...end,
      ch: end.ch + extraChars,
      line: cursor.line,
    };
    if (
      cm.getRange(Pos(from.line, from.ch - 2), from) === '["' &&
      cm.getRange(to, Pos(to.line, to.ch + 2)) !== '"]'
    ) {
      after = '"]';
    }
    // Actual char space
    const trimmedFocusedValueLength = focusedValue.trim().length;
    // end.ch counts tab space as 1 instead of 2 space chars in string
    // For eg: lets take string `  ab`. Here, end.ch = 3 & trimmedFocusedValueLength = 2
    // hence tabSpacesCount = end.ch - trimmedFocusedValueLength
    const tabSpacesCount = end.ch - trimmedFocusedValueLength;
    const cursorHorizontalPos =
      tabSpacesCount * 2 + trimmedFocusedValueLength - 2;

    for (let i = 0; i < data.completions.length; ++i) {
      const completion = data.completions[i];
      let className = typeToIcon(completion.type, completion.isKeyword);
      const dataType = getDataType(completion.type);
      if (data.guess) className += " " + cls + "guess";
      let completionText = completion.name + after;
      if (dataType === "FUNCTION") {
        completionText = completionText + "()";
      }
      const codeMirrorCompletion: Completion = {
        text: completionText,
        displayText: completionText,
        className: className,
        data: completion,
        origin: completion.origin,
        type: dataType,
        isHeader: false,
      };
      if (completion.isKeyword) {
        codeMirrorCompletion.render = (
          element: HTMLElement,
          self: any,
          data: any,
        ) => {
          element.setAttribute("keyword", data.displayText);
          element.innerHTML = data.displayText;
        };
        // Add relevant keyword completions
        const keywordCompletions = getCompletionsForKeyword(
          codeMirrorCompletion,
          cursorHorizontalPos,
        );
        completions = [...completions, ...keywordCompletions];
      }
      completions.push(codeMirrorCompletion);
    }

    const shouldComputeBestMatch =
      this.fieldEntityInformation.entityType !== ENTITY_TYPE.JSACTION;

    completions = AutocompleteSorter.sort(
      completions,
      this.fieldEntityInformation,
      this.defEntityInformation.get(
        this.fieldEntityInformation.entityName || "",
      ),
      shouldComputeBestMatch,
    );
    const indexToBeSelected =
      completions.length && completions[0].isHeader ? 1 : 0;
    const obj = {
      from: from,
      to: to,
      list: completions,
      selectedHint: indexToBeSelected,
    };
    let tooltip: HTMLElement | undefined = undefined;
    CodeMirror.on(obj, "close", () => this.remove(tooltip));
    CodeMirror.on(obj, "update", () => this.remove(tooltip));
    CodeMirror.on(
      obj,
      "select",
      (cur: { data: { doc: string } }, node: any) => {
        this.active = cur;
        this.remove(tooltip);
        const content = cur.data.doc;
        if (content) {
          tooltip = this.makeTooltip(
            node.parentNode.getBoundingClientRect().right + window.pageXOffset,
            node.getBoundingClientRect().top + window.pageYOffset,
            content,
          );
          tooltip.className += " " + cls + "hint-doc";
          CodeMirror.on(
            cm,
            "keyup",
            (cm: CodeMirror.Editor, keyboardEvent: KeyboardEvent) => {
              if (
                keyboardEvent.code === "Space" &&
                keyboardEvent.ctrlKey &&
                tooltip
              ) {
                tooltip.className += " visible";
              }
            },
          );
        }
      },
    );
    resolve(obj);

    return obj;
  }

  getHint(cm: CodeMirror.Editor) {
    return new Promise((resolve) => {
      this.request(
        cm,
        {
          type: "completions",
          types: true,
          docs: true,
          urls: true,
          origins: true,
          caseInsensitive: true,
          guess: false,
          inLiteral: false,
        },
        (error, data) => this.requestCallback(error, data, cm, resolve),
      );
    });
  }

  showContextInfo(cm: CodeMirror.Editor, queryName: string, callbackFn?: any) {
    this.request(cm, { type: queryName }, (error, data) => {
      if (error) return this.showError(cm, error);
      const tip = this.elt(
        "span",
        null,
        this.elt("strong", null, data.type || "not found"),
      );
      if (data.doc) tip.appendChild(document.createTextNode(" — " + data.doc));
      if (data.url) {
        tip.appendChild(document.createTextNode(" "));
        const child = tip.appendChild(this.elt("a", null, "[docs]"));
        // @ts-expect-error: Types are not available
        child.href = data.url;

        // @ts-expect-error: Types are not available
        child.target = "_blank";
      }
      this.tempTooltip(cm, tip);
      if (callbackFn) callbackFn(data);
    });
  }

  request(
    cm: CodeMirror.Editor,
    query: RequestQuery | string,
    callbackFn: (error: any, data: any) => void,
    pos?: CodeMirror.Position,
  ) {
    const doc = this.findDoc(cm.getDoc());
    const request = this.buildRequest(doc, query, pos);

    // @ts-expect-error: Types are not available
    this.server.request(request, callbackFn);
  }

  findDoc(doc: CodeMirror.Doc, name?: string): TernDoc {
    for (const n in this.docs) {
      const cur = this.docs[n];
      if (cur.doc === doc) return cur;
    }
    if (!name) {
      let n;
      for (let i = 0; ; ++i) {
        n = "[doc" + (i || "") + "]";
        if (!this.docs[n]) {
          name = n;
          break;
        }
      }
    }
    return this.addDoc(name, doc);
  }

  addDoc(name: string, doc: CodeMirror.Doc) {
    const data = { doc: doc, name: name, changed: null };
    this.server.addFile(name, this.getFocusedDocValueAndPos(data).value);
    CodeMirror.on(doc, "change", this.trackChange.bind(this));
    return (this.docs[name] = data);
  }

  buildRequest(
    doc: TernDoc,
    query: Partial<RequestQuery> | string,
    pos?: CodeMirror.Position,
  ) {
    const files = [];
    let offsetLines = 0;
    if (typeof query == "string") query = { type: query };
    const allowFragments = !query.fullDocs;
    if (!allowFragments) delete query.fullDocs;
    query.lineCharPositions = true;
    query.includeKeywords = true;
    query.depth = 0;
    query.sort = true;
    if (query.end == null) {
      const positions = pos || doc.doc.getCursor("end");
      const { end } = this.getFocusedDocValueAndPos(doc);
      query.end = {
        ...positions,
        ...end,
      };

      if (doc.doc.somethingSelected()) query.start = doc.doc.getCursor("start");
    }
    const startPos = query.start || query.end;

    if (doc.changed) {
      if (
        doc.doc.lineCount() > bigDoc &&
        allowFragments !== false &&
        doc.changed.to - doc.changed.from < 100 &&
        doc.changed.from <= startPos.line &&
        doc.changed.to > query.end.line
      ) {
        files.push(this.getFragmentAround(doc, startPos, query.end));
        query.file = "#0";
        offsetLines = files[0].offsetLines;
        if (query.start != null)
          query.start = Pos(query.start.line - -offsetLines, query.start.ch);
        query.end = Pos(query.end.line - offsetLines, query.end.ch);
      } else {
        files.push({
          type: "full",
          name: doc.name,
          text: this.getFocusedDocValueAndPos(doc).value,
        });
        query.file = doc.name;
        doc.changed = null;
      }
    } else {
      query.file = doc.name;
      // this code is different from tern.js code
      // we noticed error `TernError: file doesn't contain line x`
      // which was due to file not being present for the case when a codeEditor is opened and 1st character is typed
      files.push({
        type: "full",
        name: doc.name,
        text: this.getFocusedDocValueAndPos(doc).value,
      });
    }
    for (const name in this.docs) {
      const cur = this.docs[name];
      if (cur.changed && (cur != doc || cur.name != doc.name)) {
        files.push({
          type: "full",
          name: cur.name,
          text: this.getFocusedDocValueAndPos(doc).value,
        });
        cur.changed = null;
      }
    }

    return { query: query, files: files };
  }

  trackChange(
    doc: CodeMirror.Doc,
    change: {
      to: CodeMirror.Position;
      from: CodeMirror.Position;
      text: string | any[];
    },
  ) {
    const data = this.findDoc(doc);

    const argHints = this.cachedArgHints;
    if (
      argHints &&
      argHints.doc === doc &&
      cmpPos(argHints.start, change.to) >= 0
    )
      this.cachedArgHints = null;

    let changed = data.changed;
    if (changed === null)
      data.changed = changed = { from: change.from.line, to: change.from.line };
    const end = change.from.line + (change.text.length - 1);
    if (change.from.line < changed.to)
      changed.to = changed.to - (change.to.line - end);
    if (end >= changed.to) changed.to = end + 1;
    if (changed.from > change.from.line) changed.from = change.from.line;

    if (doc.lineCount() > bigDoc && changed.to - changed.from > 100)
      setTimeout(() => {
        if (data.changed && data.changed.to - data.changed.from > 100)
          this.sendDoc(data);
      }, 200);
  }

  sendDoc(doc: TernDoc) {
    this.server.request(
      {
        files: [
          // @ts-expect-error: Types are not available
          {
            type: "full",
            name: doc.name,
            text: this.docValue(doc),
          },
        ],
      },
      function(error: Error) {
        if (error) window.console.error(error);
        else doc.changed = null;
      },
    );
  }

  lineValue(doc: TernDoc) {
    const cursor = doc.doc.getCursor();

    return doc.doc.getLine(cursor.line);
  }

  docValue(doc: TernDoc) {
    return doc.doc.getValue();
  }

  getFocusedDocValueAndPos(
    doc: TernDoc,
  ): { value: string; end: { line: number; ch: number }; extraChars: number } {
    const cursor = doc.doc.getCursor("end");
    const value = this.docValue(doc);
    const lineValue = this.lineValue(doc);
    let extraChars = 0;

    const stringSegments = getDynamicStringSegments(value);
    if (stringSegments.length === 1) {
      return {
        value,
        end: {
          line: cursor.line,
          ch: cursor.ch,
        },
        extraChars,
      };
    }

    let dynamicString = value;

    let newCursorLine = cursor.line;
    let newCursorPosition = cursor.ch;

    let currentLine = 0;

    for (let index = 0; index < stringSegments.length; index++) {
      // segment is divided according to binding {{}}

      const segment = stringSegments[index];
      let currentSegment = segment;
      if (segment.startsWith("{{")) {
        currentSegment = segment.replace("{{", "");
        if (currentSegment.endsWith("}}")) {
          currentSegment = currentSegment.slice(0, currentSegment.length - 2);
        }
      }

      // subSegment is segment further divided by EOD char (\n)
      const subSegments = currentSegment.split("\n");
      const countEODCharInSegment = subSegments.length - 1;
      const segmentEndLine = countEODCharInSegment + currentLine;

      /**
       * 3 case for cursor to point inside segment
       * 1. cursor is before the {{  :-
       * 2. cursor is inside segment :-
       *    - if cursor is after {{ on same line
       *    - if cursor is after {{ in different line
       *    - if cursor is before }} on same line
       * 3. cursor is after the }}   :-
       *
       */

      const isCursorInBetweenSegmentStartAndEndLine =
        cursor.line > currentLine && cursor.line < segmentEndLine;

      const isCursorAtSegmentStartLine = cursor.line === currentLine;
      const isCursorAfterBindingOpenAtSegmentStart =
        isCursorAtSegmentStartLine && cursor.ch > lineValue.indexOf("{{") + 1;
      const isCursorAtSegmentEndLine = cursor.line === segmentEndLine;
      const isCursorBeforeBindingCloseAtSegmentEnd =
        isCursorAtSegmentEndLine && cursor.ch < lineValue.indexOf("}}") + 1;

      const isSegmentStartLineAndEndLineSame = currentLine === segmentEndLine;
      const isCursorBetweenSingleLineSegmentBinding =
        isSegmentStartLineAndEndLineSame &&
        isCursorBeforeBindingCloseAtSegmentEnd &&
        isCursorAfterBindingOpenAtSegmentStart;

      const isCursorPointingInsideSegment =
        isCursorInBetweenSegmentStartAndEndLine ||
        (isSegmentStartLineAndEndLineSame &&
          isCursorBetweenSingleLineSegmentBinding);
      (!isSegmentStartLineAndEndLineSame &&
        isCursorBeforeBindingCloseAtSegmentEnd) ||
        isCursorAfterBindingOpenAtSegmentStart;

      if (isDynamicValue(segment) && isCursorPointingInsideSegment) {
        dynamicString = currentSegment;
        newCursorLine = cursor.line - currentLine;
        if (lineValue.includes("{{")) {
          extraChars = lineValue.indexOf("{{") + 2;
        }
        newCursorPosition = cursor.ch - extraChars;

        break;
      }
      currentLine = segmentEndLine;
    }

    return {
      value: dynamicString,
      end: {
        line: newCursorLine,
        ch: newCursorPosition,
      },
      extraChars,
    };
  }

  getFragmentAround(
    data: TernDoc,
    start: CodeMirror.Position,
    end: CodeMirror.Position,
  ) {
    const doc = data.doc;
    let minIndent = null;
    let minLine = null;
    let endLine;
    const tabSize = 4;
    for (let p = start.line - 1, min = Math.max(0, p - 50); p >= min; --p) {
      const line = doc.getLine(p),
        fn = line.search(/\bfunction\b/);
      if (fn < 0) continue;
      const indent = CodeMirror.countColumn(line, null, tabSize);
      if (minIndent != null && minIndent <= indent) continue;
      minIndent = indent;
      minLine = p;
    }
    if (minLine === null) minLine = Math.max(0, start.line - 1);
    const max = Math.min(doc.lastLine(), end.line + 20);
    if (
      minIndent === null ||
      minIndent ===
        CodeMirror.countColumn(doc.getLine(start.line), null, tabSize)
    )
      endLine = max;
    else
      for (endLine = end.line + 1; endLine < max; ++endLine) {
        const indent = CodeMirror.countColumn(
          doc.getLine(endLine),
          null,
          tabSize,
        );
        if (indent <= minIndent) break;
      }
    const from = Pos(minLine, 0);

    return {
      type: "part",
      name: data.name,
      offsetLines: from.line,
      text: doc.getRange(
        from,
        Pos(endLine, end.line === endLine ? undefined : 0),
      ),
    };
  }

  showError(cm: CodeMirror.Editor, msg: string) {
    this.tempTooltip(cm, String(msg));
  }

  tempTooltip(cm: CodeMirror.Editor, content: HTMLElement | string) {
    if (cm.state.ternTooltip) this.remove(cm.state.ternTooltip);
    if (cm.state.completionActive) {
      // @ts-expect-error: Types are not available
      cm.closeHint();
    }
    const where = cm.cursorCoords();
    const tip = (cm.state.ternTooltip = this.makeTooltip(
      // @ts-expect-error: Types are not available
      where.right + 1,
      where.bottom,
      content,
    ));
    const maybeClear = () => {
      old = true;
      if (!mouseOnTip) clear();
    };
    const clear = () => {
      cm.state.ternTooltip = null;
      if (tip.parentNode) this.fadeOut(tip);
      clearActivity();
    };
    let mouseOnTip = false;
    let old = false;
    CodeMirror.on(tip, "mousemove", function() {
      mouseOnTip = true;
    });
    CodeMirror.on(tip, "mouseout", function(e: MouseEvent) {
      const related = e.relatedTarget;
      // @ts-expect-error: Types are not available
      if (!related || !CodeMirror.contains(tip, related)) {
        if (old) clear();
        else mouseOnTip = false;
      }
    });
    setTimeout(maybeClear, hintDelay);
    const clearActivity = this.onEditorActivity(cm, clear);
  }

  onEditorActivity(
    cm: CodeMirror.Editor,
    f: (instance: CodeMirror.Editor) => void,
  ) {
    cm.on("cursorActivity", f);
    cm.on("blur", f);
    cm.on("scroll", f);
    cm.on("setDoc", f);
    return function() {
      cm.off("cursorActivity", f);
      cm.off("blur", f);
      cm.off("scroll", f);
      cm.off("setDoc", f);
    };
  }

  makeTooltip(x: number, y: number, content: HTMLElement | string) {
    const node = this.elt("div", cls + "tooltip", content);
    node.style.left = x + "px";
    node.style.top = y + "px";
    document.body.appendChild(node);
    return node;
  }

  remove(node?: HTMLElement) {
    if (node) {
      const p = node.parentNode;
      if (p) p.removeChild(node);
    }
  }

  elt(
    tagName: string,
    cls: string | null,
    content: string | HTMLElement,
  ): HTMLElement {
    const e = document.createElement(tagName);
    if (cls) e.className = cls;
    if (content) {
      const eltNode =
        typeof content === "string"
          ? document.createTextNode(content)
          : content;
      e.appendChild(eltNode);
    }
    return e;
  }

  fadeOut(tooltip: HTMLElement) {
    this.remove(tooltip);
  }

  setEntityInformation(entityInformation: FieldEntityInformation) {
    this.fieldEntityInformation = entityInformation;
  }
}

export const createCompletionHeader = (name: string): Completion => ({
  text: name,
  displayText: name,
  className: "CodeMirror-hint-header",
  data: { doc: "" },
  origin: "",
  type: AutocompleteDataType.UNKNOWN,
  isHeader: true,
});

export default new TernServer();
