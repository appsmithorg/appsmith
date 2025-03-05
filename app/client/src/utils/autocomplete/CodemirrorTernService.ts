/* eslint-disable @typescript-eslint/ban-ts-comment */
// Heavily inspired from https://github.com/codemirror/CodeMirror/blob/master/addon/tern/tern.js
import type { Server, Def, QueryRegistry } from "tern";
import type { Hint, Hints } from "codemirror";
import type CodeMirror from "codemirror";
import {
  getDynamicStringSegments,
  isDynamicValue,
} from "utils/DynamicBindingUtils";
import type { FieldEntityInformation } from "components/editorComponents/CodeEditor/EditorConfig";
import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import type { EntityTypeValue } from "ee/entities/DataTree/types";
import { AutocompleteSorter } from "./AutocompleteSortRules";
import { getCompletionsForKeyword } from "./keywordCompletion";
import TernWorkerServer from "./TernWorkerService";
import { AutocompleteDataType } from "./AutocompleteDataType";
import {
  getCodeMirrorNamespaceFromDoc,
  getCodeMirrorNamespaceFromEditor,
} from "../getCodeMirrorNamespace";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { findIndex, isString } from "lodash";
import { renderTernTooltipContent } from "./ternDocTooltip";
import { checkIfCursorInsideBinding } from "components/editorComponents/CodeEditor/codeEditorUtils";

const bigDoc = 250;
const cls = "CodeMirror-Tern-";
const hintDelay = 1700;

type MakeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export interface Completion<
  T = {
    doc: string;
  },
> extends MakeRequired<Hint, "displayText"> {
  origin: string;
  type: AutocompleteDataType | string;
  data: T;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: any;
  isHeader?: boolean;
  recencyWeight?: number;
  isEntityName?: boolean;
}

export interface CommandsCompletion
  extends Omit<Completion, "type" | "origin" | "data"> {
  data: unknown;
  action?: (callback?: (completion: string) => void) => void;
  shortcut?: string;
  triggerCompletionsPostPick?: boolean;
}

type TernDocs = Record<string, TernDoc>;

interface TernDoc {
  doc: CodeMirror.Doc;
  name: string;
  changed: { to: number; from: number } | null;
}

export interface TernCompletionResult {
  name: string;
  type?: string | undefined;
  depth?: number | undefined;
  doc?: string | undefined;
  url?: string | undefined;
  origin?: string | undefined;
}

interface ArgHints {
  start: CodeMirror.Position;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type: { args: any[]; rettype: null | string };
  name: string;
  guess: boolean;
  doc: CodeMirror.Doc;
}

interface RequestQuery {
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fullDocs?: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lineCharPositions?: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  start?: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  file?: any;
  includeKeywords?: boolean;
  depth?: number;
  sort?: boolean;
  expandWordForward?: boolean;
}

export interface DataTreeDefEntityInformation {
  type: EntityTypeValue;
  subType: string;
}

/** Tern hard coded some keywords which return `isKeyword` true.
 * There is however no provision to add more keywords to the list. Therefore,
 * we maintain a set of keywords that we add and show the keyword icon and type for.
 */
export function isCustomKeywordType(
  completion: TernCompletionResult & { isKeyword?: boolean },
): boolean {
  const customKeywordsList = ["async", "await"];

  return Boolean(
    customKeywordsList.includes(completion.name) || completion.isKeyword,
  );
}

// Define the regex for extracting the final object path
const FINAL_OBJECT_PATH_REGEX = /(?:\w+\.)*\w+$/;

/**
 * Extracts the final object path from a given input string.
 * The final object path is the rightmost dot-separated path in the string.
 *
 * @param {string} input - The input string from which to extract the object path.
 * @returns {string|null} - The extracted object path or null if no match is found.
 *
 * Example:
 *   Input: '\tconst k = PageQuery.run'
 *   Output: 'PageQuery.run'
 */
export function extractFinalObjectPath(input: string) {
  const match = (input || "")?.trim().match(FINAL_OBJECT_PATH_REGEX);

  return match ? match[0] : null;
}

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

