import React from "react";
import { Link, Text } from "design-system";

const ResourceLinks = ({
  provisionedGroups,
  provisionedUsers,
}: {
  provisionedGroups: number;
  provisionedUsers: number;
}) => {
  return (
    <>
      <Link startIcon="user-3-line" to="/settings/users?provisioned=true">
        {`${
          provisionedUsers === 1
            ? `${provisionedUsers} user`
            : `${provisionedUsers} users`
        }`}
      </Link>
      &nbsp;
      <Text>and</Text>&nbsp;
      <Link startIcon="group-line" to="/settings/groups?provisioned=true">
        {`${
          provisionedGroups === 1
            ? `${provisionedGroups} group`
            : `${provisionedGroups} groups`
        }`}
      </Link>
      &nbsp;
    </>
  );
};

export default ResourceLinks;
