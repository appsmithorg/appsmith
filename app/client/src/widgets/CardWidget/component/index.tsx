import {
  Alignment,
  Menu,
  MenuItem as BlueprintMenuItem,
  Icon,
} from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";
import { Colors } from "constants/Colors";
import { darkenActive, darkenHover } from "constants/DefaultTheme";
import {
  CARD_WIDGET_EXPAND_BUTTON_ARIA_LABEL,
  CARD_WIDGET_MENU_BUTTON_ARIA_LABEL,
  createMessage,
  IMAGE_LOAD_ERROR,
} from "ee/constants/messages";
import type { ReactNode } from "react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { BaseButton } from "widgets/ButtonWidget/component";
import { getComplementaryGrayscaleColor, scrollCSS } from "widgets/WidgetUtils";
import { generateClassName, getCanvasClassName } from "utils/generators";
import type {
  CardFooterAction,
  CardMenuItem,
  MediaObjectFit,
  MediaPosition,
} from "../constants";
import {
  CARD_FOOTER_HEIGHT,
  CARD_HEADER_HEIGHT,
  DEFAULT_MEDIA_HEIGHT,
  MEDIA_LEFT_WIDTH,
  MediaPositionTypes,
} from "../constants";

const HOVER_ELEVATION_SHADOW = "0 6px 20px 0 rgba(0, 0, 0, 0.15)";
const SKELETON_CLASS = "bp3-skeleton";

interface CardArticleStyleProps {
  $backgroundColor?: string;
  $borderColor?: string;
  $borderWidth?: string;
  $borderRadius?: string;
  $boxShadow?: string;
  $hoverElevation?: boolean;
  $isInteractive?: boolean;
  $horizontal?: boolean;
  $isSelected?: boolean;
  $selectedAccentColor?: string;
  $isDisabled?: boolean;
}

const CardArticle = styled.article<CardArticleStyleProps>`
  display: flex;
  flex-direction: ${({ $horizontal }) => ($horizontal ? "row" : "column")};
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: ${({ $backgroundColor }) => $backgroundColor || Colors.WHITE};
  border-color: ${({ $borderColor }) => $borderColor || Colors.GREY_5};
  border-style: solid;
  border-width: ${({ $borderWidth }) =>
    `${parseInt($borderWidth || "0", 10) || 0}px`};
  border-radius: ${({ $borderRadius }) => $borderRadius || "0px"};
  box-shadow: ${({ $boxShadow }) => $boxShadow || "none"};
  ${({ $boxShadow, $hoverElevation, $isDisabled }) =>
    $hoverElevation && !$isDisabled
      ? `
        transition: box-shadow 0.2s ease-in-out;
        &:hover {
          /* Compose with the configured shadow instead of replacing it,
             so a card with a large theme shadow doesn't visually drop. */
          box-shadow: ${
            $boxShadow && $boxShadow !== "none"
              ? `${$boxShadow}, ${HOVER_ELEVATION_SHADOW}`
              : HOVER_ELEVATION_SHADOW
          };
        }
      `
      : ""}
  ${({ $isSelected, $selectedAccentColor }) =>
    $isSelected
      ? `
        border-color: ${$selectedAccentColor || Colors.GREY_10};
        outline: 1px solid ${$selectedAccentColor || Colors.GREY_10};
        outline-offset: -1px;
      `
      : ""}
  ${({ $isInteractive }) =>
    $isInteractive
      ? `
        cursor: pointer;
        &:focus-visible {
          outline: 2px solid var(--wds-accent-color, ${Colors.GREY_8});
          outline-offset: 2px;
        }
      `
      : ""}
  ${({ $isDisabled }) =>
    $isDisabled
      ? `
        opacity: 0.6;
        cursor: not-allowed;
      `
      : ""}
`;