function shortTernType(type: string) {
  if (!type) return "";

  return type
    .replaceAll("string", "str")
    .replaceAll("boolean", "bool")
    .replaceAll("number", "num")
    .replaceAll("{}", "obj");
}

function getRecencyWeight(
  completion:
    | string
    | {
        name: string;
        origin?: string | undefined;
      },
  recentEntities: string[],
) {
  const completionEntityName = isString(completion)
    ? completion.split(".")[0]
    : completion.name.split(".")[0];
  const completionOrigin = isString(completion) ? "" : completion.origin;

  if (completionOrigin !== "DATA_TREE") return 0;

  const recencyIndex = recentEntities.findIndex(
    (entityName) => entityName === completionEntityName,
  );

  if (recencyIndex === -1) return 0;

  const recencyWeight = recentEntities.length - recencyIndex;

  return recencyWeight;
}

class CodeMirrorTernService {
  server: Server;
  docs: TernDocs = Object.create(null);
  cachedArgHints: ArgHints | null = null;
  activeArgHints: HTMLElement | null = null;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  active: any;
  fieldEntityInformation: FieldEntityInformation = {};
  defEntityInformation: Map<string, DataTreeDefEntityInformation> = new Map<
    string,
    DataTreeDefEntityInformation
  >();
  entityDef: Def;
  options: { async: boolean };
  recentEntities: string[] = [];

  constructor(options: { async: boolean }) {
    this.options = options;
    this.server = new TernWorkerServer(this);
    this.entityDef = {};
  }

  resetServer = () => {
    this.server = new TernWorkerServer(this);
    this.docs = Object.create(null);
  };

  complete(cm: CodeMirror.Editor) {
    cm.showHint({
      hint: this.getHint.bind(this),
      completeSingle: false,
      alignWithWord: false,
      extraKeys: {
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Up: (cm: CodeMirror.Editor, handle: any) => {
          handle.moveFocus(-1);

          if (this.active.isHeader === true) {
            handle.moveFocus(-1);
          }
        },
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Down: (cm: CodeMirror.Editor, handle: any) => {
          handle.moveFocus(1);

          if (this.active.isHeader === true) {
            handle.moveFocus(1);
          }
        },
      },
    });
  }

