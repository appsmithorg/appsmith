import type { ModuleInput } from "@appsmith/constants/ModuleConstants";
import {
  generateNewInputGroup,
  generateDefaultInputSection,
  generateUniqueId,
} from "./helper"; // Import your utility functions

describe("generateNewInputGroup", () => {
  it("generates a new input group with a unique ID and default values", () => {
    const existingInputGroups: ModuleInput[] = [
      {
        id: "existingId1",
        label: "existingLabel1",
        defaultValue: "",
        controlType: "TEST",
        propertyName: "input1",
      },
      {
        id: "existingId2",
        label: "existingLabel2",
        defaultValue: "",
        controlType: "TEST",
        propertyName: "input2",
      },
    ];

    const newInputGroup = generateNewInputGroup(existingInputGroups);

    expect(newInputGroup.id).toBeDefined(); // Check if the ID is generated
    expect(existingInputGroups.map((group) => group.id)).not.toContain(
      newInputGroup.id,
    ); // Check if the ID is unique

    expect(newInputGroup.label).toBeDefined(); // Check if the label is generated
    expect(existingInputGroups.map((group) => group.label)).not.toContain(
      newInputGroup.label,
    ); // Check if the label is unique

    expect(newInputGroup.propertyName).toBe(`input.${newInputGroup.label}`);
    expect(newInputGroup.defaultValue).toBe("");
    expect(newInputGroup.controlType).toBe("INPUT_TEXT");
  });

  it("generates a new input group with default values when no existing input groups are provided", () => {
    const newInputGroup = generateNewInputGroup();

    expect(newInputGroup.id).toBeDefined();
    expect(newInputGroup.label).toBeDefined();
    expect(newInputGroup.propertyName).toBe(`input.${newInputGroup.label}`);
    expect(newInputGroup.defaultValue).toBe("");
    expect(newInputGroup.controlType).toBe("INPUT_TEXT");
  });
});

describe("generateDefaultInputSection", () => {
  it("generates a new input section with a unique ID and an empty section name", () => {
    const newInputSection = generateDefaultInputSection();

    expect(newInputSection.id).toBeDefined();
    expect(newInputSection.sectionName).toBe("");
    expect(newInputSection.children).toEqual([]);
  });
});

describe("generateUniqueId", () => {
  it("generates a unique ID not found in the existing IDs", () => {
    const existingIds = ["existingId1", "existingId2"];

    const newId = generateUniqueId(existingIds);

    expect(newId).toBeDefined();
    expect(existingIds).not.toContain(newId);
  });

  it("generates a unique ID when no existing IDs are provided", () => {
    const newId = generateUniqueId([]);

    expect(newId).toBeDefined();
  });
});
