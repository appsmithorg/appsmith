import generate from "nanoid/generate";

import type {
  ModuleInput,
  ModuleInputSection,
} from "@appsmith/constants/ModuleConstants";
import { getNextEntityName } from "utils/AppsmithUtils";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const DEFAULT_INPUT_NAME = "input";

export function generateUniqueId(existingIds: string[]) {
  let newId;
  do {
    newId = generate(ALPHABET, 10);
  } while (existingIds.includes(newId));
  return newId;
}

export const generateNewInputGroup = (
  existingInputGroups: ModuleInput[] = [],
) => {
  const existingIds = existingInputGroups.map(({ id }) => id);
  const existingNames = existingInputGroups.map(({ label }) => label);
  const id = generateUniqueId(existingIds);
  const label = getNextEntityName(DEFAULT_INPUT_NAME, existingNames);

  return {
    id,
    label,
    propertyName: `input.${label}`,
    defaultValue: "",
    controlType: "INPUT_TEXT",
  };
};

export const generateDefaultInputSection = (): ModuleInputSection => {
  return {
    id: generateUniqueId([]),
    sectionName: "",
    children: [],
  };
};
