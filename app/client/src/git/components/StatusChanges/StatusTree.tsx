import React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  Icon,
  Text,
} from "@appsmith/ads";
import clsx from "clsx";

export interface StatusTreeStruct {
  icon: string;
  message: string;
  children?: StatusTreeStruct[];
}

interface StatusTreeNodeProps {
  icon: string;
  message: string;
  noEmphasis?: boolean;
}

function StatusTreeNode({
  icon,
  message,
  noEmphasis = false,
}: StatusTreeNodeProps) {
  return (
    <div className="flex item-center space-x-1.5">
      <Icon color={"var(--ads-v2-color-fg)"} name={icon} size="md" />
      <Text className={clsx(!noEmphasis ? "!font-medium" : null)}>
        {message}
      </Text>
    </div>
  );
}

interface SingleStatusTreeProps {
  tree: StatusTreeStruct | null;
  depth?: number;
}

function SingleStatusTree({ depth = 1, tree }: SingleStatusTreeProps) {
  if (!tree) return null;

  if (!tree.children) {
    return (
      <StatusTreeNode
        icon={tree.icon}
        message={tree.message}
        noEmphasis={depth > 2}
      />
    );
  }

  return (
    <Collapsible className="!mt-0 !gap-0">
      <CollapsibleHeader>
        <StatusTreeNode icon={tree.icon} message={tree.message} />
      </CollapsibleHeader>
      <CollapsibleContent
        className={clsx("ml-6", depth < 2 ? "space-y-2" : "space-y-1")}
      >
        {tree.children.map((child, index) => (
          <SingleStatusTree depth={depth + 1} key={index} tree={child} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface StatusTreeProps {
  tree: StatusTreeStruct[] | null;
}

function StatusTree({ tree }: StatusTreeProps) {
  if (!tree) return null;

  return (
    <div className="my-4 space-y-2">
      {tree.map((tree, index) => (
        <SingleStatusTree key={index} tree={tree} />
      ))}
    </div>
  );
}

export default StatusTree;