  // Forked from app/client/node_modules/codemirror/addon/tern/tern.js
  updateArgHints(cm: CodeMirror.Editor) {
    this.closeArgHints();
    cm.state.ternTooltip = null;

    if (cm.somethingSelected()) return false;

    if (cm.state.completionActive) return false;

    const state = cm.getTokenAt(cm.getCursor()).state;
    const CodeMirror = getCodeMirrorNamespaceFromDoc(cm.getDoc());
    const inner = CodeMirror.innerMode(cm.getMode(), state);

    if (inner.mode.name != "javascript") return false;

    const lex = inner.state.lexical;

    if (lex.info != "call") return false;

    let ch;
    const argPos = lex.pos || 0,
      tabSize = cm.getOption("tabSize") || 0;
    let found = false;
    let line = cm.getCursor().line;

    for (let e = Math.max(0, line - 9); line >= e; --line) {
      const str = cm.getLine(line);
      let extra = 0;

      for (let pos = 0; ; ) {
        const tab = str.indexOf("\t", pos);

        if (tab == -1) break;

        extra += tabSize - ((tab + extra) % tabSize) - 1;
        pos = tab + 1;
      }

      ch = lex.column - extra;

      if (str.charAt(ch) == "(") {
        found = true;
        break;
      }
    }

    if (!found) return false;

    const start = CodeMirror.Pos(line, ch);
    const cache = this.cachedArgHints;

    if (
      cache &&
      cache.doc == cm.getDoc() &&
      CodeMirror.cmpPos(start, cache.start) == 0
    ) {
      this.showArgHints(cm, argPos);

      return true;
    }

    this.request<"type">(
      cm,
      { type: "type", preferFunction: true, end: start },
      (error, data) => {
        if (error || !data.type || !/^fn\(/.test(data.type)) return;

        this.cachedArgHints = {
          start: start,
          type: this.parseFnType(data.type),
          name: data.exprName || data.name || "fn",
          guess: data.guess,
          doc: cm.getDoc(),
        };

        if (!cm.state.completionActive) this.showArgHints(cm, argPos);
      },
    );

    return true;
  }

  // Forked from app/client/node_modules/codemirror/addon/tern/tern.js
  parseFnType(text: string) {
    const args = [];
    let pos = 3;

    function skipMatching(upto: RegExp) {
      let depth = 0;
      const start = pos;

      for (;;) {
        const next = text.charAt(pos);

        if (upto.test(next) && !depth) return text.slice(start, pos);

        if (/[{\[\(]/.test(next)) ++depth;
        else if (/[}\]\)]/.test(next)) --depth;

        ++pos;
      }
    }

    // Parse arguments
    if (text.charAt(pos) != ")")
      for (;;) {
        const mName = text.slice(pos).match(/^([^, \(\[\{]+): /);
        let name;

        if (mName) {
          pos += mName[0].length;
          name = mName[1];
        }

        args.push({ name: name, type: skipMatching(/[\),]/) });

        if (text.charAt(pos) == ")") break;

        pos += 2;
      }

    const rettype = text.slice(pos).match(/^\) -> (.*)$/);

    return { args: args, rettype: rettype && rettype[1] };
  }

  // Forked from app/client/node_modules/codemirror/addon/tern/tern.js
  closeArgHints() {
    if (this.activeArgHints) {
      // @ts-expect-error no types found
      if (this.activeArgHints.clear) this.activeArgHints.clear();

      this.remove(this.activeArgHints);
      this.activeArgHints = null;
    }

    return true;
  }

  // Forked from app/client/node_modules/codemirror/addon/tern/tern.js
  showArgHints(cm: CodeMirror.Editor, pos: number) {
    this.closeArgHints();
    const cache = this.cachedArgHints,
      tp = cache?.type;
    const tip = this.elt(
      "span",
      cache?.guess ? cls + "fhint-guess" : null,
      this.elt("span", cls + "fname", cache?.name),
      "(",
    );

    if (!tp) return;

    for (let i = 0; i < tp.args.length; ++i) {
      if (i) tip.appendChild(document.createTextNode(", "));

      const arg = tp.args[i];

      tip.appendChild(
        this.elt(
          "span",
          cls + "farg" + (i == pos ? " " + cls + "farg-current" : ""),
          arg.name || "?",
        ),
      );

      if (arg.type != "?") {
        tip.appendChild(document.createTextNode(":\u00a0"));
        tip.appendChild(
          this.elt("span", cls + "type", shortTernType(arg.type)),
        );
      }
    }

    tip.appendChild(document.createTextNode(")"));

    if (tp.rettype)
      tip.appendChild(
        this.elt("span", cls + "type", `: ${shortTernType(tp.rettype)}`),
      );

    const place = cm.cursorCoords(null, "page");

    const tooltip: HTMLElement & { clear?: () => void } =
      (cm.state.ternTooltip =
      this.activeArgHints =
        this.makeTooltip(place.left + 1, place.bottom, tip, cm));

    setTimeout(() => {
      tooltip.clear = this.onEditorActivity(cm, () => {
        if (this.activeArgHints == tooltip) this.closeArgHints();
      });
    }, 20);
  }

  showType(cm: CodeMirror.Editor) {
    this.showContextInfo(cm, "type", null);
  }

  showDocs(cm: CodeMirror.Editor) {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.showContextInfo(cm, "documentation", (data: any) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    });
  }

  updateDef(
    name: string,
    def?: Def,
    entityInfo?: Map<string, DataTreeDefEntityInformation>,
  ) {
    if (def) {
      // Need to remove previous def as def aren't overwritten
      this.removeDef(name);
      // addDefs doesn't work for [def] and instead works with single def
      // @ts-expect-error: Types are not available
      this.server.addDefs(def);
    } else {
      this.server.deleteDefs(name);
    }

    this.entityDef = def || {};

    if (entityInfo) this.defEntityInformation = entityInfo;
  }

  removeDef(name: string) {
    this.server.deleteDefs(name);
  }

  requestCallback(
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any,
    data: QueryRegistry["completions"]["result"],
    cm: CodeMirror.Editor,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolve: any,
  ) {
    if (error) return this.showError(cm, error);

    if (data.completions.length === 0) return;

    const doc = this.findDoc(cm.getDoc());
    const lineValue = this.lineValue(doc);
    const cursor = cm.getCursor();
    const { extraChars } = this.getFocusedDocValueAndPos(doc);
    const fieldIsJSAction =
      this.fieldEntityInformation.entityType === ENTITY_TYPE.JSACTION;

    let completions: Completion<TernCompletionResult>[] = [];
    let after = "";
    const { end, start } = data;

    if (typeof end === "number" || typeof start === "number") return;

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
    const { Pos } = getCodeMirrorNamespaceFromEditor(cm);

    if (
      cm.getRange(Pos(from.line, from.ch - 2), from) === '["' &&
      cm.getRange(to, Pos(to.line, to.ch + 2)) !== '"]'
    ) {
      after = '"]';
    }

    const token = cm.getTokenAt(cursor);
    const handleAutocompleteSelection = dotToBracketNotationAtToken(token);

    for (let i = 0; i < data.completions.length; ++i) {
      const completion = data.completions[i];

      if (typeof completion === "string") continue;

      const isCursorInsideBinding = checkIfCursorInsideBinding(cm);
      const isKeyword = isCustomKeywordType(completion);
      const className = typeToIcon(completion.type as string, isKeyword);
      const dataType = getDataType(completion.type as string);
      const recencyWeight = getRecencyWeight(completion, this.recentEntities);
      const isCompletionADataTreeEntityName =
        completion.origin === "DATA_TREE" &&
        this.defEntityInformation.has(completion.name);
      let completionText = completion.name + after;
      const completedLine = lineValue.substring(0, from.ch) + completion.name;
      const entityPath = extractFinalObjectPath(completedLine);

      if (dataType === "FUNCTION" && !completion.origin?.startsWith("LIB/")) {
        if (token.type !== "string" && token.string !== "[") {
          const entityDef = entityPath && this.entityDef[entityPath];

          if (
            entityDef &&
            typeof entityDef === "object" &&
            "!fnParams" in entityDef
          ) {
            completionText = completionText + `(${entityDef["!fnParams"]})`;
          } else {
            completionText = completionText + "()";
          }
        }
      }

      const codeMirrorCompletion: Completion<TernCompletionResult> = {
        text: completionText,
        displayText: completion.name,
        className: className,
        data: completion,
        origin: completion.origin as string,
        type: dataType,
        isHeader: false,
        recencyWeight,
        isEntityName: isCompletionADataTreeEntityName,
      };

      if (!isCursorInsideBinding && !fieldIsJSAction) {
        codeMirrorCompletion.displayText = `{{${codeMirrorCompletion.displayText}}}`;
        codeMirrorCompletion.text = `{{${codeMirrorCompletion.text}}}`;
      }

      if (isKeyword) {
        codeMirrorCompletion.render = (
          element: HTMLElement,
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          self: any,
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: any,
        ) => {
          element.setAttribute("keyword", data.displayText);
          element.innerHTML = data.displayText;
        };

        const trimmedFocusedValueLength = lineValue
          .substring(0, end.ch)
          .trim().length;

        /**
         * end.ch counts tab space as 1 instead of 2 space chars in string
         * For eg: lets take string `  ab`. Here, end.ch = 3 & trimmedFocusedValueLength = 2
         * hence tabSpacesCount = end.ch - trimmedFocusedValueLength
         */
        const tabSpacesCount = end.ch - trimmedFocusedValueLength;
        const cursorHorizontalPos =
          tabSpacesCount * 2 + trimmedFocusedValueLength - 2;

        // Add relevant keyword completions
        const keywordCompletions = getCompletionsForKeyword(
          codeMirrorCompletion,
          cursorHorizontalPos,
        );

        completions = [...completions, ...keywordCompletions];
      } else {
        codeMirrorCompletion.hint = handleAutocompleteSelection;
      }

      completions.push(codeMirrorCompletion);
    }

    completions = AutocompleteSorter.sort(
      completions,
      { ...this.fieldEntityInformation, token },
      this.defEntityInformation.get(
        this.fieldEntityInformation.entityName || "",
      ),
      !fieldIsJSAction,
    );
    const indexToBeSelected =
      completions.length && completions[0].isHeader ? 1 : 0;
    const obj = {
      from: from,
      to: to,
      list: completions,
      selectedHint: indexToBeSelected,
      lineValue,
      query: this.getQueryForAutocomplete(cm),
    };
    let tooltip: HTMLElement | undefined = undefined;
    const CodeMirror = getCodeMirrorNamespaceFromEditor(cm);

    CodeMirror.on(obj, "shown", () => {
      this.activeArgHints && this.remove(this.activeArgHints);
    });
    CodeMirror.on(obj, "close", () => this.remove(tooltip));
    CodeMirror.on(obj, "update", () => this.remove(tooltip));
    CodeMirror.on(
      obj,
      "select",
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cur: Completion<TernCompletionResult>, node: any) => {
        this.active = cur;
        this.remove(tooltip);
        const content = cur.data.doc;

        if (!content) return;

        const docTooltipContainer = this.elt("div", "flex flex-col pb-1");

        renderTernTooltipContent(docTooltipContainer, cur);
        tooltip = this.makeTooltip(
          node.parentNode.getBoundingClientRect().right + window.pageXOffset,
          node.getBoundingClientRect().top + window.pageYOffset + 2,
          docTooltipContainer,
          cm,
          cls + "hint-doc",
        );
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
      },
    );
    resolve(obj);

    return obj;
  }

