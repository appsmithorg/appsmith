/* eslint-disable @typescript-eslint/ban-ts-comment */
// Heavily inspired from https://github.com/codemirror/CodeMirror/blob/master/addon/tern/tern.js
import { Server, Def, CompletionsQuery } from "tern";
import ecma from "constants/defs/ecmascript.json";
import lodash from "constants/defs/lodash.json";
import base64 from "constants/defs/base64-js.json";
import moment from "constants/defs/moment.json";
import xmlJs from "constants/defs/xmlParser.json";
import forge from "constants/defs/forge.json";
import {
  getDynamicBindings,
  getDynamicStringSegments,
  isDynamicValue,
} from "utils/DynamicBindingUtils";
import {
  GLOBAL_DEFS,
  GLOBAL_FUNCTIONS,
} from "utils/autocomplete/EntityDefinitions";
import { FieldEntityInformation } from "components/editorComponents/CodeEditor/EditorConfig";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import SortRules from "./dataTypeSortRules";
import {
  Query,
  Document,
  QueryRegistry,
} from "codemirror/node_modules/@types/tern";
import CodeMirror, { Hint, Pos, cmpPos, TernOptions } from "codemirror";
import "imports-loader?type=commonjs&imports=tern!codemirror/addon/tern/tern";
import "tern/lib/infer";
import "tern/lib/signal";
import "tern/plugin/doc_comment";
import "tern/plugin/complete_strings";
import _ from "lodash";