const ContentColumn = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
`;

const MediaWrapper = styled.div<{
  $position: MediaPosition;
  $height: number;
}>`
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  ${({ $height, $position }) =>
    $position === MediaPositionTypes.TOP
      ? `height: ${$height}px; width: 100%;`
      : `width: ${MEDIA_LEFT_WIDTH}px; height: 100%;`}
`;

const MediaImage = styled.img<{ $objectFit: MediaObjectFit }>`
  display: block;
  height: 100%;
  width: 100%;
  object-fit: ${({ $objectFit }) => $objectFit};
`;

const MediaFallback = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  gap: 8px;
  background-color: ${Colors.GREY_1};
  color: ${Colors.GREY_7};
  font-size: 12px;
  text-align: center;
  padding: 8px;
`;

const HeaderWrapper = styled.div<{ $showDivider: boolean }>`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 10px;
  height: ${CARD_HEADER_HEIGHT}px;
  padding: 0 12px;
  border-bottom: ${({ $showDivider }) =>
    $showDivider ? `1px solid ${Colors.GREY_4}` : "none"};
`;

const AvatarImage = styled.img`
  height: 32px;
  width: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

const AvatarIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  width: 32px;
  border-radius: 50%;
  background-color: ${Colors.GREY_2};
  color: ${Colors.GREY_8};
  flex-shrink: 0;
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1 1 auto;
  min-width: 0;
`;

