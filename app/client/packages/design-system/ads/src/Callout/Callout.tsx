import React from "react";

import type { CalloutProps } from "./Callout.types";
import {
  StyledCallout,
  StyledChildrenContainer,
  StyledCloseButton,
  StyledIconContainer,
  StyledLinks,
  StyledChildren,
} from "./Callout.styles";
import { getIconByKind } from "../Icon/getIconByKind";
import { Link } from "../Link";
import {
  CalloutChildrenChildClassName,
  CalloutChildrenClassName,
  CalloutChildrenLinkClassName,
  CalloutClassName,
  CalloutCloseClassName,
  CalloutIconContainerClassName,
} from "./Callout.constants";

/*
 * TODO:
 *  - What will keyboard navigation for this look like?
 */
function Callout({
  _componentType = "callout",
  children,
  isClosable,
  kind = "info",
  links,
  onClose,
  ...rest
}: CalloutProps) {
  const [isClosed, setClosed] = React.useState(false);

  return (
    <StyledCallout
      className={CalloutClassName}
      isClosed={isClosed}
      kind={kind}
      {...rest}
    >
      {_componentType === "callout" && (
        <StyledIconContainer className={CalloutIconContainerClassName}>
          {kind && getIconByKind(kind)}
        </StyledIconContainer>
      )}
      <StyledChildrenContainer className={CalloutChildrenClassName}>
        {_componentType === "banner" && (
          <StyledIconContainer className={CalloutIconContainerClassName}>
            {kind && getIconByKind(kind)}
          </StyledIconContainer>
        )}
        <StyledChildren className={CalloutChildrenChildClassName} kind="body-m">
          {children}
        </StyledChildren>
        {links && (
          <StyledLinks className={CalloutChildrenLinkClassName}>
            {links.map((link) => {
              const { endIcon, onClick, startIcon, to, ...restOfLink } = link;

              return (
                <Link
                  endIcon={endIcon}
                  key={to || "onClickKey"}
                  kind="secondary"
                  onClick={onClick}
                  startIcon={startIcon}
                  to={to}
                  {...restOfLink}
                >
                  {link.children}
                </Link>
              );
            })}
          </StyledLinks>
        )}
      </StyledChildrenContainer>
      {isClosable && (
        <StyledCloseButton
          aria-label="Close"
          className={CalloutCloseClassName}
          isIconButton
          kind="tertiary"
          onClick={() => {
            setClosed(true);
            onClose && onClose();
          }}
          size="sm"
          startIcon="close-line"
        />
      )}
    </StyledCallout>
  );
}

Callout.displayName = "Callout";

export { Callout };
