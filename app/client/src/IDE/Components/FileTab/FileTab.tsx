import React from "react";

import clsx from "classnames";

import { Icon } from "@appsmith/ads";
import { sanitizeString } from "utils/URLUtils";

import * as Styled from "./styles";
import { DATA_TEST_ID } from "./constants";

export interface FileTabProps {
  isActive: boolean;
  title: string;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  onDoubleClick?: () => void;
}

export const FileTab = ({
  children,
  isActive,
  onClick,
  onClose,
  onDoubleClick,
  title,
}: FileTabProps) => {
  return (
    <Styled.Tab
      className={clsx("editor-tab", isActive && "active")}
      data-testid={`t--ide-tab-${sanitizeString(title)}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {children}
      <Styled.CloseButton
        aria-label="Close tab"
        className="tab-close"
        data-testid={DATA_TEST_ID.CLOSE_BUTTON}
        onClick={onClose}
      >
        <Icon name="close-line" />
      </Styled.CloseButton>
    </Styled.Tab>
  );
};
