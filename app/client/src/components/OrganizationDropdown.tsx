import { Avatar, Icon } from "@appsmith/ads";
import type { Organization } from "ee/api/OrganizationApi";
import { createMessage, PENDING_INVITATIONS } from "ee/constants/messages";
import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";

const DropdownContainer = styled.div`
  position: relative;
  width: 100%;
  margin: var(--ads-v2-spaces-3) 0;
`;

const DropdownTrigger = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--ads-v2-spaces-3) var(--ads-v2-spaces-4);
  background: var(--ads-v2-color-bg);
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  cursor: pointer;
  font-size: 14px;
  font-weight: 400;
  color: var(--ads-v2-color-fg);
  transition: all 0.2s ease;
  min-height: 40px;
`;

const TriggerContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-3);
  min-width: 0;
  flex: 1;
`;

const TriggerText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  right: 0;
  background: var(--ads-v2-color-bg);
  padding: var(--ads-v2-spaces-2);
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  box-shadow: var(--ads-v2-shadow-popovers);
  z-index: var(--ads-v2-z-index-7);
  max-height: 320px;
  overflow-y: auto;
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  visibility: ${({ isOpen }) => (isOpen ? "visible" : "hidden")};
  transform: ${({ isOpen }) => (isOpen ? "translateY(0)" : "translateY(-8px)")};
  transition: all 0.2s ease;
`;

const MenuItem = styled.div<{
  isSelected?: boolean;
}>`
  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-3);
  padding: var(--ads-v2-spaces-3) var(--ads-v2-spaces-4);
  margin-bottom: var(--ads-v2-spaces-2);
  border-radius: var(--ads-v2-border-radius);
  cursor: ${({ isSelected }) => (isSelected ? "default" : "pointer")};
  font-size: 14px;
  color: var(--ads-v2-color-fg);
  background: ${({ isSelected }) =>
    isSelected ? "var(--ads-v2-color-bg-muted)" : "transparent"};

  .hover-icon {
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover {
    background: ${({ isSelected }) =>
      isSelected
        ? "var(--ads-v2-color-bg-muted)"
        : "var(--ads-v2-color-bg-subtle)"};

    .hover-icon {
      opacity: ${({ isSelected }) => (isSelected ? 0 : 1)};
    }
  }

  &:focus {
    outline: none;
    background: ${({ isSelected }) =>
      isSelected
        ? "var(--ads-v2-color-bg-muted)"
        : "var(--ads-v2-color-bg-subtle)"};

    .hover-icon {
      opacity: ${({ isSelected }) => (isSelected ? 0 : 1)};
    }
  }
`;

const MenuItemIcon = styled(Icon)`
  color: var(--ads-v2-color-fg-muted);
  flex-shrink: 0;
`;

const MenuItemText = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  min-width: 0;
`;

const SectionDivider = styled.div`
  height: 1px;
  background: var(--ads-v2-color-border);
  margin: var(--ads-v2-spaces-2) 0;
`;

const SectionHeader = styled.div`
  padding: var(--ads-v2-spaces-2) var(--ads-v2-spaces-4);
  font-size: 14px;
  font-weight: 500;
  color: var(--ads-v2-color-fg-muted);
`;

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
