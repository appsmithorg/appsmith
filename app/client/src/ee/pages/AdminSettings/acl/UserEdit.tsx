import React, { useState, useEffect } from "react";
import { useHistory } from "react-router";
import styled from "styled-components";
import { Position } from "@blueprintjs/core";
import debounce from "lodash/debounce";
import {
  IconSize,
  MenuItemProps,
  SearchVariant,
  Toaster,
  Variant,
} from "components/ads";
import { Icon, Menu, MenuItem } from "components/ads";
import ProfileImage from "pages/common/ProfileImage";
import { TabComponent, TabProp } from "components/ads/Tabs";
import { ActiveAllGroupsList } from "./ActiveAllGroupsList";
import {
  TabsWrapper,
  HelpPopoverStyle,
  BackButton,
  StyledSearchInput,
  SaveButtonBar,
} from "./components";
import { ARE_YOU_SURE, createMessage } from "@appsmith/constants/messages";

type UserProps = {
  isChangingRole: boolean;
  isCurrentUser: boolean;
  isDeleting: boolean;
  name: string;
  allRoles: Array<string>;
  username: string;
  userId: string;
  roleName?: string;
};

type UserEditProps = {
  selectedUser: UserProps;
  onDelete: (userId: string) => void;
  searchPlaceholder: string;
};

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .actions-icon {
    > svg {
      path {
        fill: var(--appsmith-color-black-400);
      }

      &:hover {
        path {
          fill: var(--appsmith-color-black-700);
        }
      }
    }
  }
`;

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .acl-search-input {
    margin-right: 12px;
  }
`;

const User = styled.div`
  display: flex;
  align-items: center;

  .user-icons {
    cursor: auto;
  }
`;

const Username = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 16px;
`;

const Name = styled.div`
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.24px;
  margin-bottom: 4px;
`;

const Email = styled.div`
  letter-spacing: -0.24px;
  font-weight: 400;
  font-size: 13px;
  line-height: 17px;
`;

export function UserEdit(props: UserEditProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [showConfirmationText, setShowConfirmationText] = useState(false);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const history = useHistory();
  const [data, setData] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [removedActiveGroups, setRemovedActiveGroups] = useState<Array<any>>(
    [],
  );
  const [isSaving, setIsSaving] = useState(false);
  const { searchPlaceholder, selectedUser } = props;

  useEffect(() => {
    setData(selectedUser.allRoles);
  }, []);

  useEffect(() => {
    setIsSaving(removedActiveGroups.length > 0);
  }, [removedActiveGroups]);

  const onRemoveGroup = (group: any) => {
    const updateGroups = removedActiveGroups.includes(group)
      ? removedActiveGroups.filter((grp) => grp !== group)
      : [...removedActiveGroups, group];
    setRemovedActiveGroups(updateGroups);
  };

  const onSaveChanges = () => {
    const updatedGroups = selectedUser.allRoles.filter(
      (role) => !removedActiveGroups.includes(role),
    );
    setData(updatedGroups);
    setRemovedActiveGroups([]);
    Toaster.show({
      text: "Successfully Saved",
      variant: Variant.success,
    });
  };

  const onClearChanges = () => {
    setRemovedActiveGroups([]);
  };

  const tabs: TabProp[] = [
    {
      key: "user-groups",
      title: "User Groups",
      panelComponent: (
        <ActiveAllGroupsList
          activeGroups={data}
          activeOnly
          onRemoveGroup={onRemoveGroup}
          removedActiveGroups={removedActiveGroups}
          searchValue={searchValue}
        />
      ),
    },
  ];

  const onDeleteHanlder = () => {
    if (showConfirmationText) {
      props.onDelete(selectedUser.userId);
      history.push(`/settings/users`);
    } else {
      setShowOptions(true);
      setShowConfirmationText(true);
    }
  };

  const menuItems: MenuItemProps[] = [
    {
      className: "delete-menu-item",
      icon: "delete-blank",
      onSelect: () => {
        onDeleteHanlder();
      },
      text: "Delete User",
    },
  ];

  const handleSearch = debounce((search: string) => {
    if (search && search.trim().length > 0) {
      setSearchValue(search);
      const results =
        selectedUser.allRoles &&
        selectedUser.allRoles.filter((role) =>
          role?.toLocaleUpperCase().includes(search.toLocaleUpperCase()),
        );
      setData(results);
    } else {
      setSearchValue("");
      setData(selectedUser.allRoles);
    }
  }, 300);

  return (
    <div data-testid="t--user-edit-wrapper">
      <BackButton />
      <Header>
        <User data-testid="t--user-edit-userInfo">
          <ProfileImage
            className="user-icons"
            size={64}
            source={`/api/v1/users/photo/${selectedUser.username}`}
            userName={selectedUser.username}
          />
          <Username>
            {selectedUser?.name && <Name>{selectedUser.name}</Name>}
            <Email>{selectedUser?.username}</Email>
          </Username>
        </User>
        <Container>
          <StyledSearchInput
            className="acl-search-input"
            data-testid={"t--acl-search-input"}
            onChange={handleSearch}
            placeholder={searchPlaceholder}
            variant={SearchVariant.BACKGROUND}
            width={"376px"}
          />
          <Menu
            canEscapeKeyClose
            canOutsideClickClose
            className="t--menu-actions-icon"
            isOpen={showOptions}
            menuItemWrapperWidth={"auto"}
            onClose={() => setShowOptions(false)}
            onClosing={() => {
              setShowConfirmationText(false);
              setShowOptions(false);
            }}
            onOpening={() => setShowOptions(true)}
            position={Position.BOTTOM_RIGHT}
            target={
              <Icon
                className="actions-icon"
                data-testid="actions-cell-menu-icon"
                name="more-2-fill"
                onClick={() => setShowOptions(!showOptions)}
                size={IconSize.XXL}
              />
            }
          >
            <HelpPopoverStyle />
            {menuItems &&
              menuItems.map((menuItem) => (
                <MenuItem
                  className={menuItem.className}
                  icon={menuItem.icon}
                  key={menuItem.text}
                  onSelect={menuItem.onSelect}
                  text={
                    showConfirmationText
                      ? createMessage(ARE_YOU_SURE)
                      : menuItem.text
                  }
                  {...(showConfirmationText ? { type: "warning" } : {})}
                />
              ))}
          </Menu>
        </Container>
      </Header>
      <TabsWrapper data-testid="t--user-edit-tabs-wrapper">
        <TabComponent
          onSelect={setSelectedTabIndex}
          selectedIndex={selectedTabIndex}
          tabs={tabs}
        />
      </TabsWrapper>
      {isSaving && (
        <SaveButtonBar onClear={onClearChanges} onSave={onSaveChanges} />
      )}
    </div>
  );
}
