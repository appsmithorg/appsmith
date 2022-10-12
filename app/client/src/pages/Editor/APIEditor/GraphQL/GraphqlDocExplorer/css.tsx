import styled from "styled-components";

export const GraphqlSchemaExplorer = styled.div`
  height: 100%;
  padding: 10px;
  border-left: 1px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  overflow-y: scroll;
  --color-primary: 320, 95%, 43%;
  --color-secondary: 242, 51%, 61%;
  --color-tertiary: 188, 100%, 36%;
  --color-info: 208, 100%, 46%;
  --color-success: 158, 60%, 42%;
  --color-warning: 36, 100%, 41%;
  --color-error: 13, 93%, 58%;
  --color-neutral: 219, 28%, 32%;
  --color-base: 219, 28%, 100%;
  --alpha-secondary: 0.76;
  --alpha-tertiary: 0.5;
  --alpha-background-heavy: 0.15;
  --alpha-background-medium: 0.1;
  --alpha-background-light: 0.07;
  --font-family: "Roboto", sans-serif;
  --font-family-mono: "Fira Code", monospace;
  --font-size-hint: 0.75rem;
  --font-size-inline-code: 0.8125rem;
  --font-size-body: 0.9375rem;
  --font-size-h4: 1.125rem;
  --font-size-h3: 1.375rem;
  --font-size-h2: 1.8125rem;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --line-height: 1.5;
  --px-2: 2px;
  --px-4: 4px;
  --px-6: 6px;
  --px-8: 8px;
  --px-10: 10px;
  --px-12: 12px;
  --px-16: 16px;
  --px-20: 20px;
  --px-24: 24px;
  --border-radius-2: 2px;
  --border-radius-4: 4px;
  --border-radius-8: 8px;
  --border-radius-12: 12px;
  --popover-box-shadow: 0px 6px 20px rgba(59, 76, 106, 0.13),
    0px 1.34018px 4.46726px rgba(59, 76, 106, 0.0774939),
    0px 0.399006px 1.33002px rgba(59, 76, 106, 0.0525061);
  --popover-border: none;
  --sidebar-width: 44px;
  --toolbar-width: 40px;
  --session-header-height: 51px;

  /* Everything */
  .graphiql-container {
    background-color: hsl(var(--color-base));
    display: flex;
    height: 100%;
    margin: 0;
    overflow: hidden;
    width: 100%;
  }

  /* The sidebar */
  .graphiql-container .graphiql-sidebar {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: var(--px-8);
    width: var(--sidebar-width);
  }

  .graphiql-container .graphiql-sidebar .graphiql-sidebar-section {
    display: flex;
    flex-direction: column;
    gap: var(--px-8);
  }

  .graphiql-container .graphiql-sidebar button {
    display: flex;
    align-items: center;
    justify-content: center;
    color: hsla(var(--color-neutral), var(--alpha-secondary));
    height: calc(var(--sidebar-width) - (2 * var(--px-8)));
    width: calc(var(--sidebar-width) - (2 * var(--px-8)));
  }

  .graphiql-container .graphiql-sidebar button.active {
    color: hsla(var(--color-neutral), 1);
  }
  .graphiql-container .graphiql-sidebar button:not(:first-child) {
    margin-top: var(--px-4);
  }
  .graphiql-container .graphiql-sidebar button > svg {
    height: var(--px-20);
    width: var(--px-20);
  }

  /* The main content, i.e. everything except the sidebar */
  .graphiql-container .graphiql-main {
    display: flex;
    flex: 1;
  }

  /* The current session and tabs */
  .graphiql-container .graphiql-sessions {
    background-color: hsla(var(--color-neutral), var(--alpha-background-light));
    /* Adding the 8px of padding to the inner border radius of the query editor */
    border-radius: calc(var(--border-radius-12) + var(--px-8));
    display: flex;
    flex-direction: column;
    flex: 1;
    max-height: 100%;
    margin: var(--px-16);
    margin-left: 0;
  }

  /* The session header containing tabs and the logo */
  .graphiql-container .graphiql-session-header {
    align-items: center;
    display: flex;
    justify-content: space-between;
    height: var(--session-header-height);
  }

  /* The button to add a new tab */
  button.graphiql-tab-add {
    height: 100%;
    padding: 0 var(--px-4);
  }
  button.graphiql-tab-add > svg {
    color: hsla(var(--color-neutral), var(--alpha-secondary));
    display: block;
    height: var(--px-16);
    width: var(--px-16);
  }
  .graphiql-add-tab-wrapper {
    padding: var(--px-12) 0;
  }

  /* The right-hand-side of the session header */
  .graphiql-container .graphiql-session-header-right {
    align-items: stretch;
    display: flex;
  }

  /* The GraphiQL logo */
  .graphiql-container .graphiql-logo {
    color: hsla(var(--color-neutral), var(--alpha-secondary));
    font-size: var(--font-size-h4);
    font-weight: var(--font-weight-medium);
    padding: var(--px-12) var(--px-16);
  }

  /* Undo default link styling for the default GraphiQL logo link */
  .graphiql-container .graphiql-logo .graphiql-logo-link {
    color: hsla(var(--color-neutral), var(--alpha-secondary));
    text-decoration: none;
  }

  /* The editor of the session */
  .graphiql-container .graphiql-session {
    display: flex;
    flex: 1;
    padding: 0 var(--px-8) var(--px-8);
  }

  /* All editors (query, variable, headers) */
  .graphiql-container .graphiql-editors {
    background-color: hsl(var(--color-base));
    border-radius: calc(var(--border-radius-12));
    box-shadow: var(--popover-box-shadow);
    display: flex;
    flex: 1;
    flex-direction: column;
  }
  .graphiql-container .graphiql-editors.full-height {
    margin-top: calc(var(--px-8) - var(--session-header-height));
  }

  /* The query editor and the toolbar */
  .graphiql-container .graphiql-query-editor {
    border-bottom: 1px solid
      hsla(var(--color-neutral), var(--alpha-background-heavy));
    display: flex;
    flex: 1;
    padding: var(--px-16);
  }

  /* The query editor */
  .graphiql-container .graphiql-query-editor-wrapper {
    display: flex;
    flex: 1;
  }

  /* The vertical toolbar next to the query editor */
  .graphiql-container .graphiql-toolbar {
    margin-left: var(--px-16);
    width: var(--toolbar-width);
  }
  .graphiql-container .graphiql-toolbar > * + * {
    margin-top: var(--px-8);
  }

  /* The toolbar icons */
  .graphiql-toolbar-icon {
    color: hsla(var(--color-neutral), var(--alpha-tertiary));
    display: block;
    height: calc(var(--toolbar-width) - (var(--px-8) * 2));
    width: calc(var(--toolbar-width) - (var(--px-8) * 2));
  }

  /* The tab bar for editor tools */
  .graphiql-container .graphiql-editor-tools {
    align-items: center;
    cursor: row-resize;
    display: flex;
    justify-content: space-between;
    padding: var(--px-8);
  }
  .graphiql-container .graphiql-editor-tools button {
    color: hsla(var(--color-neutral), var(--alpha-secondary));
  }
  .graphiql-container .graphiql-editor-tools button.active {
    color: hsla(var(--color-neutral), 1);
  }

  /* The tab buttons to switch between editor tools */
  .graphiql-container .graphiql-editor-tools-tabs {
    cursor: auto;
    display: flex;
  }
  .graphiql-container .graphiql-editor-tools-tabs > button {
    padding: var(--px-8) var(--px-12);
  }
  .graphiql-container .graphiql-editor-tools-tabs > button + button {
    margin-left: var(--px-8);
  }

  /* An editor tool, e.g. variable or header editor */
  .graphiql-container .graphiql-editor-tool {
    flex: 1;
    padding: var(--px-16);
  }

  /**
 * The way CodeMirror editors are styled they overflow their containing
 * element. For some OS-browser-combinations this might cause overlap issues,
 * setting the position of this to relative makes sure this element will
 * always be on top of any editors.
 */
  .graphiql-container .graphiql-toolbar,
  .graphiql-container .graphiql-editor-tools,
  .graphiql-container .graphiql-editor-tool {
    position: relative;
  }

  /* The response view */
  .graphiql-container .graphiql-response {
    --editor-background: transparent;
    display: flex;
    flex: 1;
    flex-direction: column;
    position: relative;
  }

  /* The results editor wrapping container */
  .graphiql-container .graphiql-response .result-window {
    position: relative;
    flex: 1;
  }

  /* The footer below the response view */
  .graphiql-container .graphiql-footer {
    border-top: 1px solid
      hsla(var(--color-neutral), var(--alpha-background-heavy));
  }

  /* The plugin container */
  .graphiql-container .graphiql-plugin {
    border-left: 1px solid
      hsla(var(--color-neutral), var(--alpha-background-heavy));
    flex: 1;
    max-width: calc(100% - 2 * var(--px-16));
    overflow-y: auto;
    padding: var(--px-16);
  }

  /* Generic drag bar for horizontal resizing */
  .graphiql-container .graphiql-horizontal-drag-bar {
    width: var(--px-12);
    cursor: col-resize;
  }
  .graphiql-container .graphiql-horizontal-drag-bar:hover::after {
    border: var(--px-2) solid
      hsla(var(--color-neutral), var(--alpha-background-heavy));
    border-radius: var(--border-radius-2);
    content: "";
    display: block;
    height: 25%;
    margin: 0 auto;
    position: relative;
    /* (100% - 25%) / 2 = 37.5% */
    top: 37.5%;
    width: 0;
  }

  /* Generic icon style */
  .graphiql-container .graphiql-chevron-icon {
    color: hsla(var(--color-neutral), var(--alpha-tertiary));
    display: block;
    height: var(--px-12);
    padding: var(--px-12);
    width: var(--px-12);
  }

  /* Generic spin animation */
  .graphiql-spin {
    animation: spin 0.8s linear 0s infinite;
  }
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* The header of the settings dialog */
  reach-portal .graphiql-dialog-header {
    align-items: center;
    display: flex;
    justify-content: space-between;
    padding: var(--px-24);
  }

  /* The title of the settings dialog */
  reach-portal .graphiql-dialog-title {
    font-size: var(--font-size-h3);
    font-weight: var(--font-weight-medium);
  }

  /* A section inside the settings dialog */
  reach-portal .graphiql-dialog-section {
    align-items: center;
    border-top: 1px solid
      hsla(var(--color-neutral), var(--alpha-background-heavy));
    display: flex;
    justify-content: space-between;
    padding: var(--px-24);
  }
  reach-portal .graphiql-dialog-section > :not(:first-child) {
    margin-left: var(--px-24);
  }

  /* The section title in the settings dialog */
  reach-portal .graphiql-dialog-section-title {
    font-size: var(--font-size-h4);
    font-weight: var(--font-weight-medium);
  }

  /* The section caption in the settings dialog */
  reach-portal .graphiql-dialog-section-caption {
    color: hsla(var(--color-neutral), var(--alpha-secondary));
  }

  reach-portal .graphiql-table {
    border-collapse: collapse;
    width: 100%;
  }
  reach-portal .graphiql-table :is(th, td) {
    border: 1px solid hsla(var(--color-neutral), var(--alpha-background-heavy));
    padding: var(--px-8) var(--px-12);
  }

  /* A single key the short-key dialog */
  reach-portal .graphiql-key {
    background-color: hsla(
      var(--color-neutral),
      var(--alpha-background-medium)
    );
    border-radius: var(--border-radius-4);
    padding: var(--px-4);
  }

  /* Avoid showing native tooltips for icons with titles */
  .graphiql-container svg {
    pointer-events: none;
  }

  /* The header of the doc explorer */
  .graphiql-doc-explorer-header {
    display: flex;
    justify-content: space-between;
    position: relative;

    &:focus-within {
      & .graphiql-doc-explorer-title {
        /* Hide the header when focussing the search input */
        visibility: hidden;
      }

      & .graphiql-doc-explorer-back:not(:focus) {
        /**
      * Make the back link invisible when focussing the search input. Hiding
      * it in any other way makes it impossible to focus the link by pressing
      * Shift-Tab while the input is focussed.
      */
        color: transparent;
      }
    }
  }
  .graphiql-doc-explorer-header-content {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  /* The search input in the header of the doc explorer */
  .graphiql-doc-explorer-search {
    height: 100%;
    position: absolute;
    right: 0;
    top: 0;

    &:focus-within {
      left: 0;
    }

    & [data-reach-combobox-input] {
      height: 24px;
      width: 4ch;
    }

    & [data-reach-combobox-input]:focus {
      width: 100%;
    }
  }

  /* The back-button in the doc explorer */
  a.graphiql-doc-explorer-back {
    align-items: center;
    color: hsla(var(--color-neutral), var(--alpha-secondary));
    display: flex;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }

    &:focus {
      outline: hsla(var(--color-neutral), var(--alpha-secondary)) auto 1px;

      & + .graphiql-doc-explorer-title {
        /* Don't hide the header when focussing the back link */
        visibility: unset;
      }
    }

    & > svg {
      height: var(--px-8);
      margin-right: var(--px-8);
      width: var(--px-8);
    }
  }

  /* The title of the currently active page in the doc explorer */
  .graphiql-doc-explorer-title {
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-h2);
    overflow-x: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    &:not(:first-child) {
      font-size: var(--font-size-h3);
      margin-top: var(--px-8);
    }
  }

  /* The contents of the currently active page in the doc explorer */
  .graphiql-doc-explorer-content > * {
    color: hsla(var(--color-neutral), var(--alpha-secondary));
    margin-top: var(--px-20);
  }

  /* Error message */
  .graphiql-doc-explorer-error {
    background-color: hsla(var(--color-error), var(--alpha-background-heavy));
    border: 1px solid hsl(var(--color-error));
    border-radius: var(--border-radius-8);
    color: hsl(var(--color-error));
    padding: var(--px-8) var(--px-12);
  }
`;
