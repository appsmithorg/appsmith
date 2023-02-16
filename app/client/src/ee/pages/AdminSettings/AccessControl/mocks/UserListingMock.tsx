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
        userPermissions: ["unassign:permissionGroups"],
        autoCreated: true,
      },
      {
        id: "2",
        name: "Test_Admin-PG",
        userPermissions: ["unassign:permissionGroups"],
        autoCreated: false,
      },
      {
        id: "3",
        name: "HR_Admin-PG",
        userPermissions: [],
        autoCreated: false,
      },
    ],
    allRoles: [
      { id: "4", name: "App Viewer-PG", autoCreated: true },
      { id: "5", name: "Developer-PG", autoCreated: true },
      { id: "6", name: "Marketing Admin-PG", autoCreated: false },
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
      {
        id: "4",
        name: "App Viewer-PG",
        userPermissions: ["unassign:permissionGroups"],
        autoCreated: true,
      },
      {
        id: "3",
        name: "HR_Admin-PG",
        userPermissions: ["unassign:permissionGroups"],
        autoCreated: false,
      },
    ],
    allRoles: [
      {
        id: "1",
        name: "Administrator-PG",
        autoCreated: true,
      },
      { id: "2", name: "Test_Admin-PG", autoCreated: false },
      { id: "5", name: "Developer-PG", autoCreated: true },
      { id: "6", name: "Marketing Admin-PG", autoCreated: false },
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
      {
        id: "4",
        name: "App Viewer-PG",
        userPermissions: ["unassign:permissionGroups"],
        autoCreated: true,
      },
      {
        id: "3",
        name: "HR_Admin-PG",
        userPermissions: ["unassign:permissionGroups"],
        autoCreated: false,
      },
    ],
    allRoles: [
      {
        id: "1",
        name: "Administrator-PG",
        autoCreated: true,
      },
      { id: "2", name: "Test_Admin-PG", autoCreated: false },
      { id: "5", name: "Developer-PG", autoCreated: true },
      { id: "6", name: "Marketing Admin-PG", autoCreated: false },
    ],
    username: "sangy123@appsmith.com",
    id: "789",
    userPermissions: [],
  },
];
