import React, { useState } from "react";
import { CollapsibleLog as Collapsible } from "@appsmith/pages/AuditLogs/components/CollapsibleLog";
import { AuditLogType } from "../types";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAuditLogsLogsInit as fetchLogsInit,
  markAuditLogClose as markClose,
  markAuditLogOpen as markOpen,
  setEmailJsonFilter as setEmail,
} from "@appsmith/actions/auditLogsAction";
import { Icon, IconSize } from "design-system-old";
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
import ProfileImage from "../../../../pages/common/ProfileImage";
import { ellipsis } from "../utils/ellipsis";

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
              keepColors
              name={"right-arrow-2"}
              size={IconSize.XL}
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
                fillColor={iconFillColor}
                name={iconName}
                size={IconSize.XL}
                style={{
                  display: "inline-block",
                  marginRight: "12px",
                  position: "relative",
                  top: "3px",
                }}
              />
            ) : null}
            <Description>
              <MainDescription>
                {description.mainDescription.resourceType}{" "}
                <span>{description.mainDescription.actionType}</span>
              </MainDescription>
              <SubDescription>
                <div>{description.subDescription}</div>
              </SubDescription>
            </Description>
          </DescriptionRow>
        </DescriptionContainer>
        <User onClick={handleEmailClick}>
          <ProfileImage
            size={34}
            userName={log?.user?.name || log?.user?.email || "No Name"}
          />
          <ProfileData>
            {log?.user?.id && log?.user?.name && (
              <div className="event-user name">{ellipsis(log?.user?.name)}</div>
            )}
            <div className="event-user">{ellipsis(log?.user?.email)}</div>
          </ProfileData>
        </User>
        <Date>
          <DateInfoContainer>
            <div>{logDate || ""}</div>
            <div className="time">{logTime || ""}</div>
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
