<p align="center">
  <a href="http://appsmith.com">
    <img width="110px" style="margin-right: 20px" src="https://global-uploads.webflow.com/61531b23c347e4fbd4a84209/61531b23c347e41e24a8423e_Logo.svg">
  </a>
</p>

<h1 align="center">Appsmith Design System</h1>

<div align="center">

[![npm package](https://img.shields.io/npm/v/@appsmithorg/design-system.svg?style=flat-square)](https://www.npmjs.org/package/@appsmithorg/design-system)

</div>

[![](https://github.com/appsmithorg/appsmith/raw/release/static/git-banner-new.png)](https://appsmith.com)

Welcome to the Appsmith Design System repository! This repository contains the design system components, styles, and guidelines used across the Appsmith platform.

# About Appsmith

Appsmith is an open-source, low-code application development platform that allows users to build business applications quickly and easily. The Appsmith Design System plays a crucial role in providing a consistent and visually appealing user interface across all Appsmith projects.

## External Usage
To use the Appsmith Design System in your project, follow these steps:

### Installation

```bash
npm install @appsmithorg/design-system
```
or
```bash
yarn add @appsmithorg/design-system
```

### Including CSS

Add the css import in the root index css file
```bash
@import "~@appsmithorg/design-system/build/css/design-system.css";
```

### Usage

```jsx
import { Button } from "@appsmithorg/design-system";

<Button onClick={() => console.log("An ads button was clicked")}>
  Click me
</Button>
```

## Contribute

1. Clone the repository to your local machine using the following command:

```bash
git clone https://github.com/appsmithorg/design-system.git
```
The repository you are cloing is a monorepo that contains several packages, each serving a different purpose. 

2. Navigate to the design-system directory

```bash
cd design-system/packages/design-system
```

3. Get all dependencies with
```bash 
yarn install
```

Then run storybook in development and watch mode with
```bash
yarn run storybook
```

Any stories you write within `design-system/packages/design-system/src/**` will show up here.

4. To add a new component, use our template
```bash
yarn generate:component YOUR_NEW_COMPONENT_NAME
```
This generates all the scaffolding our components use. Simply replace the fields in caps lock and develop away!

5. To ensure that any changes you make are not breaking any other components or their stories, run 
```bash
yarn test-storybook
```
and fix any failures before you create a pull request.

## Using your changes externally

This repository is a library, and for any changes made here to reflect in another repository, the maintainers will have to publish a release. 
To get your PR accepted,   
1. Add a link to your PR in [#design-system](https://theappsmith.slack.com/archives/C0293DVQACW) and ask someone to generate a release for you. They will give you an alpha version. 
2. Replace the version of design-system in the [appsmith repository](https://github.com/appsmithorg/appsmith/blob/da06cf7b4da657ba22a23f0780c253be3e4ba7cf/app/client/package.json#L96) with this alpha version. 

To use your local version of the package, run
```bash
yarn link
```
in this repository, then copy instruction it outputs into the root directory of the repository you want to use this package in.
Run
```bash
yarn install 
```
again to be able to import the components using

```jsx
import { Button } from "@appsmithorg/design-system";
```

## Links

- [Storybook](https://design-system.appsmith.com)
