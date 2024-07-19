import {
  getWidgetIdsWithDuplicateLabelWhenUpdated,
  onDeleteGetDuplicateIds,
  onUpdatedMenulabel,
  onUpdatedlabel,
  getduplicateLabelWidgetIds,
} from "./getWidgetIdsWithDuplicateLabel";
import "@testing-library/jest-dom";
import "@testing-library/react";

const items = [
  {
    id: "button1",
    label: "add",
    isDisabled: false,
    isVisible: true,
    widgetId: "button1",
    itemType: "BUTTON",
    isDuplicateLabel: false,
  },
  {
    id: "button2",
    label: "add",
    isDisabled: false,
    isVisible: true,
    widgetId: "button2",
    itemType: "BUTTON",
    isDuplicateLabel: true,
  },
  {
    id: "button3",
    label: "add",
    isDisabled: false,
    isVisible: true,
    widgetId: "button3",
    itemType: "BUTTON",
    isDuplicateLabel: true,
  },
  {
    id: "button4",
    label: "add1",
    isDisabled: false,
    isVisible: true,
    widgetId: "button4",
    itemType: "BUTTON",
    isDuplicateLabel: false,
  },
];

const buttonGroupButtons = {
  widgetId: "buttonGroup1",
  type: "BUTTON_GROUP_WIDGET",
  groupButtons: {
    button1: {
      id: "button1",
      widgetId: "button1",
      isDisabled: false,
      isVisible: true,
      label: "add",
      isDuplicateLabel: false,
      menuItems: {},
    },
    button2: {
      id: "button2",
      widgetId: "button2",
      isDisabled: false,
      isVisible: true,
      label: "favriote",
      isDuplicateLabel: false,
      menuItems: {},
    },
    button3: {
      id: "button3",
      widgetId: "button3",
      isDisabled: false,
      isVisible: true,
      label: "more",
      isDuplicateLabel: false,
      menuItems: {
        menuItem1: {
          id: "menuItem1",
          widgetId: "",
          label: "First Menu Item",
          isVisible: true,
          isDisabled: false,
          isDuplicateLabel: false,
        },
        menuItem2: {
          id: "menuItem2",
          widgetId: "",
          label: "Second Menu Item",
          isVisible: true,
          isDisabled: false,
          isDuplicateLabel: false,
        },
        menuItem3: {
          id: "menuItem3",
          widgetId: "",
          label: "First Menu Item",
          isVisible: true,
          isDisabled: false,
          isDuplicateLabel: true,
        },
      },
    },
    button4: {
      id: "button4",
      widgetId: "",
      label: "add",
      isVisible: true,
      isDisabled: false,
      isDuplicateLabel: true,
      menuItems: {},
    },
  },
};
const menuButton = {
  widgetId: "menuButton1",
  type: "MENU_BUTTON_WIDGET",
  widgetName: "MenuButton1",
  menuItems: {
    menuItem1: {
      id: "menuItem1",
      widgetId: "",
      label: "add",
      isVisible: true,
      isDisabled: false,
      isDuplicateLabel: false,
    },
    menuItem2: {
      id: "menuItem2",
      widgetId: "",
      label: "favriote",
      isVisible: true,
      isDisabled: false,
      isDuplicateLabel: false,
    },
    menuItem3: {
      id: "menuItem3",
      widgetId: "",
      label: "add",
      isVisible: true,
      isDisabled: false,
      isDuplicateLabel: true,
    },
  },
};
const state = {
  entities: {
    canvasWidgets: {
      buttonGroup1: buttonGroupButtons,
      menuButton1: menuButton,
    },
  },
};

