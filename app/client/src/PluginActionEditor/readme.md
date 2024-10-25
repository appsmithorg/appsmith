## Plugin Action Editor

Appsmith allows its users to connect their UI to various different
data sources e.g. API end points or SQL Query Databases.
These data sources are configured using "Plugins" that define various details about
the configuration and execution. Each data source is a specific connection and
users can have multiple "Actions" built on top of these data sources.

Actions are implementations that can store and retrieve data from the data source.

The Plugin Action Editor is a module that exposes the UX that is used by the users
to implement details about these actions, its settings and test them in edit mode.

### Contents

This module is divided into 3 major composable sections.

- **Toolbar**: A row for the tools on top of the Action. Comes with Settings, Run Buttons and an overflow menu CTA to add further management items like copy or delete. Allows to add more items in it
- **Form**: A preset form based defined by the Plugin config.
- **Response**: A tabbed bottom view to show the Response and other debugging tools

One can use these 3 sections to define their compose different experiences.

#### Plugin Action Context

All the sections and its children are connected via the "Plugin Action Context" that allows for easy data passing.

The Wrapper "PluginActionEditor" will pass this context down. This includes:

- Action
- Action Response
- Plugin
- Datasource
- Form Configs
- Setting Configs

#### UI Store

The UI state is managed via redux, and it is exposed out as well for use

### How to use

Below we illustrate how by using a Composable structure to create the Action Editor

```typescript jsx
const AppPluginActionEditor = () => {
  // Define the actionId that needs to be configured via the editor.
  // In the example we fetch it from the route
  const actionId = getActionIDFromRoute();
  return (
    /** Plugin Action Editor is our wrapper composable fragment.
     * This will fetch the action and other related info
     * from state and pass it down to its children via "context".
     * This will ensure all children have the same way to access the action
     * i.e. via context. Hence, this component is only responsible for
     * abstracting the
     * action state management
    */
    <PluginActionEditor actionID={actionID}>
      <PluginActionToolbar />
      <PluginActionForm />
      <PluginActionResponse />
    </PluginActionEditor>
  )
}

```

It is completely possible to mix and match these components, and compose them further to build
other experiences with them.
For example if you need to just have the Response view without the form
you can do the following

```typescript jsx
const PluginActionResponseView = () => {
  // Define the actionId that needs to be configured via the editor.
  // In the example we fetch it from the route
  const actionId = getActionIDFromRoute();
  return (
    <PluginActionEditor actionID={actionID}>
      <PluginActionResponse />
    </PluginActionEditor>
  )
}
```

### Update Guide

1. Update an existing functionality to be reflected in all variations
   - Functionality updates should be done at the point of definition itself.
   - Prefer having separate files for each functionality if it has a lot of logic or can be extended in EE
2. Add new functionality for all variations
   - Add the functionality close to the usage point.
   - Avoid configuration of functionality via props since it is used for all.
3. Add an EE variation to a functionality.
   - Avoid adding any EE logic for this functionality as much as possible
   - Ideally it should be exposed as a prop that can be updated in the EE usage point
   - In case it needs to be done in place, make sure the functionality is its own file so that only that functionality
     needs extension.
4. Create a specific variance for a certain use case not applicable for all
   - Avoid adding the logic inside the module instead override via composition
   - If it affects any feature in the module, expose via prop
