import React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  Icon,
  Text,
} from "@appsmith/ads";

export interface StatusTreeStruct {
  icon: string;
  message: string;
  children?: StatusTreeStruct[];
}

interface StatusTreeNodeProps {
  icon: string;
  message: string;
}

function StatusTreeNode({ icon, message }: StatusTreeNodeProps) {
  return (
    <div className="flex flex-row">
      <Icon name={icon} />
      <Text>{message}</Text>
    </div>
  );
}

interface StatusTreeProps {
  tree: StatusTreeStruct | null;
}

function StatusTree({ tree }: StatusTreeProps) {
  if (!tree) return null;

  if (!tree.children) {
    return <StatusTreeNode icon={tree.icon} message={tree.message} />;
  }

  return (
    <Collapsible>
      <CollapsibleHeader>
        <StatusTreeNode icon={tree.icon} message={tree.message} />
      </CollapsibleHeader>
      <CollapsibleContent>
        {tree.children.map((child, index) => (
          <StatusTree key={index} tree={child} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default StatusTree;
