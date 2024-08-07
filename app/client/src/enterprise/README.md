## Appsmith EE

We use the `ee` alias to switch files between CE and EE to avoid conflicts
during regular merging.

Steps to change something for the EE version of app

- For the functionality you want to change the import statement in its consumers
  to include the `ee` import in the _CE repo_. For eg if you want to update the ApplicationCard
  component will update this file of ApplicationList component.

  _FROM_

  ```typescript
  // ApplicationList.tsx

  import ApplicationCard from "./ApplicationCard";

  // OR

  import ApplicationCard from "pages/Applications/ApplicationCard";
  ```

  _TO_

  ```typescript
  // ApplicationList.tsx

  import ApplicationCard from "ee/pages/Applications/ApplicationCard";
  ```

- Create a new file inside the _EE repo_ called ApplicationCard with the same path
  ```shell script
  $ touch app/client/src/enterprise/pages/Applications/ApplicationCard
  ```
- EE will now use this file, so you can export a custom ApplicationCard component for EE.

The goal is to reduce conflicts and have EE extend virtually any part of CE so selecting files to
update will be crucial. You should keep the following points in mind:

- NEVER update the CE file in the EE repo
- All the consumers of the file will need it's expected exports.
- You can import from the CE file and reexport from your EE if no changes are expected.
- The types of component props if different will cause problems in the component declaration and use.
  You can export that out these props into the `ee` space to avoid this problem by reimplementing them in EE.