const DEFS: Def[] = [
  // @ts-expect-error: Types are not available
  ecma,
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
  type: AutocompleteDataType;
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

declare module "codemirror" {
  interface TernServer {
    getHint: (cm: CodeMirror.Editor, cb: any) => Hints;
  }
}

export type DataTreeDefEntityInformation = {
  type: ENTITY_TYPE;
  subType: string;
};

class AppsmithTernServer extends CodeMirror.TernServer {
  private static _instance: AppsmithTernServer;
  defEntityInformation: Map<string, DataTreeDefEntityInformation> = new Map<
    string,
    DataTreeDefEntityInformation
  >();
  fieldEntityInformation: FieldEntityInformation = {};
  private constructor(options: TernOptions) {
    super(options);
    const _originalRequest = this.request.bind(this);
    this.request = new Proxy(_originalRequest, {
      apply(target, thisArg, argumentList) {
        Object.assign(argumentList[1], {
          inLiteral: false,
          origins: true,
          guess: false,
          caseInsensitive: true,
          includeKeywords: true,
        });
        //@ts-expect-error
        target.apply(thisArg, argumentList);
      },
    });

    const sortAndFilterCompletions = this.sortAndFilterCompletions.bind(this);

    this.getHint = new Proxy(this.getHint, {
      apply(target, thisArg, argArray) {
        const callback = argArray[1].bind(thisArg);
        argArray[1] = function(data: { from: any; to: any; list: any[] }) {
          data.list = sortAndFilterCompletions(data.list, true, "");
          console.log("Process further");
          callback.apply(thisArg, [data]);
        };
        //@ts-expect-error
        target.apply(thisArg, argArray);
      },
    });
  }

  setEntityInformation(entityInformation: FieldEntityInformation) {
    this.fieldEntityInformation = entityInformation;
  }

  getDataType(type: string): AutocompleteDataType {
    if (type === "?") return AutocompleteDataType.UNKNOWN;
    else if (type === "number") return AutocompleteDataType.NUMBER;
    else if (type === "string") return AutocompleteDataType.STRING;
    else if (type === "bool") return AutocompleteDataType.BOOLEAN;
    else if (type === "array") return AutocompleteDataType.ARRAY;
    else if (/^fn\(/.test(type)) return AutocompleteDataType.FUNCTION;
    else if (/^\[/.test(type)) return AutocompleteDataType.ARRAY;
    else return AutocompleteDataType.OBJECT;
  }

  sortAndFilterCompletions(
    completions: any[],
    findBestMatch: boolean,
    bestMatchSearch: string,
  ) {
    const {
      entityName,
      entityType,
      expectedType = AutocompleteDataType.UNKNOWN,
    } = this.fieldEntityInformation;
    type CompletionType =
      | "DATA_TREE"
      | "MATCHING_TYPE"
      | "OTHER"
      | "CONTEXT"
      | "JS"
      | "LIBRARY";
    const completionType: Record<CompletionType, Completion[]> = {
      MATCHING_TYPE: [],
      DATA_TREE: [],
      CONTEXT: [],
      JS: [],
      LIBRARY: [],
      OTHER: [],
    };
    completions.forEach((completion) => {
      if (entityName && completion.data.name === entityName) {
        return;
      }
      if (completion.data.origin) {
        if (
          completion.data.origin &&
          completion.data.origin.startsWith("DATA_TREE")
        ) {
          if (completion.data.name.includes(".")) {
            // nested paths (with ".") should only be used for best match
            if (completion.data.type === expectedType) {
              completionType.MATCHING_TYPE.push(completion);
            }
          } else if (
            completion.data.origin === "DATA_TREE.APPSMITH.FUNCTIONS"
          ) {
            // Global functions should be in best match as well as DataTree
            if (
              !entityType ||
              ENTITY_TYPE.ACTION === entityType ||
              ENTITY_TYPE.JSACTION === entityType ||
              ENTITY_TYPE.WIDGET === entityType
            ) {
              completionType.MATCHING_TYPE.push(completion);
              completionType.DATA_TREE.push(completion);
            }
          } else {
            // All top level entities are set in data tree
            completionType.DATA_TREE.push(completion);
          }
          return;
        }
        if (
          completion.data.origin === "[doc]" ||
          completion.data.origin === "customDataTree"
        ) {
          // [doc] are variables defined in the current context
          // customDataTree are implicit context defined by platform
          completionType.CONTEXT.push(completion);
          return;
        }
        if (
          completion.data.origin === "ecmascript" ||
          completion.data.origin === "base64-js"
        ) {
          completionType.JS.push(completion);
          return;
        }
        if (completion.data.origin.startsWith("LIB/")) {
          completionType.LIBRARY.push(completion);
          return;
        }
      }

      // Generally keywords or other unCategorised completions
      completionType.OTHER.push(completion);
    });
    completionType.DATA_TREE = completionType.DATA_TREE.sort(
      (a: Completion, b: Completion) => {
        if (a.type === "FUNCTION" && b.type !== "FUNCTION") {
          return 1;
        } else if (a.type !== "FUNCTION" && b.type === "FUNCTION") {
          return -1;
        }
        return a.text.toLowerCase().localeCompare(b.text.toLowerCase());
      },
    );
    completionType.MATCHING_TYPE = completionType.MATCHING_TYPE.filter((c) =>
      c.text.toLowerCase().startsWith(bestMatchSearch.toLowerCase()),
    );
    if (findBestMatch && completionType.MATCHING_TYPE.length) {
      const sortedMatches: Completion[] = [];
      const groupedMatches = _.groupBy(completionType.MATCHING_TYPE, (c) => {
        const name = c.text.split(".")[0];
        const entityInfo = this.defEntityInformation.get(name);
        if (!entityInfo) return c.text;
        return c.text.replace(name, entityInfo.subType);
      });

      const expectedRules = SortRules[expectedType as AutocompleteDataType];
      for (const [key, value] of Object.entries(groupedMatches)) {
        const name = key.split(".")[0];
        if (name === "JSACTION") {
          sortedMatches.push(...value);
        } else if (expectedRules.indexOf(key) !== -1) {
          sortedMatches.push(...value);
        }
      }

      sortedMatches.sort((a, b) => {
        let aRank = 0;
        let bRank = 0;
        const aName = a.text.split(".")[0];
        const bName = b.text.split(".")[0];
        const aEntityInfo = this.defEntityInformation.get(aName);
        const bEntityInfo = this.defEntityInformation.get(bName);
        if (!aEntityInfo) return -1;
        if (!bEntityInfo) return 1;
        if (aEntityInfo.type === entityType) {
          aRank = aRank + 1;
        }
        if (bEntityInfo.type === entityType) {
          bRank = bRank + 1;
        }
        return aRank - bRank;
      });
      completionType.MATCHING_TYPE = _.take(sortedMatches, 3);
      if (completionType.MATCHING_TYPE.length) {
        completionType.MATCHING_TYPE.unshift(
          createCompletionHeader("Best Match"),
        );
        completionType.DATA_TREE.unshift(
          createCompletionHeader("Search Results"),
        );
      }
    } else {
      // Clear any matching type because we dont want to find best match
      completionType.MATCHING_TYPE = [];
    }
    return [
      ...completionType.CONTEXT,
      ...completionType.MATCHING_TYPE,
      ...completionType.DATA_TREE,
      ...completionType.LIBRARY,
      ...completionType.JS,
      ...completionType.OTHER,
    ];
  }

  updateDef(
    name: string,
    def: Def,
    entityInfo?: Map<string, DataTreeDefEntityInformation>,
  ) {
    this.server.deleteDefs(name);
    //@ts-expect-error
    this.server.addDefs(def, true);
    if (entityInfo) this.defEntityInformation = entityInfo;
  }

  complete(cm: CodeMirror.Editor): void {
    cm.showHint({ hint: this.getHint, completeSingle: false });
  }

  static getInstance(options: TernOptions) {
    if (AppsmithTernServer._instance) return AppsmithTernServer._instance;
    AppsmithTernServer._instance = new AppsmithTernServer(options);

    return AppsmithTernServer._instance;
  }
}

const server = AppsmithTernServer.getInstance({
  defs: DEFS,
});

export default server;

export const createCompletionHeader = (name: string): Completion => ({
  text: name,
  displayText: name,
  className: "CodeMirror-hint-header",
  data: { doc: "" },
  origin: "",
  type: AutocompleteDataType.UNKNOWN,
  isHeader: true,
});
