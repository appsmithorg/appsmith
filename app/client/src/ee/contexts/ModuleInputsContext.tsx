import { createContext } from "react";

/**
 * Context for module inputs. When a Custom widget is inside a ModuleContainer or
 * ModuleWidget and its model (from defaultModel binding) is empty, it can fall
 * back to these inputs. This fixes the issue where inputs/Commons1.inputs
 * fails to resolve during evaluation.
 */
export const ModuleInputsContext = createContext<Record<string, unknown>>({});

export const ModuleInputsProvider = ModuleInputsContext.Provider;

/** Stable empty object to avoid unnecessary re-renders when inputs are undefined */
export const EMPTY_MODULE_INPUTS: Record<string, unknown> = Object.freeze({});
