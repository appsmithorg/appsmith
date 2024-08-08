import React, { useContext, useEffect, useState } from "react";
import type {
  CollapsibleHeaderProps,
  CollapsibleContentProps,
  CollapsibleProps,
  CollapsibleContextType,
} from "./Collapsible.types";
import { ARROW_POSITIONS } from "./Collapsible.types";
import {
  StyledCollapsibleContainer,
  StyledCollapsibleContent,
  StyledCollapsibleHeader,
  StyledEndIcon,
} from "./Collapsible.styles";
import {
  CollapsibleClassName,
  CollapsibleContentClassName,
  CollapsibleHeaderClassName,
} from "./Collapsible.constants";
import { Icon } from "../Icon";
import { createContext } from "react";
import clsx from "classnames";

export const CollapsibleContext = createContext<CollapsibleContextType>({
  isExpanded: false,
  handleOpenChange: () => {
    return null;
  },
});

function CollapsibleHeader(props: CollapsibleHeaderProps) {
  const { arrowPosition = ARROW_POSITIONS.START, children, className } = props;
  const { handleOpenChange, isExpanded } = useContext(CollapsibleContext);

  return (
    <StyledCollapsibleHeader
      className={clsx(CollapsibleHeaderClassName, className)}
      onClick={handleOpenChange}
    >
      {arrowPosition === ARROW_POSITIONS.START && (
        <Icon
          name={isExpanded ? "arrow-down-s-line" : "arrow-right-s-line"}
          size="md"
        />
      )}

      {children}

      {arrowPosition === ARROW_POSITIONS.END && (
        <StyledEndIcon
          name={isExpanded ? "arrow-down-s-line" : "arrow-right-s-line"}
          size="md"
        />
      )}
    </StyledCollapsibleHeader>
  );
}

function CollapsibleContent(props: CollapsibleContentProps) {
  const { children, className } = props;
  const { isExpanded } = useContext(CollapsibleContext);

  return (
    <StyledCollapsibleContent
      className={clsx(CollapsibleContentClassName, className)}
      isExpanded={isExpanded}
    >
      {children}
    </StyledCollapsibleContent>
  );
}

function Collapsible(props: CollapsibleProps) {
  const { children, className, isOpen, onOpenChange } = props;
  const [isExpanded, setIsExpanded] = useState(!!isOpen);

  useEffect(() => {
    if (isOpen === true || isOpen === false) {
      setIsExpanded(isOpen);
    }
  }, [isOpen]);

  const handleOpenChange = () => {
    if (onOpenChange) {
      onOpenChange(!isExpanded);
    }

    setIsExpanded(!isExpanded);
  };

  return (
    <CollapsibleContext.Provider
      value={{
        isExpanded,
        handleOpenChange,
      }}
    >
      <StyledCollapsibleContainer
        className={clsx(CollapsibleClassName, className)}
      >
        {children}
      </StyledCollapsibleContainer>
    </CollapsibleContext.Provider>
  );
}

Collapsible.displayName = "Collapsible";
CollapsibleHeader.displayName = "CollapsibleHeader";
CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleHeader, CollapsibleContent };
