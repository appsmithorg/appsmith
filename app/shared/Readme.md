# Shared Dependencies

We wanted to share common logic with different applications within our repo, so we picked [yarn workspaces](https://yarnpkg.com/features/workspaces/) as our approach to tackle this problem. Following are the way in which you can take advantage of the module sharing architecture.

## Create a shared module

1. Create a directory inside `shared`
2. Inside the directory, create a `package.json` file, and set its `name` field to `@shared/<name of the module>`. For example, if the module is `abc`, the name field should be `@shared/abc`.
3. Add the module code
4. Add a `postinstall` script to build the module as needed, e.g.:

```json
// shared/abc/package.json
{
  "name": "@shared/abc",
  "scripts": {
    "postinstall": "rollup -c"
  }
}
```

## Install a shared module

Navigate to the directory where you want to use the module and run `yarn add <module-name>`.

For example, if the `package.json` name field is `@shared/abc`, run

```sh
yarn add @shared/abc
```
