import { UserProps } from "../types";

export const allUsers: UserProps[] = [
  {
    name: "Ankita Kinger",
    groups: [
      {
        id: "1",
        name: "Administrator",
      },
      { id: "2", name: "Test_Admin" },
      { id: "3", name: "HR_Admin" },
    ],
    allGroups: [],
    roles: [
      {
        id: "1",
        name: "Administrator-PG",
      },
      { id: "2", name: "Test_Admin-PG" },
      { id: "3", name: "HR_Admin-PG" },
    ],
    allRoles: [],
    username: "techak@appsmith.com",
    id: "123",
  },
  {
    name: "Sangy Sivan",
    groups: [
      { id: "4", name: "App Viewer" },
      { id: "3", name: "HR_Admin" },
    ],
    allGroups: [],
    roles: [
      { id: "4", name: "App Viewer-PG" },
      { id: "3", name: "HR_Admin-PG" },
    ],
    allRoles: [],
    username: "sangy@appsmith.com",
    id: "456",
  },
  {
    name: "SS Sivan",
    groups: [
      { id: "4", name: "App Viewer" },
      { id: "3", name: "HR_Admin" },
    ],
    allGroups: [],
    roles: [
      { id: "4", name: "App Viewer-PG" },
      { id: "3", name: "HR_Admin-PG" },
    ],
    allRoles: [],
    username: "sangy123@appsmith.com",
    id: "789",
  },
];
