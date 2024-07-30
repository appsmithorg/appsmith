# Steps to migrate components

- [ ]  Pick the component to be migrated. Mark it as in progress (highlight in yellow) on the migration sheet [Component Migration planning](https://docs.google.com/spreadsheets/d/1pcIMvGwknhbjnG1yxKH2UnRIOPwW5lw_xiFxrJdb1E8/edit?usp=drivesdk)
- [ ]  Create an issue for it on [appsmith/ce](http://github.com/appsmithorg/appsmith). Announce that you’re doing this on #design-system and #team-tech channel.
    - [ ] All PRs should have an issue.
    - [ ] All issues should have estimates.
    - [ ] All issues should be assigned to sprint(s).
    - [ ] All migration-related issue goes inside the migration epic
    - [ ] All migration issues should have labels ads migration
    - [ ] All design system issues should have a design system pod label. Then, zenhub can track the issues.
    - [ ] All issues should have sprint added to it.
- [ ]  Copy the files over to the [appsmith/design-system](http://github.com/appsmithorg/design-system/) repository.
    - [ ]  Copy any unit test files over as well if they exist.
    - [ ]  In the files, props.theme variables become variables used from variables.css
    - [ ]  component-specific variables and tokens go in index.css (make sure you order this alphabetically)
    - [ ]  Add stories for every state and variation of the component
    - [ ]  Make sure to add the exports of the components you’ve added in the src/index.ts file
- [ ]  Create a branch to change the imports on appsmith/ce.
    - [ ]  First, check that there has been no deviation from the migrated file in the design-system repo with the current file in the appsmith repo. You can run the command `git log -1 --pretty="format:%ci" ./src/components/ads/[YOUR_COMPONENT_FILE]` and if the date returned is after the beginning of July, it was probably modified. You can paste both files in a diff checker like [diffchecker.com](diffchecker.com) to compare and update the files in the design-system repo.
    - [ ]  On this branch, delete the files for the component you’ve just migrated.
    - [ ]  Everywhere the component was used, change the import to point to the design-system package instead.
    - [ ] If you've migrated a component that is used a specific new places in the ee-repo, make updates there as well.
- [ ]  Test the changes you’ve made and if the imports you’ve generated work as expected in your local developer environment of appsmith
    - [ ]  install yalc on your system
    - [ ]  run `yarn build` to build the package, then `yalc publish` to imitate the package being published
    - [ ]  run `yalc add '@appsmithorg/design-system'` in the appsmith/ce repository
    - [ ]  All the imports will now be named imports. for local testing purposes, they will come from `@appsmithorg/design-system` . Make sure to change these imports to just `design-system` when committing them.
    - [ ]  Make sure you also test on ee, because ee is a superset of ce. If things break on ee, you will have to fix the specific import changes there as well.
        - [ ]  You can test on ee by pulling your changes from your ce branch into your ee branch following the steps in the 'set up upstream repo' part of this document: https://www.notion.so/appsmith/How-to-resolve-merge-conflicts-when-Sync-Community-Workflow-fails-66f1eb73ce4b45f48f8e6f6f4f5ebfd8#e5e755eab837428581a4f81847b4e39c
        - [ ]  You will have to run ee locally following this document: https://www.notion.so/appsmith/Steps-to-run-EE-code-locally-d01e0bc343d94a209c8a90d3dba33e17
- [ ]  Raise a PR for the changes you’ve made in the design-system repository. Make sure you have added a changeset for the PR detailing what the PR will do.
- [ ]  Once your changes on the design-system repository has been approved and merged to release, take the beta version number of our package under ‘current tags’ from the published npm page, and replace the version number of [this line](https://github.com/appsmithorg/appsmith/blob/8428ae506a02ec477027b82936ff003c0c53cafb/app/client/package.json#L48) with it on your branch. Test once again if the imports work as expected, then raise a PR for the changed imports in the appsmith/ce repository. [@appsmithorg/design-system](https://www.npmjs.com/package/@appsmithorg/design-system)
- [ ]  Once the PR is raised, the deploy preview created will be given to QA for testing. To help them with that process, we will have to prepare a document of where the component is being used. Take a screenshot of the pages where the changes have happened, and then add them to the component usage spreadsheet: [Components usage](https://docs.google.com/spreadsheets/d/1np7jQdiQa0nyryOBnNa927NkGDplG9M2gb7qnoZIIyM/edit?usp=drivesdk)
- [ ]  Ensure that QA signs off on both ce and ee repositories
- [ ]  Minor versions are incremented every time release is merged into main. This is currently a manual process. Make sure that when you make this change, the package.json in appsmith/ce is updated accordingly.

## **Versioning ([NPM semantic versioning](https://docs.npmjs.com/about-semantic-versioning))**

![Screenshot 2022-05-10 at 4.20.48 PM.png](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/ba1bcd19-e767-4f2b-bc37-1037451f0cc6/Screenshot_2022-05-10_at_4.20.48_PM.png)