  async getHint(cm: CodeMirror.Editor) {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hints: Record<string, any> = await new Promise((resolve) => {
      this.request<"completions">(
        cm,
        {
          type: "completions",
          types: true,
          docs: true,
          urls: true,
          origins: true,
          caseInsensitive: true,
          guess: false,
          inLiteral: true,
          depth: 3,
        },
        (error, data) => this.requestCallback(error, data, cm, resolve),
      );
    });

    // When a function is picked, move the cursor between the parenthesis.
    const CodeMirror = getCodeMirrorNamespaceFromDoc(cm.getDoc());

    CodeMirror.on(hints, "pick", (selected: Completion) => {
      const hintsWithoutHeaders = hints.list.filter(
        (h: Record<string, unknown>) => h.isHeader !== true,
      );

      const selectedResultIndex = findIndex(
        hintsWithoutHeaders,
        (item: Record<string, unknown>) =>
          item.displayText === selected.displayText,
      );

      AnalyticsUtil.logEvent("AUTO_COMPLETE_SELECT", {
        selectedResult: selected.text,
        query: hints.query,
        selectedResultIndex,
        selectedResultType: selected.type,
        isBestMatch:
          selectedResultIndex <= AutocompleteSorter.bestMatchEndIndex,
        isExternalLibrary: selected.origin?.startsWith("LIB/"),
        libraryNamespace: selected.origin?.split("/")[1],
      });

      // Check if the completion ends with parentheses () or closing brackets }}
      const hasParenthesis = selected.text.endsWith("()");
      const endsWithBindingBrackets = selected.text.endsWith("}}");

      // Position cursor handling:
      // 1. For functions - place cursor between parentheses e.g. myFunction(|)
      // 2. For completions with }} - place cursor before }} e.g. {{Api1.data|}}
      if (selected.type === AutocompleteDataType.FUNCTION && hasParenthesis) {
        cm.setCursor({
          line: cm.getCursor().line,
          ch: cm.getCursor().ch - 1,
        });
      } else if (endsWithBindingBrackets) {
        cm.setCursor({
          line: cm.getCursor().line,
          ch: cm.getCursor().ch - 2,
        });
      }
    });

    return hints;
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showContextInfo(cm: CodeMirror.Editor, queryName: string, callbackFn?: any) {
    this.request<"type">(cm, { type: queryName }, (error, data) => {
      if (error) return;

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

  request<T extends keyof QueryRegistry>(
    cm: CodeMirror.Editor,
    query: RequestQuery | string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callbackFn: (error: any, data: QueryRegistry[T]["result"]) => void,
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
    const CodeMirror = getCodeMirrorNamespaceFromDoc(doc);

    CodeMirror.on(doc, "change", this.trackChange.bind(this));

    return (this.docs[name] = data);
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildRequest(doc: TernDoc, query: any, pos?: CodeMirror.Position) {
    const files = [];
    let offsetLines = 0;

    if (typeof query == "string") query = { type: query };

    const allowFragments = !query.fullDocs;

    if (!allowFragments) delete query.fullDocs;

    query.lineCharPositions = true;
    query.includeKeywords = true;
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
        const { Pos } = getCodeMirrorNamespaceFromDoc(doc.doc);

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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      text: string | any[];
    },
  ) {
    const { cmpPos } = getCodeMirrorNamespaceFromDoc(doc);
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
      function (error: Error) {
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

  getFocusedDocValueAndPos(doc: TernDoc): {
    value: string;
    end: { line: number; ch: number };
    extraChars: number;
    isSingleDynamicValue?: boolean;
  } {
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
        isSingleDynamicValue: isDynamicValue(value),
      };
    }

    let dynamicString = value;

    let newCursorLine = cursor.line;
    let newCursorPosition = cursor.ch;

    let currentLine = 0;
    let sameLineSegmentCount = 1;

    const lineValueSplitByBindingStart = lineValue.split("{{");
    const lineValueSplitByBindingEnd = lineValue.split("}}");

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

      const posOfBindingStart = lineValueSplitByBindingStart
        .slice(0, sameLineSegmentCount)
        .join("{{").length;
      const posOfBindingClose = lineValueSplitByBindingEnd
        .slice(0, sameLineSegmentCount)
        .join("}}").length;

      const isCursorInBetweenSegmentStartAndEndLine =
        cursor.line > currentLine && cursor.line < segmentEndLine;

      const isCursorAtSegmentEndLine = cursor.line === segmentEndLine;

      const isCursorAtSegmentStartLine = cursor.line === currentLine;
      const isCursorAfterBindingOpenAtSegmentStart =
        isCursorAtSegmentStartLine && cursor.ch >= posOfBindingStart;
      const isCursorBeforeBindingCloseAtSegmentEnd =
        isCursorAtSegmentEndLine && cursor.ch <= posOfBindingClose;

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
          extraChars = posOfBindingStart + 2;
        }

        newCursorPosition = cursor.ch - extraChars;

        break;
      }

      if (currentLine !== segmentEndLine) {
        sameLineSegmentCount = 1;
      } else if (isDynamicValue(segment)) {
        sameLineSegmentCount += 1;
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
    const CodeMirror = getCodeMirrorNamespaceFromDoc(doc);

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

    const { Pos } = CodeMirror;
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
      cm,
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

    const CodeMirror = getCodeMirrorNamespaceFromEditor(cm);
    let mouseOnTip = false;
    let old = false;

    CodeMirror.on(tip, "mousemove", function () {
      mouseOnTip = true;
    });
    CodeMirror.on(tip, "mouseout", function (e: MouseEvent) {
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

    return function () {
      cm.off("cursorActivity", f);
      cm.off("blur", f);
      cm.off("scroll", f);
      cm.off("setDoc", f);
    };
  }

  makeTooltip(
    x: number,
    y: number,
    content: HTMLElement | string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cm?: any,
    className?: string | null,
  ) {
    const node = this.elt(
      "div",
      cls + "tooltip" + " " + (className || ""),
      content,
    );

    node.style.left = x + "px";
    node.style.top = y + "px";
    const container = cm.options?.hintOptions?.container || document.body;

    container.appendChild(node);
    const pos = cm.cursorCoords();
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    let box = node.getBoundingClientRect();
    const hints = document.querySelector(".CodeMirror-hints") as HTMLElement;
    const overlapY = box.bottom - winH;
    let overlapX = box.right - winW;

    if (hints && overlapX > 0) {
      node.style.left = "0";
      box = node.getBoundingClientRect();
      node.style.left = (x = x - hints.offsetWidth - box.width) + "px";
      overlapX = box.right - winW;
    }

    if (overlapY > 0) {
      const height = box.bottom - box.top,
        curTop = pos.top - (pos.bottom - box.top);

      if (curTop - height > 0) {
        // Fits above cursor
        node.style.top = pos.top - height + "px";
      } else if (height > winH) {
        node.style.height = winH - 5 + "px";
        node.style.top = pos.bottom - box.top + "px";
      }
    }

    if (overlapX > 0) {
      if (box.right - box.left > winW) {
        node.style.width = winW - 5 + "px";
        overlapX -= box.right - box.left - winW;
      }

      node.style.left = x - overlapX - 5 + "px";
    }

    return node;
  }

  remove(node?: HTMLElement) {
    if (node) {
      const p = node.parentNode;

      if (p) p.removeChild(node);
    }
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elt(tagname: string, cls: string | null, ...rest: any[]) {
    const e = document.createElement(tagname);

    if (cls) e.className = cls;

    for (let i = 0; i < rest.length; ++i) {
      let elt = rest[i];

      if (typeof elt == "string") elt = document.createTextNode(elt);

      e.appendChild(elt);
    }

    return e;
  }

  fadeOut(tooltip: HTMLElement) {
    this.remove(tooltip);
  }

  setEntityInformation(
    cm: CodeMirror.Editor,
    entityInformation: FieldEntityInformation,
  ) {
    const state = cm.getTokenAt(cm.getCursor()).state;
    const CodeMirror = getCodeMirrorNamespaceFromDoc(cm.getDoc());
    const inner = CodeMirror.innerMode(cm.getMode(), state);

    if (inner.mode.name === "javascript") {
      const lex = inner.state.lexical;

      if (lex.info === "call") {
        const argPos = lex.pos || 0;
        const args = this.cachedArgHints?.type?.args || [];
        const arg = args[argPos];
        const argType = arg?.type;

        entityInformation.expectedType = getDataType(argType);
      }
    }

    this.fieldEntityInformation = entityInformation;
  }

  getQueryForAutocomplete(cm: CodeMirror.Editor) {
    const doc = this.findDoc(cm.getDoc());
    const lineValue = this.lineValue(doc);
    const { end, extraChars, isSingleDynamicValue } =
      this.getFocusedDocValueAndPos(doc);
    let extraCharsInString = extraChars;
    const endOfString = end.ch + extraChars;

    if (isSingleDynamicValue) {
      extraCharsInString += 2;
    }

    const stringFromEndCh = lineValue.substring(
      extraCharsInString,
      endOfString,
    );

    const splitBySpace = stringFromEndCh.split(" ");
    const query = splitBySpace[splitBySpace.length - 1];

    return query;
  }

  updateRecentEntities(recentEntities: string[]) {
    this.recentEntities = recentEntities;
  }
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createCompletionHeader = (name: string): Completion<any> => ({
  text: name,
  displayText: name,
  className: "CodeMirror-hint-header",
  data: { doc: "" },
  origin: "",
  type: AutocompleteDataType.UNKNOWN,
  isHeader: true,
});

export default new CodeMirrorTernService({
  async: true,
});

function dotToBracketNotationAtToken(token: CodeMirror.Token) {
  return (cm: CodeMirror.Editor, hints: Hints, curr: Hint) => {
    let completion = curr.text;

    if (
      token.type === "string" ||
      ("type" in curr && curr.type === AutocompleteDataType.FUNCTION)
    ) {
      // | represents the cursor
      // Cases like JSObject1["myV|"]
      cm.replaceRange(completion, hints.from, hints.to);

      return;
    } else if (token.type === null && token.state?.lexical?.type === "]") {
      // Cases like JSObject1[|]
      cm.replaceRange(`"${completion}"`, hints.from, hints.to);

      return;
    }

    const splitByDotOperator = completion.split(".");

    if (splitByDotOperator.length === 1) {
      const splitByBracketOperator = completion.split("[");

      if (splitByBracketOperator.length === 1) {
        if (completion.includes(" ")) {
          completion = `["${completion}"]`;
          hints.from.ch -= 1;
        }
      }
    }

    cm.replaceRange(completion, hints.from, hints.to);
  };
}
