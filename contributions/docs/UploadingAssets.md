# Uploading and using assets
Upload images & gifs to the `appsmith-docs/.gitbook/assets/` folder.
Asset files cannot be larger than 25mb.
Refer to the assets using a relative path from the root folder Ex. `.gitbook/assets/asset.jpg`

## Embedding Images & Gifs
Images are gifs can be embedded into a page using the following syntax
```
![Click to expand](/.gitbook/assets/asset-name.png)
```
The images should be focused on the content and not include unnecessary parts of the UI ex. header / empty canvas etc.
Gifs can be recorded using the a screen recorder like loom and converted to a gif using gifski. Gifs should be of 26 - 30 fps and be of high quality. If you do not have access to a good gif converter, please upload the video as is and raise a PR. We will be happy to help with Gif creation!

## Embedding Videos
Videos must be uploaded to the appsmith youtube channel. Contact nikhil@appsmith.com to have your video uploaded.
Videos must be of very high quality and abide by our [Code of Conduct](/CODE_OF_CONDUCT.md)
Videos can be embedded inside pages using the following syntax
```
{% embed url="https://www.youtube.com/watch?v=mzqK0QIZRLs&feature=youtu.be" %}
```
