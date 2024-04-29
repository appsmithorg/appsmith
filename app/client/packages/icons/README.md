# Appsmith Icons

We automatically import icons from Figma, optimise and prepare some of them for further use in the main app.

> **_NOTE:_** All files in folders are created automatically. Do not change them manually, after running generation scripts, the changes will be lost. To make changes, see the files in the `utils` folder.

## How to use?

To update the icons, you only need to run the **generate-icons** script — `yarn run build`.

To make everything work right, you just need to set [Figma token](https://www.figma.com/developers/api#authentication) (press **Get personal access token**) in the `.env` file. It's easy to create `.env` file, just copy `.env.example`.

```typescript
import { ButtonIcon } from "appsmith-icons";

<ButtonIcon />
```

## Used packages

- [Figmagic](https://github.com/mikaelvesavuori/figmagic?tab=readme-ov-file) — provides an interface for importing graphics from Figma.
- [SVGO](https://github.com/svg/svgo) — optimizes SVG