describe("test cases for checking the functionality for geting and updating the duplicate labels", () => {
  it("test to get the duplicate ids from the items", () => {
    const duplicateIds = getduplicateLabelWidgetIds(items);
    expect(duplicateIds.length).toBe(2);
    expect(duplicateIds).toEqual(["button2", "button3"]);
  });
  it("test to get duplicateIds when a new button or menu button is deleted", () => {
    const duplicateIds = ["button2", "button3"];
    let updatedItems = items.filter((item) => item.id !== "button2");
    const mockUpdateFun = jest.fn();
    const newDuplicateIds = onDeleteGetDuplicateIds(
      updatedItems,
      duplicateIds,
      ["add", "add", "add1"],
      mockUpdateFun,
    );
    expect(newDuplicateIds.length).toBe(1);
    expect(mockUpdateFun).toBeCalled();
    updatedItems = updatedItems.filter((item) => item.id !== "button1");
    const newDuplicateIds2 = onDeleteGetDuplicateIds(
      updatedItems,
      ["button3"],
      ["add", "add1"],
      mockUpdateFun,
    );
    expect(newDuplicateIds2.length).toBe(0);
    expect(mockUpdateFun).toBeCalledTimes(2);
  });
  it("test to update the duplicate ids when a new label is updated", () => {
    const duplicateIds = ["button2", "button3"];
    const mockUpdateFun = jest.fn();
    const labels = ["add", "add", "add", "add1"];
    const newDuplicateIds = getWidgetIdsWithDuplicateLabelWhenUpdated(
      duplicateIds,
      labels,
      "favriote",
      "button2",
      1,
      mockUpdateFun,
      items,
    );
    expect(newDuplicateIds.length).toBe(1);
    expect(mockUpdateFun).toBeCalled();
    expect(newDuplicateIds).toEqual(["button3"]);
    duplicateIds.shift();
    const newMockFun = jest.fn();
    const newItems = [...items];
    newItems[1].label = "favriote";
    const newDuplicateIds2 = getWidgetIdsWithDuplicateLabelWhenUpdated(
      duplicateIds,
      ["add", "favriote", "add", "add1"],
      "favriote",
      "button1",
      0,
      newMockFun,
      newItems,
    );
    expect(newDuplicateIds2.length).toBe(1);
    expect(newDuplicateIds2).toEqual(["button1"]);
    expect(newMockFun).toBeCalledTimes(2);
  });
  it("test to check the duplicate ids when the button group is updated with input control", () => {
    const mockUpdateFun = jest.fn();
    onUpdatedlabel(
      "buttonGroup1",
      state,
      { button4: { label: "add" } },
      "buttonGroup1.groupButtons.button4.label",
      "add10",
      mockUpdateFun,
    );
    expect(mockUpdateFun).toBeCalled();
    const newMockFunction1 = jest.fn();
    onUpdatedlabel(
      "buttonGroup1",
      state,
      { button1: { label: "add" } },
      "buttonGroup1.groupButtons.button1.label",
      "favriote",
      newMockFunction1,
    );
    expect(newMockFunction1).toBeCalledTimes(2);
    const newMockFunction2 = jest.fn();
    onUpdatedlabel(
      "buttonGroup1",
      state,
      { button3: { menuItems: { menuItem3: { label: "First Menu Item" } } } },
      "buttonGroup1.groupButtons.button3.menuItems.menuItem3.label",
      "add10",
      newMockFunction2,
    );
    expect(newMockFunction2).toBeCalled();
    const newMockFunction3 = jest.fn();
    onUpdatedlabel(
      "buttonGroup1",
      state,
      { button3: { menuItems: { menuItem1: { label: "First Menu Item" } } } },
      "buttonGroup1.groupButtons.button3.menuItems.menuItem1.label",
      "Second Menu Item",
      newMockFunction3,
    );
    expect(newMockFunction3).toBeCalledTimes(2);
    const newMockFunction4 = jest.fn();
    onUpdatedlabel(
      "buttonGroup1",
      state,
      { button3: { menuItems: { menuItem2: { label: "Second Menu Item" } } } },
      "buttonGroup1.groupButtons.button3.menuItems.menuItem2.label",
      "Menu Item",
      newMockFunction4,
    );
    expect(newMockFunction4).toBeCalledTimes(0);
    const newMockFunction5 = jest.fn();
    onUpdatedlabel(
      "buttonGroup1",
      state,
      { button2: { label: "favriote" } },
      "buttonGroup1.groupButtons.button2.label",
      "favriote10",
      newMockFunction5,
    );
    expect(newMockFunction5).toBeCalledTimes(0);
  });
  it("test to check the updatation of duplicate Ids when we update the label of a  menu item in menu button using input field", () => {
    const mockFun1 = jest.fn();
    onUpdatedMenulabel(
      "menuButton1",
      state,
      { menuItem3: { label: "add" } },
      "menuItems.menuItem3.label",
      "add10",
      mockFun1,
    );
    expect(mockFun1).toBeCalled();
    const mockFun2 = jest.fn();
    onUpdatedMenulabel(
      "menuButton1",
      state,
      { menuItem1: { label: "add" } },
      "menuItems.menuItem1.label",
      "favriote",
      mockFun2,
    );
    expect(mockFun2).toBeCalledTimes(2);
    const mockFun3 = jest.fn();
    onUpdatedMenulabel(
      "menuButton1",
      state,
      { menuItem2: { label: "favriote" } },
      "menuItems.menuItem2.label",
      "add10",
      mockFun3,
    );
    expect(mockFun3).not.toBeCalled();
  });
});