const Title = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${Colors.GREY_10};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Subtitle = styled.span`
  font-size: 12px;
  color: ${Colors.GREY_7};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Badge = styled.span<{ $badgeColor?: string }>`
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background-color: ${({ $badgeColor }) => $badgeColor || Colors.GREY_3};
  color: ${({ $badgeColor }) =>
    $badgeColor ? getComplementaryGrayscaleColor($badgeColor) : Colors.GREY_10};
  max-width: 40%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HeaderIconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 28px;
  width: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  color: ${Colors.GREY_8};

  &:hover:not(:disabled) {
    background-color: ${Colors.GREY_2};
  }

  &:focus-visible {
    outline: 2px solid var(--wds-accent-color, ${Colors.GREY_8});
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

/**
 * Styles the overflow menu items with the panel-configured text and
 * background colors (MenuButtonWidget's BaseMenuItem pattern).
 */
const BaseMenuItem = styled(BlueprintMenuItem)<{
  $backgroundColor?: string;
  $textColor?: string;
}>`
  font-family: var(--wds-font-family);

  ${({ $backgroundColor }) =>
    $backgroundColor
      ? `
      background-color: ${$backgroundColor} !important;
      &:hover {
        background-color: ${darkenHover($backgroundColor)} !important;
      }
      &:active {
        background-color: ${darkenActive($backgroundColor)} !important;
      }
  `
      : ""}
  ${({ $textColor }) =>
    $textColor
      ? `
      color: ${$textColor} !important;
  `
      : ""}
`;

const BodyWrapper = styled.div<{ $shouldScrollContents: boolean }>`
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  ${({ $shouldScrollContents }) => ($shouldScrollContents ? scrollCSS : "")}
`;

const FooterWrapper = styled.div<{ $showDivider: boolean }>`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  gap: 8px;
  height: ${CARD_FOOTER_HEIGHT}px;
  padding: 0 12px;
  border-top: ${({ $showDivider }) =>
    $showDivider ? `1px solid ${Colors.GREY_4}` : "none"};

  & > * {
    height: 32px;
  }
`;

export interface CardComponentProps {
  widgetId: string;
  children?: ReactNode;

  // Media
  mediaImage?: string;
  mediaAltText?: string;
  mediaPosition: MediaPosition;
  mediaHeight?: number;
  mediaObjectFit?: MediaObjectFit;

  // Header
  showHeader: boolean;
  avatarImage?: string;
  avatarIcon?: CardMenuItem["iconName"];
  title?: string;
  subtitle?: string;
  badgeText?: string;
  badgeColor?: string;
  menuItems: CardMenuItem[];

  // Footer
  showFooter: boolean;
  footerActions: CardFooterAction[];

  // Interaction
  isClickable: boolean;
  isDisabled?: boolean;
  onCardClick?: () => void;
  onFooterActionClick: (onClick?: string) => void;
  onMenuItemClick: (onClick?: string) => void;

  // Selection
  selectionEnabled?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;

  // Expansion
  expandCollapseEnabled?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;

  // Loading
  isLoading?: boolean;

  // Style
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string;
  borderRadius?: string;
  boxShadow?: string;
  showHeaderDivider: boolean;
  showFooterDivider: boolean;
  hoverElevation: boolean;
  selectedAccentColor?: string;
  shouldScrollContents: boolean;
}

function CardMedia(props: {
  mediaImage: string;
  mediaAltText?: string;
  mediaPosition: MediaPosition;
  mediaHeight: number;
  mediaObjectFit: MediaObjectFit;
  isLoading?: boolean;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(
    function resetBrokenImageStateOnUrlChange() {
      setHasError(false);
    },
    [props.mediaImage],
  );

  const onError = useCallback(() => setHasError(true), []);

  return (
    <MediaWrapper
      $height={props.mediaHeight}
      $position={props.mediaPosition}
      className={props.isLoading ? SKELETON_CLASS : ""}
      data-card-zone="media"
    >
      {hasError ? (
        <MediaFallback data-testid="t--card-media-error">
          <Icon icon="media" iconSize={16} />
          {createMessage(IMAGE_LOAD_ERROR)}
        </MediaFallback>
      ) : (
        <MediaImage
          $objectFit={props.mediaObjectFit}
          alt={props.mediaAltText || ""}
          onError={onError}
          src={props.mediaImage}
        />
      )}
    </MediaWrapper>
  );
}

function CardMenuListItem(props: {
  item: CardMenuItem;
  onMenuItemClick: (onClick?: string) => void;
}) {
  const { item, onMenuItemClick } = props;

  const handleClick = useCallback(
    () => onMenuItemClick(item.onClick),
    [item.onClick, onMenuItemClick],
  );

  const iconElement = item.iconName ? (
    <Icon color={item.iconColor} icon={item.iconName} />
  ) : null;
  const leftIcon = item.iconAlign !== Alignment.RIGHT ? iconElement : null;
  const rightIcon = item.iconAlign === Alignment.RIGHT ? iconElement : null;

  return (
    <BaseMenuItem
      $backgroundColor={item.backgroundColor}
      $textColor={item.textColor}
      disabled={item.isDisabled}
      icon={leftIcon}
      labelElement={rightIcon}
      onClick={handleClick}
      text={item.label}
    />
  );
}

function CardFooterActionButton(props: {
  action: CardFooterAction;
  borderRadius?: string;
  isDisabled?: boolean;
  onFooterActionClick: (onClick?: string) => void;
}) {
  const { action, borderRadius, isDisabled, onFooterActionClick } = props;

  const handleClick = useCallback(
    () => onFooterActionClick(action.onClick),
    [action.onClick, onFooterActionClick],
  );

  return (
    <BaseButton
      borderRadius={borderRadius}
      buttonColor={action.buttonColor}
      buttonVariant={action.buttonVariant}
      disabled={isDisabled || action.isDisabled}
      iconAlign={action.iconAlign}
      iconName={action.iconName}
      onClick={handleClick}
      text={action.label}
    />
  );
}

function CardHeader(props: {
  avatarImage?: string;
  avatarIcon?: CardMenuItem["iconName"];
  title?: string;
  subtitle?: string;
  badgeText?: string;
  badgeColor?: string;
  bodyElementId: string;
  menuItems: CardMenuItem[];
  showDivider: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  expandCollapseEnabled?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onMenuItemClick: (onClick?: string) => void;
}) {
  const {
    avatarIcon,
    avatarImage,
    expandCollapseEnabled,
    isDisabled,
    isExpanded,
    menuItems,
    onMenuItemClick,
    onToggleExpand,
  } = props;

  const menuContent = useMemo(
    () => (
      <Menu>
        {menuItems.map((item) => (
          <CardMenuListItem
            item={item}
            key={item.id}
            onMenuItemClick={onMenuItemClick}
          />
        ))}
      </Menu>
    ),
    [menuItems, onMenuItemClick],
  );

  const handleToggleExpand = useCallback(() => {
    onToggleExpand?.();
  }, [onToggleExpand]);

  return (
    <HeaderWrapper
      $showDivider={props.showDivider}
      className={props.isLoading ? SKELETON_CLASS : ""}
      data-card-zone="header"
    >
      {avatarImage ? (
        <AvatarImage alt="" src={avatarImage} />
      ) : avatarIcon ? (
        <AvatarIconWrapper>
          <Icon icon={avatarIcon} iconSize={16} />
        </AvatarIconWrapper>
      ) : null}
      <TitleBlock>
        {!!props.title && <Title>{props.title}</Title>}
        {!!props.subtitle && <Subtitle>{props.subtitle}</Subtitle>}
      </TitleBlock>
      {!!props.badgeText && (
        <Badge $badgeColor={props.badgeColor}>{props.badgeText}</Badge>
      )}
      {expandCollapseEnabled && (
        <HeaderIconButton
          aria-controls={props.bodyElementId}
          aria-expanded={!!isExpanded}
          aria-label={createMessage(CARD_WIDGET_EXPAND_BUTTON_ARIA_LABEL)}
          data-card-zone="expand"
          data-testid="t--card-expand-toggle"
          disabled={isDisabled}
          onClick={handleToggleExpand}
          type="button"
        >
          <Icon
            icon={isExpanded ? "chevron-up" : "chevron-down"}
            iconSize={16}
          />
        </HeaderIconButton>
      )}
      {menuItems.length > 0 && (
        <Popover2
          content={menuContent}
          disabled={isDisabled}
          minimal
          placement="bottom-end"
        >
          <HeaderIconButton
            aria-haspopup="menu"
            aria-label={createMessage(CARD_WIDGET_MENU_BUTTON_ARIA_LABEL)}
            data-card-zone="menu"
            disabled={isDisabled}
            type="button"
          >
            <Icon icon="more" iconSize={16} />
          </HeaderIconButton>
        </Popover2>
      )}
    </HeaderWrapper>
  );
}

function CardComponent(props: CardComponentProps) {
  const {
    expandCollapseEnabled,
    footerActions,
    isClickable,
    isDisabled,
    mediaImage,
    mediaPosition,
    onCardClick,
    onFooterActionClick,
    onToggleSelection,
    selectionEnabled,
    showFooter,
    showHeader,
  } = props;

  const hasMedia =
    mediaPosition !== MediaPositionTypes.NONE && Boolean(mediaImage);
  const isHorizontal = hasMedia && mediaPosition === MediaPositionTypes.LEFT;
  // The widget computes the effective expanded state (CardWidget
  // .isCardExpanded) and passes it down; the component only defaults
  // an absent value to expanded.
  const isExpanded = props.isExpanded !== false;
  const hasFooter = showFooter && footerActions.length > 0 && isExpanded;

  // Selection takes precedence over the clickable behavior.
  const isInteractive =
    !isDisabled && (Boolean(selectionEnabled) || isClickable);

  // Stable id for the collapsible body region, referenced by the
  // chevron's aria-controls.
  const bodyElementId = `card-body-${props.widgetId}`;

  const activateCard = useCallback(() => {
    if (isDisabled) return;

    if (selectionEnabled) {
      onToggleSelection?.();

      return;
    }

    if (isClickable) {
      onCardClick?.();
    }
  }, [
    isDisabled,
    selectionEnabled,
    onToggleSelection,
    isClickable,
    onCardClick,
  ]);

  /**
   * Fires the card activation (selection toggle or onCardClick) only for
   * clicks on the card chrome itself. Clicks originating from the body
   * canvas (child widgets), footer actions, the expand toggle, or the
   * overflow menu (incl. its portal) are ignored.
   */
  const handleCardClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!isInteractive) return;

      const target = e.target as HTMLElement;
      const currentTarget = e.currentTarget as HTMLElement;

      // Events bubbling through React portals (e.g. the overflow menu
      // popover) have targets outside the card's DOM subtree.
      if (!currentTarget.contains(target)) return;

      // Ignore clicks inside interactive zones.
      if (
        target.closest(
          '[data-card-zone="body"], [data-card-zone="footer"], [data-card-zone="menu"], [data-card-zone="expand"]',
        )
      ) {
        return;
      }

      activateCard();
    },
    [isInteractive, activateCard],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (!isInteractive) return;

      // Only react to keys pressed on the card itself, not on focusable
      // descendants (buttons, inputs inside the body canvas, etc.)
      if (e.target !== e.currentTarget) return;

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activateCard();
      }
    },
    [isInteractive, activateCard],
  );

  const content = (
    <ContentColumn>
      {showHeader && (
        <CardHeader
          avatarIcon={props.avatarIcon}
          avatarImage={props.avatarImage}
          badgeColor={props.badgeColor}
          badgeText={props.badgeText}
          bodyElementId={bodyElementId}
          expandCollapseEnabled={expandCollapseEnabled}
          isDisabled={isDisabled}
          isExpanded={isExpanded}
          isLoading={props.isLoading}
          menuItems={props.menuItems}
          onMenuItemClick={props.onMenuItemClick}
          onToggleExpand={props.onToggleExpand}
          showDivider={props.showHeaderDivider}
          subtitle={props.subtitle}
          title={props.title}
        />
      )}
      {isExpanded && (
        <BodyWrapper
          $shouldScrollContents={props.shouldScrollContents}
          className={`${
            props.shouldScrollContents ? getCanvasClassName() : ""
          } ${generateClassName(props.widgetId)}`}
          data-card-zone="body"
          id={bodyElementId}
        >
          {props.children}
        </BodyWrapper>
      )}
      {hasFooter && (
        <FooterWrapper
          $showDivider={props.showFooterDivider}
          className={props.isLoading ? SKELETON_CLASS : ""}
          data-card-zone="footer"
        >
          {footerActions.map((action) => (
            <CardFooterActionButton
              action={action}
              borderRadius={props.borderRadius}
              isDisabled={isDisabled}
              key={action.id}
              onFooterActionClick={onFooterActionClick}
            />
          ))}
        </FooterWrapper>
      )}
    </ContentColumn>
  );

  return (
    <CardArticle
      $backgroundColor={props.backgroundColor}
      $borderColor={props.borderColor}
      $borderRadius={props.borderRadius}
      $borderWidth={props.borderWidth}
      $boxShadow={props.boxShadow}
      $horizontal={isHorizontal}
      $hoverElevation={props.hoverElevation}
      $isDisabled={isDisabled}
      $isInteractive={isInteractive}
      $isSelected={selectionEnabled && props.isSelected}
      $selectedAccentColor={props.selectedAccentColor}
      aria-disabled={isDisabled || undefined}
      aria-label={isInteractive ? props.title || undefined : undefined}
      aria-pressed={selectionEnabled ? !!props.isSelected : undefined}
      data-card-zone="card"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      {hasMedia && (
        <CardMedia
          isLoading={props.isLoading}
          mediaAltText={props.mediaAltText}
          mediaHeight={props.mediaHeight || DEFAULT_MEDIA_HEIGHT}
          mediaImage={mediaImage as string}
          mediaObjectFit={props.mediaObjectFit || "cover"}
          mediaPosition={mediaPosition}
        />
      )}
      {content}
    </CardArticle>
  );
}

export default CardComponent;
