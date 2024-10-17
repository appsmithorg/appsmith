import React from "react";
import styled from "styled-components";
import { Card as BlueprintCard, Classes } from "@blueprintjs/core";
import { omit } from "lodash";
import { AppIcon, Size, TextType, Text } from "@appsmith/ads-old";
import type { PropsWithChildren } from "react";
import type { HTMLDivProps, ICardProps } from "@blueprintjs/core";
import { Button, type MenuItemProps } from "@appsmith/ads";

import GitConnectedBadge from "./GitConnectedBadge";

type CardProps = PropsWithChildren<{
  backgroundColor: string;
  contextMenu: React.ReactNode;
  editedByText: string;
  hasReadPermission: boolean;
  icon: string;
  isContextMenuOpen: boolean;
  isFetching: boolean;
  isMobile?: boolean;
  moreActionItems: ModifiedMenuItemProps[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  primaryAction: (e: any) => void;
  setShowOverlay: (show: boolean) => void;
  showGitBadge: boolean;
  showOverlay: boolean;
  testId: string;
  title: string;
  titleTestId: string;
  isSelected?: boolean;
  hasEditPermission?: boolean;
}>;

interface NameWrapperProps {
  hasReadPermission: boolean;
  showOverlay: boolean;
  isContextMenuOpen: boolean;
  testId: string;
}

type ModifiedMenuItemProps = MenuItemProps & {
  key?: string;
  "data-testid"?: string;
};

const ApplicationImage = styled.div`
  && {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

const AppNameWrapper = styled.div<{ isFetching: boolean }>`
  padding: 0;
  padding-right: 12px;
  ${(props) =>
    props.isFetching
      ? `
    width: 119px;
    height: 16px;
    margin-left: 10px;
  `
      : null};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3; /* number of lines to show */
  -webkit-box-orient: vertical;
  word-break: break-word;
  color: ${(props) => props.theme.colors.text.heading};
  flex: 1;

  .bp3-popover-target {
    display: inline;
  }
`;

const Container = styled.div<{ isMobile?: boolean }>`
  position: relative;
  overflow: visible;
  ${({ isMobile }) => isMobile && `width: 100%;`}
`;

const CircleAppIcon = styled(AppIcon)`
  padding: 12px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0px 2px 16px rgba(0, 0, 0, 0.07);
  border-radius: 50%;

  svg {
    width: 100%;
    height: 100%;
    path {
      fill: var(--ads-v2-color-fg);
    }
  }
`;

const NameWrapper = styled((props: HTMLDivProps & NameWrapperProps) => (
  <div
    {...omit(props, [
      "hasReadPermission",
      "showOverlay",
      "isContextMenuOpen",
      "testId",
    ])}
  />
))`
  .bp3-card {
    border-radius: var(--ads-v2-border-radius);
    box-shadow: none;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  ${(props) =>
    props.showOverlay &&
    `
      {
        justify-content: center;
        align-items: center;

        .overlay {
          position: relative;
          border-radius: var(--ads-v2-border-radius);
          ${
            props.hasReadPermission &&
            `text-decoration: none;
             &:after {
                left: 0;
                top: 0;
                content: "";
                position: absolute;
                height: 100%;
                width: 100%;
              }
              & .control {
                display: flex;
                flex-direction: row;
                z-index: 1;
              }`
          }

          & div.overlay-blur {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: ${
              props.hasReadPermission && !props.isContextMenuOpen
                ? `rgba(255, 255, 255, 0.5)`
                : null
            };
            border-radius: var(--ads-v2-border-radius);
            @supports ((-webkit-backdrop-filter: none) or (backdrop-filter: none)) {
              background-color: transparent;
              backdrop-filter: ${
                props.hasReadPermission && !props.isContextMenuOpen
                  ? `blur(6px)`
                  : null
              };
            }
          }
        }
      }
   `}
  overflow: hidden;

  border: 2px solid transparent;
  padding: var(--ads-spaces-1);
  border-radius: var(--ads-v2-border-radius);
  &:hover {
    border-color: var(--ads-v2-color-gray-100);
  }
`;

const Wrapper = styled(
  (
    props: ICardProps & {
      hasReadPermission?: boolean;
      backgroundColor: string;
      isMobile?: boolean;
    },
  ) => (
    <BlueprintCard
      {...omit(props, ["hasReadPermission", "backgroundColor", "isMobile"])}
    />
  ),
)`
  display: flex;
  flex-direction: row-reverse;
  justify-content: center;
  width: ${(props) => props.theme.card.minWidth}px;
  height: ${(props) => props.theme.card.minHeight}px;
  position: relative;
  background-color: ${(props) => props.backgroundColor};
  border-radius: var(--ads-v2-border-radius);
  .overlay {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    ${(props) => !props.hasReadPermission && `pointer-events: none;`}
  }
  .bp3-card {
    border-radius: var(--ads-v2-border-radius);
  }

  ${({ isMobile }) =>
    isMobile &&
    `
    width: 100% !important;
    height: 126px !important;
  `}
`;

const Control = styled.div<{ fixed?: boolean }>`
  outline: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 8px;
  align-items: center;

  .${Classes.BUTTON} {
    margin-top: 7px;

    div {
      width: auto;
      height: auto;
    }
  }

  .${Classes.BUTTON_TEXT} {
    font-size: 12px;
    color: white;
  }

  .more {
    position: absolute;
    right: ${(props) => props.theme.spaces[6]}px;
    top: ${(props) => props.theme.spaces[4]}px;
  }
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  margin: 4px 0 0 0;
  justify-content: space-between;
  width: ${(props) => props.theme.card.minWidth}px;

  @media screen and (min-width: 1500px) {
    width: ${(props) => props.theme.card.minWidth}px;
  }

  @media screen and (min-width: 1500px) and (max-width: 1512px) {
    width: ${(props) => props.theme.card.minWidth - 5}px;
  }
  @media screen and (min-width: 1478px) and (max-width: 1500px) {
    width: ${(props) => props.theme.card.minWidth - 8}px;
  }

  @media screen and (min-width: 1447px) and (max-width: 1477px) {
    width: ${(props) => props.theme.card.minWidth - 8}px;
  }

  @media screen and (min-width: 1417px) and (max-width: 1446px) {
    width: ${(props) => props.theme.card.minWidth - 11}px;
  }

  @media screen and (min-width: 1400px) and (max-width: 1417px) {
    width: ${(props) => props.theme.card.minWidth - 15}px;
  }

  @media screen and (max-width: 1400px) {
    width: ${(props) => props.theme.card.minWidth - 15}px;
  }
`;

const ModifiedDataComponent = styled.div`
  font-size: 13px;
  color: var(--ads-v2-color-fg-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  flex-grow: 1;
  &::first-letter {
    text-transform: uppercase;
  }
  & ~ * {
    flex-shrink: 0;
  }
`;

export const ContextMenuTrigger = styled(Button)<{ isHidden?: boolean }>`
  ${(props) => props.isHidden && "opacity: 0; visibility: hidden;"}
`;

function Card({
  backgroundColor,
  children,
  contextMenu,
  editedByText,
  hasEditPermission,
  hasReadPermission,
  icon,
  isContextMenuOpen,
  isFetching,
  isMobile,
  moreActionItems,
  primaryAction,
  setShowOverlay,
  showGitBadge,
  showOverlay,
  testId,
  title,
  titleTestId,
}: CardProps) {
  return (
    <Container isMobile={isMobile} onClick={primaryAction}>
      <NameWrapper
        className={testId}
        hasReadPermission={hasReadPermission}
        isContextMenuOpen={isContextMenuOpen}
        onMouseOver={() => {
          !isFetching && setShowOverlay(true);
        }}
        onMouseLeave={() => {
          // If the menu is not open, then setOverlay false
          // Set overlay false on outside click.
          !isContextMenuOpen && setShowOverlay(false);
        }}
        showOverlay={showOverlay}
        testId={testId}
      >
        <Wrapper
          backgroundColor={backgroundColor}
          className={isFetching ? Classes.SKELETON : `${testId}-background`}
          hasReadPermission={hasReadPermission}
          isMobile={isMobile}
        >
          {/*@ts-expect-error fix this the next time the file is edited*/}
          <CircleAppIcon name={icon} size={Size.large} />
          <AppNameWrapper
            className={isFetching ? Classes.SKELETON : ""}
            isFetching={isFetching}
          >
            <Text data-testid={titleTestId} type={TextType.H4}>
              {title}
            </Text>
          </AppNameWrapper>
          {showOverlay && !isMobile && (
            <div className="overlay">
              <div className="overlay-blur" />
              <ApplicationImage className="image-container">
                <Control className="control">{children}</Control>
              </ApplicationImage>
            </div>
          )}
        </Wrapper>
        <CardFooter>
          {hasEditPermission ? (
            <ModifiedDataComponent className="t--application-edited-text">
              {editedByText}
            </ModifiedDataComponent>
          ) : (
            <div />
          )}
          {Boolean(moreActionItems.length) && !isMobile && contextMenu}
        </CardFooter>
      </NameWrapper>
      {showGitBadge && <GitConnectedBadge />}
    </Container>
  );
}

export default Card;
