import React, { useState } from "react";
import { Link } from "react-router-dom";
import { adminSettingsCategoryUrl } from "RouteBuilder";
import { SettingCategories } from "../../config/types";
import { HighlightText } from "../helpers/HighlightText";
import ProfileImage from "pages/common/ProfileImage";
import {
  CellContainer,
  AllGroups,
  ShowLess,
  MoreGroups,
  GroupWrapper,
} from "../UserListing";

export const columns = [
  {
    Header: `User`,
    accessor: "username",
    Cell: function UserCell(cellProps: any) {
      return (
        <Link
          data-testid="acl-user-listing-link"
          to={adminSettingsCategoryUrl({
            category: SettingCategories.USER_LISTING,
            selected: cellProps.cell.row.original.userId,
          })}
        >
          <CellContainer data-testid="user-listing-userCell">
            <ProfileImage
              className="user-icons"
              size={20}
              source={`/api/v1/users/photo/${cellProps.cell.row.values.username}`}
              userName={cellProps.cell.row.values.username}
            />
            <HighlightText
              highlight={"test"}
              text={cellProps.cell.row.values.username}
            />
          </CellContainer>
        </Link>
      );
    },
  },
  {
    Header: "Groups",
    accessor: "allGroups",
    Cell: function GroupCell(cellProps: any) {
      const [showAllGroups, setShowAllGroups] = useState(false);

      return (
        <CellContainer data-testid="user-listing-groupCell">
          {showAllGroups ? (
            <AllGroups>
              {cellProps.cell.row.values.allGroups.map((group: any) => (
                <div key={group}>{group}</div>
              ))}
              <ShowLess
                data-testid="t--show-less"
                onClick={() => setShowAllGroups(false)}
              >
                show less
              </ShowLess>
            </AllGroups>
          ) : (
            <GroupWrapper>
              {cellProps.cell.row.values.allGroups[0]} ,{" "}
              {cellProps.cell.row.values.allGroups[1]}
              {cellProps.cell.row.values.allGroups.length > 2 && (
                <MoreGroups
                  data-testid="t--show-more"
                  onClick={() => setShowAllGroups(true)}
                >
                  show {cellProps.cell.row.values.allGroups.length - 2} more
                </MoreGroups>
              )}
            </GroupWrapper>
          )}
        </CellContainer>
      );
    },
  },
];
