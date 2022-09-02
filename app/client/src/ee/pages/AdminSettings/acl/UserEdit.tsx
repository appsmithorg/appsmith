import React, { useState, useEffect } from "react";
import { useHistory } from "react-router";
import styled from "styled-components";
import { Position, Spinner } from "@blueprintjs/core";
import debounce from "lodash/debounce";
import { Toaster, Variant } from "components/ads";
import {
  Icon,
  IconSize,
  MenuItem,
  MenuItemProps,
  Menu,
  SearchVariant,
} from "design-system";
import ProfileImage from "pages/common/ProfileImage";
import { TabComponent, TabProp } from "components/ads/Tabs";
import { ActiveAllGroupsList } from "./ActiveAllGroupsList";
import {
  TabsWrapper,
  HelpPopoverStyle,
  StyledSearchInput,
  SaveButtonBar,
} from "./components";
import {
  ARE_YOU_SURE,
  createMessage,
  DELETE_USER,
  SUCCESSFULLY_SAVED,
} from "@appsmith/constants/messages";
import { BackButton } from "components/utils/helperComponents";
import { LoaderContainer } from "pages/Settings/components";

type UserProps = {
  isChangingRole: boolean;
  isDeleting: boolean;
  name: string;
  allGroups: Array<string>;
  allRoles: Array<string>;
  username: string;
  userId: string;
  roleName?: string;
};

type UserEditProps = {
  selectedUser: UserProps;
  onDelete: (userId: string) => void;
  searchPlaceholder: string;
  isLoading: boolean;
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
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [removedActiveUserGroups, setRemovedActiveUserGroups] = useState<
    Array<any>
  >([]);
  const [
    removedActivePermissionGroups,
    setRemovedActivePermissionGroups,
  ] = useState<Array<any>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { isLoading, searchPlaceholder, selectedUser } = props;

  useEffect(() => {
    setUserGroups(selectedUser.allGroups);
    setPermissionGroups(selectedUser.allRoles);
  }, [selectedUser]);

  useEffect(() => {
    setIsSaving(
      removedActiveUserGroups.length > 0 ||
        removedActivePermissionGroups.length > 0,
    );
  }, [removedActiveUserGroups, removedActivePermissionGroups]);

  const onRemoveGroup = (group: any) => {
    if (selectedTabIndex === 0) {
      const updateUserGroups = removedActiveUserGroups.includes(group)
        ? removedActiveUserGroups.filter((grp) => grp !== group)
        : [...removedActiveUserGroups, group];
      setRemovedActiveUserGroups(updateUserGroups);
    } else if (selectedTabIndex === 1) {
      const updatePermissionGroups = removedActivePermissionGroups.includes(
        group,
      )
        ? removedActivePermissionGroups.filter((grp) => grp !== group)
        : [...removedActivePermissionGroups, group];
      setRemovedActivePermissionGroups(updatePermissionGroups);
    }
  };

  const onSaveChanges = () => {
    const updatedUserGroups = selectedUser.allGroups.filter(
      (group) => !removedActiveUserGroups.includes(group),
    );
    setUserGroups(updatedUserGroups);
    const updatedPermissionGroups = selectedUser.allRoles.filter(
      (permission) => !removedActivePermissionGroups.includes(permission),
    );
    setPermissionGroups(updatedPermissionGroups);
    setRemovedActiveUserGroups([]);
    setRemovedActivePermissionGroups([]);
    Toaster.show({
      text: createMessage(SUCCESSFULLY_SAVED),
      variant: Variant.success,
    });
  };

  const onClearChanges = () => {
    setRemovedActiveUserGroups([]);
    setRemovedActivePermissionGroups([]);
  };

  const tabs: TabProp[] = [
    {
      key: "groups",
      title: "Groups",
      count: userGroups.length,
      panelComponent: (
        <ActiveAllGroupsList
          activeGroups={userGroups}
          activeOnly
          onRemoveGroup={onRemoveGroup}
          removedActiveGroups={removedActiveUserGroups}
          searchValue={searchValue}
          title="Active Groups"
        />
      ),
    },
    {
      key: "roles",
      title: "Roles",
      count: permissionGroups.length,
      panelComponent: (
        <ActiveAllGroupsList
          activeGroups={permissionGroups}
          activeOnly
          onRemoveGroup={onRemoveGroup}
          removedActiveGroups={removedActivePermissionGroups}
          searchValue={searchValue}
        />
      ),
    },
  ];

  const onDeleteHandler = () => {
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
        onDeleteHandler();
      },
      text: createMessage(DELETE_USER),
    },
  ];

  const handleSearch = debounce((search: string) => {
    let groupResults: string[] = [];
    let permissionResults: string[];
    if (search && search.trim().length > 0) {
      setSearchValue(search);
      groupResults =
        selectedUser.allGroups &&
        selectedUser.allGroups.filter((group) =>
          group?.toLocaleUpperCase().includes(search.toLocaleUpperCase()),
        );
      setUserGroups(groupResults);
      permissionResults =
        selectedUser.allRoles &&
        selectedUser.allRoles.filter((permission) =>
          permission?.toLocaleUpperCase().includes(search.toLocaleUpperCase()),
        );
      setPermissionGroups(permissionResults);
    } else {
      setSearchValue("");
      setUserGroups(selectedUser.allGroups);
      setPermissionGroups(selectedUser.allRoles);
    }
  }, 300);

  return isLoading ? (
    <LoaderContainer>
      <Spinner />
    </LoaderContainer>
  ) : (
    <div className="scrollable-wrapper" data-testid="t--user-edit-wrapper">
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

export default UserEdit;
