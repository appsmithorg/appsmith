import type { FetchStatusResponseData } from "git/requests/fetchStatusRequest.types";
import { objectKeys } from "@appsmith/utils";
import {
  createMessage,
  NOT_PUSHED_YET,
  TRY_TO_PULL,
} from "ee/constants/messages";
import type { StatusTreeStruct } from "git/components/StatusChanges/types";

const ICON_LOOKUP = {
  query: "query",
  jsObject: "js",
  page: "page-line",
  datasource: "database-2-line",
  jsLib: "package",
  settings: "settings-v3",
  theme: "sip-line",
  remote: "git-commit",
  package: "package",
  module: "package",
  moduleInstance: "package",
};

interface TreeNodeDef {
  subject: string;
  verb: string;
  type: keyof typeof ICON_LOOKUP;
  extra?: string;
}

function createTreeNode(nodeDef: TreeNodeDef) {
  let message = `${nodeDef.subject} ${nodeDef.verb}`;

  if (nodeDef.extra) {
    message += ` ${nodeDef.extra}`;
  }

  return { icon: ICON_LOOKUP[nodeDef.type], message };
}

function determineVerbForDefs(defs: TreeNodeDef[]) {
  const isRemoved = defs.some((def) => def.verb === "removed");
  const isAdded = defs.some((def) => def.verb === "added");
  const isModified = defs.some((def) => def.verb === "modified");

  let action = "";

  if (isRemoved && !isAdded && !isModified) {
    action = "removed";
  } else if (isAdded && !isRemoved && !isModified) {
    action = "added";
  } else {
    action = "modified";
  }

  return action;
}

function createTreeNodeGroup(nodeDefs: TreeNodeDef[], subject: string) {
  return {
    icon: ICON_LOOKUP[nodeDefs[0].type],
    message: `${nodeDefs.length} ${subject} ${determineVerbForDefs(nodeDefs)}`,
    children: nodeDefs
      .sort((a, b) =>
        a.subject.localeCompare(b.subject, undefined, { sensitivity: "base" }),
      )
      .map(createTreeNode),
  };
}

function statusPageTransformer(status: FetchStatusResponseData) {
  const {
    jsObjectsAdded,
    jsObjectsModified,
    jsObjectsRemoved,
    pagesAdded,
    pagesModified,
    pagesRemoved,
    queriesAdded,
    queriesModified,
    queriesRemoved,
  } = status;
  const pageEntityDefLookup: Record<string, TreeNodeDef[]> = {};
  const addToPageEntityDefLookup = (
    files: string[],
    type: keyof typeof ICON_LOOKUP,
    verb: string,
  ) => {
    files.forEach((file) => {
      const [page, subject] = file.split("/");

      pageEntityDefLookup[page] ??= [];
      pageEntityDefLookup[page].push({ subject, verb, type });
    });
  };

  addToPageEntityDefLookup(queriesModified, "query", "modified");
  addToPageEntityDefLookup(queriesAdded, "query", "added");
  addToPageEntityDefLookup(queriesRemoved, "query", "removed");
  addToPageEntityDefLookup(jsObjectsModified, "jsObject", "modified");
  addToPageEntityDefLookup(jsObjectsAdded, "jsObject", "added");
  addToPageEntityDefLookup(jsObjectsRemoved, "jsObject", "removed");

  const pageDefLookup: Record<string, TreeNodeDef> = {};
  const addToPageDefLookup = (pages: string[], verb: string) => {
    pages.forEach((page) => {
      pageDefLookup[page] = { subject: page, verb, type: "page" };
    });
  };

  addToPageDefLookup(pagesModified, "modified");
  addToPageDefLookup(pagesAdded, "added");
  addToPageDefLookup(pagesRemoved, "removed");

  const tree = [] as StatusTreeStruct[];

  objectKeys(pageEntityDefLookup).forEach((page) => {
    const queryDefs = pageEntityDefLookup[page].filter(
      (def) => def.type === "query",
    );
    const jsObjectDefs = pageEntityDefLookup[page].filter(
      (def) => def.type === "jsObject",
    );
    const children = [] as StatusTreeStruct[];

    if (queryDefs.length > 0) {
      const subject = queryDefs.length === 1 ? "query" : "queries";

      children.push(createTreeNodeGroup(queryDefs, subject));
    }

    if (jsObjectDefs.length > 0) {
      const subject = jsObjectDefs.length === 1 ? "jsObject" : "jsObjects";

      children.push(createTreeNodeGroup(jsObjectDefs, subject));
    }

    let pageDef = pageDefLookup[page];

    if (!pageDef) {
      pageDef = { subject: page, verb: "modified", type: "page" };
    }

    tree.push({ ...createTreeNode(pageDef), children });
  });

  tree.sort((a, b) =>
    a.message.localeCompare(b.message, undefined, { sensitivity: "base" }),
  );

  objectKeys(pageDefLookup).forEach((page) => {
    if (!pageEntityDefLookup[page]) {
      tree.push(createTreeNode(pageDefLookup[page]));
    }
  });

  return tree;
}

