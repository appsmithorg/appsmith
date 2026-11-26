/**
 * Extension point for edition-specific UI in the published app viewer.
 *
 * It renders inside the viewer after the app is initialized. The community
 * edition renders nothing here. Another edition can replace the file at
 * `ee/pages/AppViewer/ViewerEditionExtensions`.
 */
export function ViewerEditionExtensions() {
  return null;
}

export default ViewerEditionExtensions;
