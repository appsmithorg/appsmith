import React, { useEffect } from "react";
import { Popover, Position } from "@blueprintjs/core";

import DocumentationSearch from "components/designSystems/appsmith/help/DocumentationSearch";

import { HELP_MODAL_WIDTH } from "constants/HelpConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getCurrentUser } from "selectors/usersSelectors";
import { useSelector } from "react-redux";
import bootIntercom from "utils/bootIntercom";
import {
  createMessage,
  HELP_RESOURCE_TOOLTIP,
} from "@appsmith/constants/messages";
import { useCallback } from "react";
import { useState } from "react";
import { Button, Tooltip } from "design-system";

function HelpButton() {
  const user = useSelector(getCurrentUser);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    bootIntercom(user);
  }, [user?.email]);

  const onOpened = useCallback(() => {
    AnalyticsUtil.logEvent("OPEN_HELP", { page: "Editor" });
    setIsHelpOpen(true);
  }, [isHelpOpen]);

  const onClose = useCallback(() => {
    setIsHelpOpen(false);
  }, []);

  return (
    <Tooltip
      content={createMessage(HELP_RESOURCE_TOOLTIP)}
      // disabled={isHelpOpen}
      placement="bottom"
    >
      <Popover
        minimal
        modifiers={{
          offset: {
            enabled: true,
            offset: "0, 6",
          },
        }}
        onClosed={onClose}
        onOpened={onOpened}
        popoverClassName="navbar-help-popover"
        position={Position.BOTTOM_RIGHT}
      >
        <Button kind="tertiary" size="md" startIcon="question-line">
          Help
        </Button>
        <div style={{ width: HELP_MODAL_WIDTH }}>
          <DocumentationSearch hideMinimizeBtn hideSearch hitsPerPage={4} />
        </div>
      </Popover>
    </Tooltip>
  );
}

export default HelpButton;
