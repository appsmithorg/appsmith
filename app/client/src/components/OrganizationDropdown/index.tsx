import { Avatar, Icon } from "@appsmith/ads";
import type { Organization } from "ee/api/OrganizationApi";
import { createMessage, PENDING_INVITATIONS } from "ee/constants/messages";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  DropdownContainer,
  DropdownMenu,
  DropdownTrigger,
  MenuItem,
  MenuItemIcon,
  MenuItemText,
  SectionDivider,
  SectionHeader,
  TriggerContent,
  TriggerText,
} from "./styles";

export interface PendingInvitation {
  id: string;
  organizationName: string;
}

export interface OrganizationDropdownProps {
  "data-testid"?: string;
  organizations: Organization[];
  selectedOrganization: Organization;
}

const OrganizationDropdown: React.FC<OrganizationDropdownProps> = ({
  "data-testid": testId,
  organizations = [],
  selectedOrganization,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const safeOrganizations = organizations || [];
  const activeOrganizations = safeOrganizations.filter(
    (org) => org.state === "ACTIVE",
  );
  const pendingInvitations = safeOrganizations.filter(
    (org) => org.state === "INVITED",
  );

  const generateInitials = (name: string): string => {
    if (!name) return "";

    return name.charAt(0).toUpperCase();
  };

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSelect = useCallback((organization: Organization) => {
    if (organization.organizationUrl) {
      const url = `https://${organization.organizationUrl}`;

      window.open(url, "_blank", "noopener,noreferrer");
    }

    setIsOpen(false);
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const displayText = selectedOrganization?.organizationName;

  const renderOrgAvatar = (orgName: string) => {
    return (
      <Avatar
        firstLetter={generateInitials(orgName)}
        label={generateInitials(orgName)}
        size="sm"
      />
    );
  };

  return (
    <DropdownContainer data-testid={testId} ref={dropdownRef}>
      <DropdownTrigger
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Current organization: ${displayText}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        ref={triggerRef}
        type="button"
      >
        <TriggerContent>
          {renderOrgAvatar(displayText)}
          <TriggerText>{displayText}</TriggerText>
        </TriggerContent>
        <Icon name="dropdown" size="md" />
      </DropdownTrigger>

      <DropdownMenu aria-label="Organizations" isOpen={isOpen} role="listbox">
        {activeOrganizations
          .slice()
          .sort((a, b) => {
            const aIsSelected =
              a.organizationId === selectedOrganization?.organizationId;

            const bIsSelected =
              b.organizationId === selectedOrganization?.organizationId;

            if (aIsSelected && !bIsSelected) return -1;

            if (!aIsSelected && bIsSelected) return 1;

            return 0;
          })
          .map((org) => {
            const isSelected =
              org.organizationId === selectedOrganization?.organizationId;

            return (
              <MenuItem
                aria-selected={isSelected}
                isSelected={isSelected}
                key={org.organizationId}
                onClick={!isSelected ? () => handleSelect(org) : undefined}
                onKeyDown={
                  !isSelected
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelect(org);
                        }
                      }
                    : undefined
                }
                role="option"
                tabIndex={0}
              >
                {renderOrgAvatar(org.organizationName)}
                <MenuItemText>
                  {org.organizationName}{" "}
                  {org.organizationId ===
                    selectedOrganization?.organizationId && "(current)"}
                </MenuItemText>

                {!isSelected && (
                  <MenuItemIcon
                    className="hover-icon color-fg-muted"
                    name="share-box-line"
                    size="md"
                  />
                )}
              </MenuItem>
            );
          })}

        {pendingInvitations.length > 0 && (
          <>
            <SectionDivider />
            <SectionHeader>{createMessage(PENDING_INVITATIONS)}</SectionHeader>
            {pendingInvitations.map((invitation) => (
              <MenuItem
                key={invitation.organizationId}
                onClick={() => handleSelect(invitation)}
                role="option"
              >
                {renderOrgAvatar(invitation.organizationName)}
                <MenuItemText>{invitation.organizationName}</MenuItemText>

                <MenuItemIcon
                  className="hover-icon color-fg-muted"
                  name="share-box-line"
                  size="md"
                />
              </MenuItem>
            ))}
          </>
        )}
      </DropdownMenu>
    </DropdownContainer>
  );
};

export default OrganizationDropdown;
