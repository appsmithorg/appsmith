import type { IDEType } from "ee/entities/IDE/constants";

interface ContextType {
  ideType: IDEType;
}

/**
 * Function used to conditionally enable/disable custom rules based on context provided
 *
 * @returns {Record<string, "off"|"error">} Object with settings for the rule
 * */
export const getLintRulesBasedOnContext = ({}: ContextType): Record<
  string,
  "off" | "error"
> => {
  return {};
};
