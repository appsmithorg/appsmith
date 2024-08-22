import React from "react";

import { entityTypeLinkMap } from "ee/components/editorComponents/Debugger/entityTypeLinkMap";

import type { EntityLinkProps } from "./DebuggerEntityLink";

function EntityLink(props: EntityLinkProps) {
  const Component = entityTypeLinkMap[props.type];
  return <Component {...props} />;
}

export default EntityLink;
