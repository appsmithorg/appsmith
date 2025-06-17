import { Avatar, Icon } from "@appsmith/ads";
import { createMessage, PENDING_INVITATIONS } from "ce/constants/messages";
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

  &:hover {
    border-color: var(--ads-v2-color-border-emphasis);
    background: var(--ads-v2-color-bg-subtle);
  }

  &:focus {
    outline: none;
    box-shadow: var(--ads-v2-shadow-outline);
  }
`;

const TriggerContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-3);
  min-width: 0;
  flex: 1;
`;

const TriggerText = styled.span`
  truncate: true;
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
  truncate: true;
  font-size: 14px;
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

export interface Organization {
  id: string;
  name: string;
  isCurrent?: boolean;
}

export interface PendingInvitation {
  id: string;
  organizationName: string;
}

export interface OrganizationDropdownProps {
  selectedOrganization: Organization;
  organizations: Organization[];
  pendingInvitations?: PendingInvitation[];
  onOrganizationSelect: (organization: Organization) => void;
  "data-testid"?: string;
}

const OrganizationDropdown: React.FC<OrganizationDropdownProps> = ({
  selectedOrganization,
  organizations = [],
  pendingInvitations = [],
  onOrganizationSelect,
  "data-testid": testId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const generateInitials = (username: string): string => {
    if (!username) return "A";
    return username.charAt(0).toUpperCase();
  };

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSelect = useCallback(
    (organization: Organization) => {
      onOrganizationSelect(organization);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [onOrganizationSelect],
  );

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
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const displayText = selectedOrganization?.name;

  const renderOrgAvatar = (orgName: string) => {
    return (
      <Avatar
        label={generateInitials(orgName)}
        firstLetter={generateInitials(orgName)}
        size="sm"
      />
    );
  };

  return (
    <DropdownContainer ref={dropdownRef} data-testid={testId}>
      <DropdownTrigger
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Current organization: ${displayText}`}
      >
        <TriggerContent>
          {renderOrgAvatar(displayText)}
          <TriggerText>{displayText}</TriggerText>
        </TriggerContent>
        <Icon name="dropdown" size="md" />
      </DropdownTrigger>

      <DropdownMenu isOpen={isOpen} role="listbox" aria-label="Organizations">
        {organizations.map((org) => {
          const isSelected = org.id === selectedOrganization?.id;
          return (
            <MenuItem
              key={org.id}
              role="option"
              tabIndex={0}
              isSelected={isSelected}
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
              aria-selected={isSelected}
            >
              {renderOrgAvatar(org.name)}
              <MenuItemText>
                {org.name} {org.isCurrent && "(current)"}
              </MenuItemText>

              {!isSelected && (
                <MenuItemIcon
                  name="share-box-line"
                  size="md"
                  className="hover-icon color-fg-muted"
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
              <MenuItem key={invitation.id} role="option">
                {renderOrgAvatar(invitation.organizationName)}
                <MenuItemText>{invitation.organizationName}</MenuItemText>

                <MenuItemIcon
                  name="share-box-line"
                  size="md"
                  className="hover-icon color-fg-muted"
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
