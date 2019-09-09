Generate and move icons
=======================
TODO (abhinav): Write a bash script to do all of the following.
TODO (abhinav): Add svgo to the pipeline, to generate cleaner fonts based on cleaned up SVGs

For each font set
- (`yarn global add icon-font-generator`)[https://github.com/Workshape/icon-font-generator]
- `mkdir fonts/<dir>`
- `icon-font-generator ./<dir>/*.svg -o fonts/<dir> -n <Name of font>`
- `cp -r fonts <path-to-public-assets-folder>/`

Checklist before generating
- Verify that the SVG file names do not have typos
- Folder names for different SVG font sets must be the prefix of the font name (example: folder widgets with generate "Widget-Icons" font face)
