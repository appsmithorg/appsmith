
Refer to [the README](https://github.com/appsmithorg/design-system/blob/main/packages/design-system/README.md#contribute) for a guide on how to get started with contributing.

## Using yalc

When you make a change in the design system, you will want to ensure that the component works as expected in the app you are using it for. To emulate working with published packages locally, we use [yalc](https://www.npmjs.com/package/yalc).

### Installation

Run 
```shell
yarn global add yalc
```

### Setting up for appsmith usage

If we're going to use this package in the `appsmith` repository, we need to make some additional changes to this repository.

1. navigate to the `package/design-system/package.json` file
2. Make sure you change the field `"name": "@appsmithorg/design-system"` to `"name": "design-system"`. We do this so that we don't run into alias conflicts later.
3. Make sure you do not commit this file

### In this repository 

We need to "publish" our package.

1. Make sure the package builds by running `yarn build`
2. Make sure the functionality works as expected in the playground by running `yarn storybook` and then testing your component out in the relevant story
3. If you are writing a new component, write a story for it taking another story from this repository as reference. You could also refer to [the official docs](https://storybook.js.org/docs/react/writing-stories/introduction#how-to-write-stories).
4. When you've done all of this, run `yalc publish`. It will output the package name and number.

### In the other repository

1. Run `yalc add design-system` in the appsmith repository.
2. This will create changes in your `package.lock` file. Run `yarn` to get the new package version from `yalc`.
3. This will create changes in your `yarn.lock` file, which is what we want. Make sure you do not commit these changes.

Now you can test your app while including the changes made in this package. Go ahead and run your local development environment, or some cypress tests.

Please note that yalc will not test any uncommitted changes you make in your file system. Make sure you have everything you need in the commits (you can always revert bad ones!) 


## Non-local testing 

You can create an alpha release of your branch so that other people can see and test your changes in a different repository (on a CI, for example). To do this, 

1. In your `package.json`, make sure the `version` key is set to be the latest alpha version listed on the `versions` tab on [our npm package listing](https://www.npmjs.com/package/@appsmithorg/design-system). If you don't do this, the alpha version you create will overwrite an existing version and bad things might happen. 
2. Run `./alpha-release.sh` in your shell. In order to complete this script, you will need an OTP which only members of the [@appsmithorg](https://www.npmjs.com/package/@appsmithorg/design-system) organisation on npm have access to. Please contact someone from the design system pod before you start this action.  

## Creating stories 

When you create a component, make sure you write a well-defined story for it. A well defined story is one that 
1. Denotes the default state of the component 
2. Denotes all the variants of the component 
3. Has a list of all the things the component can be

You can create a template for your stories by running 
```shell
yarn create-story -f <DIRECTORY_NAME>
```
where ideally your directory name matches your component name exactly. 

## Contribution Guidelines: Code Style

1. Destructure function props where possible: https://github.com/appsmithorg/design-system/pull/109
2. 

