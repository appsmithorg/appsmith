import {
  type EntityLinkProps,
  entityTypeLinkMap,
} from "@appsmith/components/editorComponents/Debugger/entityTypeLinkMap";
import React from "react";

function EntityLink(props: EntityLinkProps) {
  const Component = entityTypeLinkMap[props.type];
  return <Component {...props} />;
}

export default EntityLink;
