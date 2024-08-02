<p align="center">
  <a href="http://appsmith.com">
    <img width="110px" style="margin-right: 20px" src="https://global-uploads.webflow.com/61531b23c347e4fbd4a84209/61531b23c347e41e24a8423e_Logo.svg">
  </a>
</p>

<h1 align="center">Appsmith Design System - old (deprecated)</h1>

<div align="center">

UI Design system of Appsmith

[![npm package](https://img.shields.io/npm/v/@appsmithorg/design-system.svg?style=flat-square)](https://www.npmjs.org/package/@appsmithorg/design-system)

</div>

[![](https://github.com/appsmithorg/appsmith/raw/release/static/git-banner-new.png)](https://appsmith.com)




## Install

```bash
npm install @appsmith/design-system-old
```
or
```bash
yarn add @appsmithorg/design-system-old
```

## Including CSS

Add css import in the root index css file
```bash
@import "~@appsmithorg/design-system-old/build/css/design-system-old.css";
```

## Usage

```jsx
import { TooltipComponent } from "@appsmithorg/design-system-old";

<TooltipComponent content="Some useful content 🤷🏽‍♂️">
  Hover here 😁
</TooltipComponent>
```

## Contribute
> 🚫 This package is closed for contributions. We welcome contributions to the `design-system` package.

```bash
git clone https://github.com/appsmithorg/design-system.git
```

Get all dependencies with
```bash 
cd design-system/packages/design-system-old
yarn install
```

Then run storybook in development and watch mode with
```bash
yarn run design-system:storybook
```

Any stories you write within `design-system/packages/design-system-old/src/**` will show up here. 

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
import { TooltipComponent } from "@appsmithorg/design-system-old";
```

### Create story template
```
yarn create-story -f <folder-name>
```
'folder-name' is the folder which holds the component which the story template is being created. This should be under 'src' folder.

Happy playground testing!

## Links

- [Home page](https://www.appsmith.com)
