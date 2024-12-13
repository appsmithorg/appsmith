import type { FetchStatusResponseData } from "git/requests/fetchStatusRequest.types";
import { objectKeys } from "@appsmith/utils";
import type { StatusTreeStruct } from "git/components/GitStatus/StatusTree";

const ICON_LOOKUP = {
  query: "query",
  jsObject: "js",
  page: "page-line",
  datasource: "database-2-line",
  jsLib: "package",
};

interface TreeNodeDef {
  subject: string;
  verb: string;
  type: keyof typeof ICON_LOOKUP;
}

function createTreeNode(nodeDef: TreeNodeDef) {
  return {
    icon: ICON_LOOKUP[nodeDef.type],
    message: `${nodeDef.subject} ${nodeDef.verb}`,
  };
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
    children: nodeDefs.map(createTreeNode),
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

export default function applicationStatusTransformer(
  status: FetchStatusResponseData,
) {
  const tree = [
    ...statusPageTransformer(status),
    ...statusDatasourceTransformer(status),
    ...statusJsLibTransformer(status),
  ] as StatusTreeStruct[];

  return tree;
}
