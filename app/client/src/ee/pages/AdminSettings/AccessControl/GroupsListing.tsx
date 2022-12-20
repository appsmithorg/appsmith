import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import styled from "styled-components";
import debounce from "lodash/debounce";
import { Listing } from "./Listing";
import { HighlightText, MenuItemProps } from "design-system";
import { PageHeader } from "./PageHeader";
import { BottomSpace } from "pages/Settings/components";
import { GroupAddEdit } from "./GroupAddEdit";
import { AclWrapper, EmptyDataState, EmptySearchResult } from "./components";
import { adminSettingsCategoryUrl } from "RouteBuilder";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  createGroup,
  deleteGroup,
  getGroupById,
} from "@appsmith/actions/aclActions";
import {
  createMessage,
  ADD_GROUP,
  ACL_EDIT,
  ACL_DELETE,
  SEARCH_GROUPS_PLACEHOLDER,
} from "@appsmith/constants/messages";
import {
  getAclIsLoading,
  getAclIsSaving,
  getGroups,
  getSelectedGroup,
} from "@appsmith/selectors/aclSelectors";
import { GroupProps } from "./types";

const CellContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

export function GroupListing() {
  const history = useHistory();
  const params = useParams() as any;
  const dispatch = useDispatch();

  const userGroups = useSelector(getGroups);
  const selectedGroup = useSelector(getSelectedGroup);
  const isLoading = useSelector(getAclIsLoading);
  const isSaving = useSelector(getAclIsSaving);

  const [data, setData] = useState<GroupProps[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedUserGroup, setSelectedUserGroup] = useState<GroupProps | null>(
    null,
  );
  const [isNewGroup, setIsNewGroup] = useState(false);

  const selectedUserGroupId = params?.selected;

  useEffect(() => {
    if (searchValue) {
      onSearch(searchValue);
    } else {
      setData(userGroups);
    }
  }, [userGroups]);

  useEffect(() => {
    setSelectedUserGroup(selectedGroup);
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedUserGroupId && selectedGroup?.id !== selectedUserGroupId) {
      dispatch(getGroupById({ id: selectedUserGroupId }));
    } else if (!selectedUserGroupId) {
      dispatch({ type: ReduxActionTypes.FETCH_ACL_GROUPS });
      setIsNewGroup(false);
    }
  }, [selectedUserGroupId]);

  useEffect(() => {
    return () => {
      dispatch({ type: ReduxActionTypes.RESET_GROUPS_DATA });
    };
  }, []);

  const columns = [
    {
      Header: `Groups (${data.length})`,
      accessor: "name",
      Cell: function GroupCell(cellProps: any) {
        return (
          <Link
            data-testid="t--usergroup-cell"
            to={adminSettingsCategoryUrl({
              category: SettingCategories.GROUPS_LISTING,
              selected: cellProps.cell.row.original.id,
            })}
          >
            <CellContainer>
              <HighlightText
                highlight={searchValue}
                text={cellProps.cell.row.original.name}
              />
            </CellContainer>
          </Link>
        );
      },
    },
  ];

  const listMenuItems: MenuItemProps[] = [
    {
      className: "edit-menu-item",
      icon: "edit-underline",
      onSelect: (e: React.MouseEvent, key: string) => {
        history.push(`/settings/groups/${key}`);
      },
      text: createMessage(ACL_EDIT),
    },
    {
      label: "delete",
      className: "delete-menu-item",
      icon: "delete-blank",
      onSelect: (e: React.MouseEvent, key: string) => {
        onDeleteHandler(key);
      },
      text: createMessage(ACL_DELETE),
    },
  ];

  const pageMenuItems: MenuItemProps[] = [
    {
      icon: "book-line",
      className: "documentation-page-menu-item",
      onSelect: () => {
        /*console.log("hello onSelect")*/
      },
      text: "Documentation",
    },
  ];

  const onAddButtonClick = () => {
    dispatch(
      createGroup({
        name: "Untitled Group",
      }),
    );
    setIsNewGroup(true);
  };

  const onSearch = debounce((search: string) => {
    if (search && search.trim().length > 0) {
      setSearchValue(search);
      const results =
        userGroups &&
        userGroups.filter((userGroup) =>
          userGroup.name?.toLocaleUpperCase().includes(search),
        );
      setData(results);
    } else {
      setSearchValue("");
      setData(userGroups);
    }
  }, 300);

  const onDeleteHandler = (id: string) => {
    dispatch(deleteGroup({ id }));
    /* for jest tests */
    const updatedData = data.filter((userGroup) => {
      return userGroup.id !== id;
    });
    setData(updatedData);
    /* for jest tests */
  };

  return (
    <AclWrapper data-testid="t--group-listing-wrapper">
      {selectedUserGroupId && selectedUserGroup ? (
        <GroupAddEdit
          isLoading={isLoading}
          isNew={isNewGroup}
          isSaving={isSaving}
          onDelete={onDeleteHandler}
          selected={selectedUserGroup}
        />
      ) : (
        <>
          <PageHeader
            buttonText={createMessage(ADD_GROUP)}
            onButtonClick={onAddButtonClick}
            onSearch={onSearch}
            pageMenuItems={pageMenuItems}
            searchPlaceholder={createMessage(SEARCH_GROUPS_PLACEHOLDER)}
            searchValue={searchValue}
          />
          <Listing
            columns={columns}
            data={data}
            emptyState={
              searchValue ? (
                <EmptySearchResult />
              ) : (
                <EmptyDataState page="groups" />
              )
            }
            isLoading={isLoading}
            keyAccessor="id"
            listMenuItems={listMenuItems}
          />
        </>
      )}
      <BottomSpace />
    </AclWrapper>
  );
}
