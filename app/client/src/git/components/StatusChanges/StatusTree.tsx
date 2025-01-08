import React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  Icon,
  Text,
} from "@appsmith/ads";
import clsx from "clsx";
import styled from "styled-components";
import type { StatusTreeStruct } from "./types";

const StyledCollapsible = styled(Collapsible)`
  gap: 0;
`;

const StyledCollapsibleHeader = styled(CollapsibleHeader)`
  padding-top: 0;
  padding-bottom: 0;
`;

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

  const noEmphasis = depth > 1 && !tree.children;

  if (!tree.children) {
    return (
      <StatusTreeNode
        icon={tree.icon}
        message={tree.message}
        noEmphasis={noEmphasis}
      />
    );
  }

  return (
    <StyledCollapsible className="space-y-2">
      <StyledCollapsibleHeader arrowPosition="start">
        <StatusTreeNode icon={tree.icon} message={tree.message} />
      </StyledCollapsibleHeader>
      <CollapsibleContent
        className={clsx("ml-6", noEmphasis ? "space-y-1" : "space-y-2")}
      >
        {tree.children.map((child, index) => (
          <SingleStatusTree depth={depth + 1} key={index} tree={child} />
        ))}
      </CollapsibleContent>
    </StyledCollapsible>
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
