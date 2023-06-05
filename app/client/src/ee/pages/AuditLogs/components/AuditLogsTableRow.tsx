import React, { useState } from "react";
import { CollapsibleLog as Collapsible } from "@appsmith/pages/AuditLogs/components/CollapsibleLog";
import type { AuditLogType } from "../types";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAuditLogsLogsInit as fetchLogsInit,
  markAuditLogClose as markClose,
  markAuditLogOpen as markOpen,
  setEmailJsonFilter as setEmail,
} from "@appsmith/actions/auditLogsAction";
import { iconisedDescription } from "../utils/description";
import {
  StyledDateColumnContainer as Date,
  StyledDateInfoContainer as DateInfoContainer,
  StyledEventDescriptionColumnContainer as DescriptionContainer,
  StyledDescriptionRow as DescriptionRow,
  StyledDescriptionContainer as Description,
  StyledMainDescription as MainDescription,
  StyledSubDescription as SubDescription,
  StyledUserColumnContainer as User,
  StyledProfileData as ProfileData,
} from "../styled-components/table";
import { selectAuditLogsSearchFilters as getFilters } from "@appsmith/selectors/auditLogsSelectors";
import { reduxToUI } from "../utils/reduxToUI";
import { StyledAuditLogsTableRowContainer as Row } from "../styled-components/container";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { toUserEmail } from "../utils/toDropdownOption";
import { ellipsis } from "../utils/ellipsis";
import { Icon, Text } from "design-system";
import { AvatarComponent } from "pages/common/AvatarComponent";

interface AuditLogsTableRow {
  className: string;
  id: string;
  log: AuditLogType;
}

export default function AuditLogsTableRow({
  className,
  id,
  log,
}: AuditLogsTableRow) {
  const [isOpen, setIsOpen] = useState(!!log.isOpen);
  const dispatch = useDispatch();
  const { description, hasDescriptiveIcon, icon } = iconisedDescription(log);
  const [iconName, iconFillColor] = icon;
  const searchFilters = useSelector(getFilters);
  const [logDate, logTime] = log?.timestamp.split(", ") || ["", ""];

  /**
   * Fetches the logs for selectedEmails including
   * the clicked email value.
   * It is done by setting value in redux store,
   * and making a separate fetch logs call.
   * Why: dispatch calls are fired in same cycle,
   * and the data is not fresh by the time it is stored.
   * Thus need for maintaining a local variable.
   * This pattern is repeated everywhere in audit-logs feature.
   */
  function handleEmailClick() {
    /* create email object */
    const email = toUserEmail(log?.user?.email);
    /* update searchFilters */
    dispatch(setEmail({ email }));
    /* make network request */
    searchFilters.selectedEmails.push(email);
    /* now fetch the logs */
    dispatch(fetchLogsInit(searchFilters));
  }

  function handleExpansion() {
    if (isOpen) {
      dispatch(markClose(log));

      AnalyticsUtil.logEvent("AUDIT_LOGS_COLLAPSIBLE_ROW_CLOSED");
    } else {
      dispatch(markOpen(log));

      AnalyticsUtil.logEvent("AUDIT_LOGS_COLLAPSIBLE_ROW_OPENED");
    }
    setIsOpen(!isOpen);
  }

  return (
    <div
      className={className}
      data-testid="t--audit-logs-table-row-container"
      id={id}
    >
      <Row
        className="audit-logs-table-row"
        data-testid="t--audit-logs-table-row"
        isOpen={isOpen}
      >
        <DescriptionContainer
          data-testid="t--audit-logs-table-row-description"
          onClick={handleExpansion}
        >
          <DescriptionRow>
            <Icon
              name={"right-arrow-2"}
              size="md"
              style={{
                display: "inline-block",
                marginRight: "12px",
                transform: isOpen ? "rotate(90deg)" : "",
                position: "relative",
                top: "3px",
                zIndex: -1,
              }}
            />

            {hasDescriptiveIcon ? (
              <Icon
                color={iconFillColor}
                name={iconName}
                size="md"
                style={{
                  display: "inline-block",
                  marginRight: "12px",
                  position: "relative",
                  top: "3px",
                }}
              />
            ) : null}
            <Description>
              <MainDescription data-testid="t--audit-logs-table-row-description-content">
                {description.mainDescription.resourceType}{" "}
                <Text className="action-type">
                  {description.mainDescription.actionType}
                </Text>
              </MainDescription>
              <SubDescription renderAs="p">
                {description.subDescription}
              </SubDescription>
            </Description>
          </DescriptionRow>
        </DescriptionContainer>
        <User onClick={handleEmailClick}>
          <AvatarComponent
            label="audit-logs-user-avatar"
            size="md"
            userName={log?.user?.name || log?.user?.email || "No Name"}
          />
          <ProfileData>
            {log?.user?.id && log?.user?.name && (
              <Text className="event-user name" kind="body-m" renderAs="p">
                {ellipsis(log?.user?.name)}
              </Text>
            )}
            <Text
              className="event-user"
              kind={log?.user?.name ? "body-s" : "body-m"}
              renderAs="p"
            >
              {ellipsis(log?.user?.email)}
            </Text>
          </ProfileData>
        </User>
        <Date>
          <DateInfoContainer>
            <Text kind="body-m" renderAs="p">
              {logDate || ""}
            </Text>
            <Text className="time" kind="body-m" renderAs="p">
              {logTime || ""}
            </Text>
          </DateInfoContainer>
        </Date>
      </Row>
      <Collapsible
        isOpen={isOpen}
        key={`collapsible-log-key-${log.id}`}
        log={reduxToUI(log)}
      />
    </div>
  );
}
