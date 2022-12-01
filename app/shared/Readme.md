# Shared Dependencies
We wanted to share common logic with different applications within our repo, so we picked [yarn symlinks](https://classic.yarnpkg.com/en/docs/cli/link) as our approach to tackle this problem. Following are the way in which you can take advantage of the module sharing architecture.

## Creation of a Shared Module
- Create a directory inside `shared` directory with name eg. `abc`
- Inside `package.json` of module, keep the name like `@shared/abc`
- Add a rollup config to generate `package.json` after the module is build

## Installation of Shared Modules
- Add an entry for an application inside `shared-dependencies.json` eg. for `client` there should be an entry `"client": []`
- Add the name of the shared module in the entry of the application in the above file eg. `"client": ["@shared/abc"]`
- If the application does not have any postinstall or preinstall scripts for shared modules then add the two commands described below in the application's (eg. `client`)  `package.json` : 
  `"postinstall": "CURRENT_SCOPE=client node ../shared/install-dependencies.js"`
  `"preinstall": "CURRENT_SCOPE=client node ../shared/build-shared-dep.js"`
  CURRENT_SCOPE is the environment variable that's being used in the scripts

## Verifying the Installed Shared Modules
- Run `yarn run verify` inside `shared` directory to verify shared dependencies for an application.

## Command `link-package`
- `yarn install` : installs packages
- `rollup -c` : Module bundler bundles the package and creates a build
- `cd build` : Change the present working directory
- `cp -R ../node_modules ./node_modules` : copies its own node_modules directory to its build directory to make sure its own version dependencies do not mismatch when its installed in other directories as shared module
- `yarn link` : Creates a link for the package to make it available for other directories to use.

