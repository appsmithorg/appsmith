/*
  We kept the graphql constants in this file because we were facing an error : Uncaught TypeError: Cannot read properties of undefined (reading 'register'). So we kept these variables at one place in this file to make sure this is not present in different files.
 */

// Graphql Pagination Constants
export const LIMITBASED_PREFIX = "limitBased";
export const CURSORBASED_PREFIX = "cursorBased";
export const CURSOR_PREVIOUS_PREFIX = "previous";
export const CURSOR_NEXT_PREFIX = "next";
