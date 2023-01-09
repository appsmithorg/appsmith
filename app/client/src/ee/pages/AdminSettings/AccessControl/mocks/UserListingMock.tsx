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
    allGroups: [
      {
        id: "4",
        name: "App Viewer",
      },
      { id: "5", name: "Developer" },
      { id: "6", name: "Marketing Admin" },
    ],
    roles: [
      {
        id: "1",
        name: "Administrator-PG",
      },
      { id: "2", name: "Test_Admin-PG" },
      { id: "3", name: "HR_Admin-PG" },
    ],
    allRoles: [
      { id: "4", name: "App Viewer-PG" },
      { id: "5", name: "Developer-PG" },
      { id: "6", name: "Marketing Admin-PG" },
    ],
    username: "techak@appsmith.com",
    id: "123",
    userPermissions: ["manage:users", "delete:users"],
  },
  {
    name: "Sangy Sivan",
    groups: [
      { id: "4", name: "App Viewer" },
      { id: "3", name: "HR_Admin" },
    ],
    allGroups: [
      {
        id: "1",
        name: "Administrator",
      },
      { id: "2", name: "Test_Admin" },
      { id: "5", name: "Developer" },
      { id: "6", name: "Marketing Admin" },
    ],
    roles: [
      { id: "4", name: "App Viewer-PG" },
      { id: "3", name: "HR_Admin-PG" },
    ],
    allRoles: [
      {
        id: "1",
        name: "Administrator-PG",
      },
      { id: "2", name: "Test_Admin-PG" },
      { id: "5", name: "Developer-PG" },
      { id: "6", name: "Marketing Admin-PG" },
    ],
    username: "sangy@appsmith.com",
    id: "456",
    userPermissions: ["manage:users"],
  },
  {
    name: "SS Sivan",
    groups: [
      { id: "4", name: "App Viewer" },
      { id: "3", name: "HR_Admin" },
    ],
    allGroups: [
      {
        id: "1",
        name: "Administrator",
      },
      { id: "2", name: "Test_Admin" },
      { id: "5", name: "Developer" },
      { id: "6", name: "Marketing Admin" },
    ],
    roles: [
      { id: "4", name: "App Viewer-PG" },
      { id: "3", name: "HR_Admin-PG" },
    ],
    allRoles: [
      {
        id: "1",
        name: "Administrator-PG",
      },
      { id: "2", name: "Test_Admin-PG" },
      { id: "5", name: "Developer-PG" },
      { id: "6", name: "Marketing Admin-PG" },
    ],
    username: "sangy123@appsmith.com",
    id: "789",
    userPermissions: [],
  },
];