function statusDatasourceTransformer(status: FetchStatusResponseData) {
  const { datasourcesAdded, datasourcesModified, datasourcesRemoved } = status;
  const defs = [] as TreeNodeDef[];

  datasourcesModified.forEach((datasource) => {
    defs.push({ subject: datasource, verb: "modified", type: "datasource" });
  });

  datasourcesAdded.forEach((datasource) => {
    defs.push({ subject: datasource, verb: "added", type: "datasource" });
  });

  datasourcesRemoved.forEach((datasource) => {
    defs.push({ subject: datasource, verb: "removed", type: "datasource" });
  });

  const tree = [] as StatusTreeStruct[];

  if (defs.length > 0) {
    tree.push(createTreeNodeGroup(defs, "datasource"));
  }

  return tree;
}

function statusJsLibTransformer(status: FetchStatusResponseData) {
  const { jsLibsAdded, jsLibsModified, jsLibsRemoved } = status;
  const defs = [] as TreeNodeDef[];

  jsLibsModified.forEach((jsLib) => {
    defs.push({ subject: jsLib, verb: "modified", type: "jsLib" });
  });

  jsLibsAdded.forEach((jsLib) => {
    defs.push({ subject: jsLib, verb: "added", type: "jsLib" });
  });

  jsLibsRemoved.forEach((jsLib) => {
    defs.push({ subject: jsLib, verb: "removed", type: "jsLib" });
  });

  const tree = [] as StatusTreeStruct[];

  if (defs.length > 0) {
    const subject = defs.length === 1 ? "jsLib" : "jsLibs";

    tree.push(createTreeNodeGroup(defs, subject));
  }

  return tree;
}

function statusRemoteCountTransformer(status: FetchStatusResponseData) {
  const { aheadCount, behindCount } = status;
  const tree = [] as StatusTreeStruct[];

  if (behindCount > 0) {
    tree.push(
      createTreeNode({
        subject: `${behindCount} commit${behindCount > 1 ? "s" : ""}`,
        verb: "behind",
        type: "remote",
        extra: createMessage(TRY_TO_PULL),
      }),
    );
  }

  if (aheadCount > 0) {
    tree.push(
      createTreeNode({
        subject: `${aheadCount} commit${aheadCount > 1 ? "s" : ""}`,
        verb: "ahead",
        type: "remote",
        extra: createMessage(NOT_PUSHED_YET),
      }),
    );
  }

  return tree;
}

function statusSettingsTransformer(status: FetchStatusResponseData) {
  const { modified } = status;
  const tree = [] as StatusTreeStruct[];

  if (modified.includes("application.json")) {
    tree.push(
      createTreeNode({
        subject: "Application settings",
        verb: "modified",
        type: "settings",
      }),
    );
  }

  return tree;
}

function statusThemeTransformer(status: FetchStatusResponseData) {
  const { modified } = status;
  const tree = [] as StatusTreeStruct[];

  if (modified.includes("theme.json")) {
    tree.push(
      createTreeNode({
        subject: "Theme",
        verb: "modified",
        type: "theme",
      }),
    );
  }

  return tree;
}

function statusPackagesTransformer(status: FetchStatusResponseData) {
  const {
    modifiedModuleInstances = 0,
    modifiedModules = 0,
    modifiedPackages = 0,
  } = status;
  const tree = [] as StatusTreeStruct[];

  if (modifiedPackages > 0) {
    tree.push(
      createTreeNode({
        subject: `${modifiedPackages} package${modifiedPackages > 1 ? "s" : ""}`,
        verb: "modified",
        type: "package",
      }),
    );
  }

  if (modifiedModules > 0) {
    tree.push(
      createTreeNode({
        subject: `${modifiedModules} module${modifiedModules > 1 ? "s" : ""}`,
        verb: "modified",
        type: "module",
      }),
    );
  }

  if (modifiedModuleInstances > 0) {
    tree.push(
      createTreeNode({
        subject: `${modifiedModuleInstances} module instance${modifiedModuleInstances > 1 ? "s" : ""}`,
        verb: "modified",
        type: "moduleInstance",
      }),
    );
  }

  return tree;
}

export default function applicationStatusTransformer(
  status: FetchStatusResponseData,
) {
  const tree = [
    ...statusRemoteCountTransformer(status),
    ...statusPageTransformer(status),
    ...statusDatasourceTransformer(status),
    ...statusJsLibTransformer(status),
    ...statusSettingsTransformer(status),
    ...statusThemeTransformer(status),
    ...statusPackagesTransformer(status),
  ] as StatusTreeStruct[];

  return tree;
}
