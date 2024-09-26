import type { Property } from "entities/Action";

function getValidProperties(value?: Property[]) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((v) => v.key && v.key !== "");
}

export default getValidProperties;
