// See readme.md for why this file exists.

// Note: using type-only imports here to avoid circular dependencies between
// this file and BlueprintJS icon components. (The circular dependency
// may be created because this module replaces BlueprintJS's icon implementation.)
import type { IconName, IconSize } from "@blueprintjs/core";

// This type ensures we don’t forget to add a new icon or icon size
// when BlueprintJS updates its IconName or IconSize types.
//
// If IconName gets a new value, we’ll get a type error like
//   Property 'add' is missing in type '...' but required in type 'IconMapType'
type IconMapType = Record<
  IconName,
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  Record<IconSize, () => Promise<typeof import("*.svg")>>
>;

// Why use a huge `svgImportsMap` object instead of just doing
//   import(`assets/icons/blueprintjs/${iconSize}px/${iconName}.svg`)
// ?
//
// Two reasons:
// 1. With the import like above, webpack will bundle all the SVGs into the
//    a single chunk. This is precisely what we want to avoid: we want every icon
//    to be its own chunk, so that we can load them on demand.
// 2. Based on experiments, the import above only supports default exports,
//    whereas we need the `ReactComponent` named export.
const svgImportsMap: IconMapType = {
  add: {
    16: async () => import("assets/icons/blueprintjs/16px/add.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/add.svg"),
  },
  "add-column-left": {
    16: async () => import("assets/icons/blueprintjs/16px/add-column-left.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/add-column-left.svg"),
  },
  "add-column-right": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/add-column-right.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/add-column-right.svg"),
  },
  "add-row-bottom": {
    16: async () => import("assets/icons/blueprintjs/16px/add-row-bottom.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/add-row-bottom.svg"),
  },
  "add-row-top": {
    16: async () => import("assets/icons/blueprintjs/16px/add-row-top.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/add-row-top.svg"),
  },
  "add-to-artifact": {
    16: async () => import("assets/icons/blueprintjs/16px/add-to-artifact.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/add-to-artifact.svg"),
  },
  "add-to-folder": {
    16: async () => import("assets/icons/blueprintjs/16px/add-to-folder.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/add-to-folder.svg"),
  },
  airplane: {
    16: async () => import("assets/icons/blueprintjs/16px/airplane.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/airplane.svg"),
  },
  "align-center": {
    16: async () => import("assets/icons/blueprintjs/16px/align-center.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/align-center.svg"),
  },
  "align-justify": {
    16: async () => import("assets/icons/blueprintjs/16px/align-justify.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/align-justify.svg"),
  },
  "align-left": {
    16: async () => import("assets/icons/blueprintjs/16px/align-left.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/align-left.svg"),
  },
  "align-right": {
    16: async () => import("assets/icons/blueprintjs/16px/align-right.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/align-right.svg"),
  },
  "alignment-bottom": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/alignment-bottom.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/alignment-bottom.svg"),
  },
  "alignment-horizontal-center": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/alignment-horizontal-center.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/alignment-horizontal-center.svg"),
  },
  "alignment-left": {
    16: async () => import("assets/icons/blueprintjs/16px/alignment-left.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/alignment-left.svg"),
  },
  "alignment-right": {
    16: async () => import("assets/icons/blueprintjs/16px/alignment-right.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/alignment-right.svg"),
  },
  "alignment-top": {
    16: async () => import("assets/icons/blueprintjs/16px/alignment-top.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/alignment-top.svg"),
  },
  "alignment-vertical-center": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/alignment-vertical-center.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/alignment-vertical-center.svg"),
  },
  annotation: {
    16: async () => import("assets/icons/blueprintjs/16px/annotation.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/annotation.svg"),
  },
  "app-header": {
    16: async () => import("assets/icons/blueprintjs/16px/app-header.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/app-header.svg"),
  },
  application: {
    16: async () => import("assets/icons/blueprintjs/16px/application.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/application.svg"),
  },
  applications: {
    16: async () => import("assets/icons/blueprintjs/16px/applications.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/applications.svg"),
  },
  archive: {
    16: async () => import("assets/icons/blueprintjs/16px/archive.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/archive.svg"),
  },
  array: {
    16: async () => import("assets/icons/blueprintjs/16px/array.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/array.svg"),
  },
  "array-boolean": {
    16: async () => import("assets/icons/blueprintjs/16px/array-boolean.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/array-boolean.svg"),
  },
  "array-date": {
    16: async () => import("assets/icons/blueprintjs/16px/array-date.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/array-date.svg"),
  },
  "array-numeric": {
    16: async () => import("assets/icons/blueprintjs/16px/array-numeric.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/array-numeric.svg"),
  },
  "array-string": {
    16: async () => import("assets/icons/blueprintjs/16px/array-string.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/array-string.svg"),
  },
  "array-timestamp": {
    16: async () => import("assets/icons/blueprintjs/16px/array-timestamp.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/array-timestamp.svg"),
  },
  "arrow-bottom-left": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/arrow-bottom-left.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/arrow-bottom-left.svg"),
  },
  "arrow-bottom-right": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/arrow-bottom-right.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/arrow-bottom-right.svg"),
  },
  "arrow-down": {
    16: async () => import("assets/icons/blueprintjs/16px/arrow-down.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/arrow-down.svg"),
  },
  "arrow-left": {
    16: async () => import("assets/icons/blueprintjs/16px/arrow-left.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/arrow-left.svg"),
  },
  "arrow-right": {
    16: async () => import("assets/icons/blueprintjs/16px/arrow-right.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/arrow-right.svg"),
  },
  "arrow-top-left": {
    16: async () => import("assets/icons/blueprintjs/16px/arrow-top-left.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/arrow-top-left.svg"),
  },
  "arrow-top-right": {
    16: async () => import("assets/icons/blueprintjs/16px/arrow-top-right.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/arrow-top-right.svg"),
  },
  "arrow-up": {
    16: async () => import("assets/icons/blueprintjs/16px/arrow-up.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/arrow-up.svg"),
  },
  "arrows-horizontal": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/arrows-horizontal.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/arrows-horizontal.svg"),
  },
  "arrows-vertical": {
    16: async () => import("assets/icons/blueprintjs/16px/arrows-vertical.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/arrows-vertical.svg"),
  },
  asterisk: {
    16: async () => import("assets/icons/blueprintjs/16px/asterisk.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/asterisk.svg"),
  },
  "automatic-updates": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/automatic-updates.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/automatic-updates.svg"),
  },
  backlink: {
    16: async () => import("assets/icons/blueprintjs/16px/backlink.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/backlink.svg"),
  },
  badge: {
    16: async () => import("assets/icons/blueprintjs/16px/badge.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/badge.svg"),
  },
  "ban-circle": {
    16: async () => import("assets/icons/blueprintjs/16px/ban-circle.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/ban-circle.svg"),
  },
  "bank-account": {
    16: async () => import("assets/icons/blueprintjs/16px/bank-account.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/bank-account.svg"),
  },
  barcode: {
    16: async () => import("assets/icons/blueprintjs/16px/barcode.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/barcode.svg"),
  },
  blank: {
    16: async () => import("assets/icons/blueprintjs/16px/blank.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/blank.svg"),
  },
  "blocked-person": {
    16: async () => import("assets/icons/blueprintjs/16px/blocked-person.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/blocked-person.svg"),
  },
  bold: {
    16: async () => import("assets/icons/blueprintjs/16px/bold.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/bold.svg"),
  },
  book: {
    16: async () => import("assets/icons/blueprintjs/16px/book.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/book.svg"),
  },
  bookmark: {
    16: async () => import("assets/icons/blueprintjs/16px/bookmark.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/bookmark.svg"),
  },
  box: {
    16: async () => import("assets/icons/blueprintjs/16px/box.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/box.svg"),
  },
  briefcase: {
    16: async () => import("assets/icons/blueprintjs/16px/briefcase.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/briefcase.svg"),
  },
  "bring-data": {
    16: async () => import("assets/icons/blueprintjs/16px/bring-data.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/bring-data.svg"),
  },
  build: {
    16: async () => import("assets/icons/blueprintjs/16px/build.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/build.svg"),
  },
  calculator: {
    16: async () => import("assets/icons/blueprintjs/16px/calculator.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/calculator.svg"),
  },
  calendar: {
    16: async () => import("assets/icons/blueprintjs/16px/calendar.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/calendar.svg"),
  },
  camera: {
    16: async () => import("assets/icons/blueprintjs/16px/camera.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/camera.svg"),
  },
  "caret-down": {
    16: async () => import("assets/icons/blueprintjs/16px/caret-down.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/caret-down.svg"),
  },
  "caret-left": {
    16: async () => import("assets/icons/blueprintjs/16px/caret-left.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/caret-left.svg"),
  },
  "caret-right": {
    16: async () => import("assets/icons/blueprintjs/16px/caret-right.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/caret-right.svg"),
  },
  "caret-up": {
    16: async () => import("assets/icons/blueprintjs/16px/caret-up.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/caret-up.svg"),
  },
  "cell-tower": {
    16: async () => import("assets/icons/blueprintjs/16px/cell-tower.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/cell-tower.svg"),
  },
  changes: {
    16: async () => import("assets/icons/blueprintjs/16px/changes.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/changes.svg"),
  },
  chart: {
    16: async () => import("assets/icons/blueprintjs/16px/chart.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/chart.svg"),
  },
  chat: {
    16: async () => import("assets/icons/blueprintjs/16px/chat.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/chat.svg"),
  },
  "chevron-backward": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/chevron-backward.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/chevron-backward.svg"),
  },
  "chevron-down": {
    16: async () => import("assets/icons/blueprintjs/16px/chevron-down.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/chevron-down.svg"),
  },
  "chevron-forward": {
    16: async () => import("assets/icons/blueprintjs/16px/chevron-forward.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/chevron-forward.svg"),
  },
  "chevron-left": {
    16: async () => import("assets/icons/blueprintjs/16px/chevron-left.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/chevron-left.svg"),
  },
  "chevron-right": {
    16: async () => import("assets/icons/blueprintjs/16px/chevron-right.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/chevron-right.svg"),
  },
  "chevron-up": {
    16: async () => import("assets/icons/blueprintjs/16px/chevron-up.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/chevron-up.svg"),
  },
  circle: {
    16: async () => import("assets/icons/blueprintjs/16px/circle.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/circle.svg"),
  },
  "circle-arrow-down": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/circle-arrow-down.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/circle-arrow-down.svg"),
  },
  "circle-arrow-left": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/circle-arrow-left.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/circle-arrow-left.svg"),
  },
  "circle-arrow-right": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/circle-arrow-right.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/circle-arrow-right.svg"),
  },
  "circle-arrow-up": {
    16: async () => import("assets/icons/blueprintjs/16px/circle-arrow-up.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/circle-arrow-up.svg"),
  },
  citation: {
    16: async () => import("assets/icons/blueprintjs/16px/citation.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/citation.svg"),
  },
  clean: {
    16: async () => import("assets/icons/blueprintjs/16px/clean.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/clean.svg"),
  },
  clipboard: {
    16: async () => import("assets/icons/blueprintjs/16px/clipboard.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/clipboard.svg"),
  },
  cloud: {
    16: async () => import("assets/icons/blueprintjs/16px/cloud.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/cloud.svg"),
  },
  "cloud-download": {
    16: async () => import("assets/icons/blueprintjs/16px/cloud-download.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/cloud-download.svg"),
  },
  "cloud-upload": {
    16: async () => import("assets/icons/blueprintjs/16px/cloud-upload.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/cloud-upload.svg"),
  },
  code: {
    16: async () => import("assets/icons/blueprintjs/16px/code.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/code.svg"),
  },
  "code-block": {
    16: async () => import("assets/icons/blueprintjs/16px/code-block.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/code-block.svg"),
  },
  cog: {
    16: async () => import("assets/icons/blueprintjs/16px/cog.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/cog.svg"),
  },
  "collapse-all": {
    16: async () => import("assets/icons/blueprintjs/16px/collapse-all.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/collapse-all.svg"),
  },
  "column-layout": {
    16: async () => import("assets/icons/blueprintjs/16px/column-layout.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/column-layout.svg"),
  },
  comment: {
    16: async () => import("assets/icons/blueprintjs/16px/comment.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/comment.svg"),
  },
  comparison: {
    16: async () => import("assets/icons/blueprintjs/16px/comparison.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/comparison.svg"),
  },
  compass: {
    16: async () => import("assets/icons/blueprintjs/16px/compass.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/compass.svg"),
  },
  compressed: {
    16: async () => import("assets/icons/blueprintjs/16px/compressed.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/compressed.svg"),
  },
  confirm: {
    16: async () => import("assets/icons/blueprintjs/16px/confirm.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/confirm.svg"),
  },
  console: {
    16: async () => import("assets/icons/blueprintjs/16px/console.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/console.svg"),
  },
  contrast: {
    16: async () => import("assets/icons/blueprintjs/16px/contrast.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/contrast.svg"),
  },
  control: {
    16: async () => import("assets/icons/blueprintjs/16px/control.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/control.svg"),
  },
  "credit-card": {
    16: async () => import("assets/icons/blueprintjs/16px/credit-card.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/credit-card.svg"),
  },
  cross: {
    16: async () => import("assets/icons/blueprintjs/16px/cross.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/cross.svg"),
  },
  crown: {
    16: async () => import("assets/icons/blueprintjs/16px/crown.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/crown.svg"),
  },
  cube: {
    16: async () => import("assets/icons/blueprintjs/16px/cube.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/cube.svg"),
  },
  "cube-add": {
    16: async () => import("assets/icons/blueprintjs/16px/cube-add.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/cube-add.svg"),
  },
  "cube-remove": {
    16: async () => import("assets/icons/blueprintjs/16px/cube-remove.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/cube-remove.svg"),
  },
  "curved-range-chart": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/curved-range-chart.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/curved-range-chart.svg"),
  },
  cut: {
    16: async () => import("assets/icons/blueprintjs/16px/cut.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/cut.svg"),
  },
  cycle: {
    16: async () => import("assets/icons/blueprintjs/16px/cycle.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/cycle.svg"),
  },
  dashboard: {
    16: async () => import("assets/icons/blueprintjs/16px/dashboard.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/dashboard.svg"),
  },
  "data-connection": {
    16: async () => import("assets/icons/blueprintjs/16px/data-connection.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/data-connection.svg"),
  },
  "data-lineage": {
    16: async () => import("assets/icons/blueprintjs/16px/data-lineage.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/data-lineage.svg"),
  },
  database: {
    16: async () => import("assets/icons/blueprintjs/16px/database.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/database.svg"),
  },
  delete: {
    16: async () => import("assets/icons/blueprintjs/16px/delete.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/delete.svg"),
  },
  delta: {
    16: async () => import("assets/icons/blueprintjs/16px/delta.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/delta.svg"),
  },
  "derive-column": {
    16: async () => import("assets/icons/blueprintjs/16px/derive-column.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/derive-column.svg"),
  },
  desktop: {
    16: async () => import("assets/icons/blueprintjs/16px/desktop.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/desktop.svg"),
  },
  diagnosis: {
    16: async () => import("assets/icons/blueprintjs/16px/diagnosis.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/diagnosis.svg"),
  },
  "diagram-tree": {
    16: async () => import("assets/icons/blueprintjs/16px/diagram-tree.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/diagram-tree.svg"),
  },
  "direction-left": {
    16: async () => import("assets/icons/blueprintjs/16px/direction-left.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/direction-left.svg"),
  },
  "direction-right": {
    16: async () => import("assets/icons/blueprintjs/16px/direction-right.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/direction-right.svg"),
  },
  disable: {
    16: async () => import("assets/icons/blueprintjs/16px/disable.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/disable.svg"),
  },
  document: {
    16: async () => import("assets/icons/blueprintjs/16px/document.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/document.svg"),
  },
  "document-open": {
    16: async () => import("assets/icons/blueprintjs/16px/document-open.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/document-open.svg"),
  },
  "document-share": {
    16: async () => import("assets/icons/blueprintjs/16px/document-share.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/document-share.svg"),
  },
  dollar: {
    16: async () => import("assets/icons/blueprintjs/16px/dollar.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/dollar.svg"),
  },
  dot: {
    16: async () => import("assets/icons/blueprintjs/16px/dot.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/dot.svg"),
  },
  "double-caret-horizontal": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/double-caret-horizontal.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/double-caret-horizontal.svg"),
  },
  "double-caret-vertical": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/double-caret-vertical.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/double-caret-vertical.svg"),
  },
  "double-chevron-down": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/double-chevron-down.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/double-chevron-down.svg"),
  },
  "double-chevron-left": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/double-chevron-left.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/double-chevron-left.svg"),
  },
  "double-chevron-right": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/double-chevron-right.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/double-chevron-right.svg"),
  },
  "double-chevron-up": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/double-chevron-up.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/double-chevron-up.svg"),
  },
  "doughnut-chart": {
    16: async () => import("assets/icons/blueprintjs/16px/doughnut-chart.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/doughnut-chart.svg"),
  },
  download: {
    16: async () => import("assets/icons/blueprintjs/16px/download.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/download.svg"),
  },
  "drag-handle-horizontal": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/drag-handle-horizontal.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/drag-handle-horizontal.svg"),
  },
  "drag-handle-vertical": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/drag-handle-vertical.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/drag-handle-vertical.svg"),
  },
  draw: {
    16: async () => import("assets/icons/blueprintjs/16px/draw.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/draw.svg"),
  },
  "drawer-left": {
    16: async () => import("assets/icons/blueprintjs/16px/drawer-left.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/drawer-left.svg"),
  },
  "drawer-left-filled": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/drawer-left-filled.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/drawer-left-filled.svg"),
  },
  "drawer-right": {
    16: async () => import("assets/icons/blueprintjs/16px/drawer-right.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/drawer-right.svg"),
  },
  "drawer-right-filled": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/drawer-right-filled.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/drawer-right-filled.svg"),
  },
  "drive-time": {
    16: async () => import("assets/icons/blueprintjs/16px/drive-time.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/drive-time.svg"),
  },
  duplicate: {
    16: async () => import("assets/icons/blueprintjs/16px/duplicate.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/duplicate.svg"),
  },
  edit: {
    16: async () => import("assets/icons/blueprintjs/16px/edit.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/edit.svg"),
  },
  eject: {
    16: async () => import("assets/icons/blueprintjs/16px/eject.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/eject.svg"),
  },
  endorsed: {
    16: async () => import("assets/icons/blueprintjs/16px/endorsed.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/endorsed.svg"),
  },
  envelope: {
    16: async () => import("assets/icons/blueprintjs/16px/envelope.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/envelope.svg"),
  },
  equals: {
    16: async () => import("assets/icons/blueprintjs/16px/equals.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/equals.svg"),
  },
  eraser: {
    16: async () => import("assets/icons/blueprintjs/16px/eraser.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/eraser.svg"),
  },
  error: {
    16: async () => import("assets/icons/blueprintjs/16px/error.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/error.svg"),
  },
  euro: {
    16: async () => import("assets/icons/blueprintjs/16px/euro.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/euro.svg"),
  },
  exchange: {
    16: async () => import("assets/icons/blueprintjs/16px/exchange.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/exchange.svg"),
  },
  "exclude-row": {
    16: async () => import("assets/icons/blueprintjs/16px/exclude-row.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/exclude-row.svg"),
  },
  "expand-all": {
    16: async () => import("assets/icons/blueprintjs/16px/expand-all.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/expand-all.svg"),
  },
  export: {
    16: async () => import("assets/icons/blueprintjs/16px/export.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/export.svg"),
  },
  "eye-off": {
    16: async () => import("assets/icons/blueprintjs/16px/eye-off.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/eye-off.svg"),
  },
  "eye-on": {
    16: async () => import("assets/icons/blueprintjs/16px/eye-on.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/eye-on.svg"),
  },
  "eye-open": {
    16: async () => import("assets/icons/blueprintjs/16px/eye-open.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/eye-open.svg"),
  },
  "fast-backward": {
    16: async () => import("assets/icons/blueprintjs/16px/fast-backward.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/fast-backward.svg"),
  },
  "fast-forward": {
    16: async () => import("assets/icons/blueprintjs/16px/fast-forward.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/fast-forward.svg"),
  },
  feed: {
    16: async () => import("assets/icons/blueprintjs/16px/feed.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/feed.svg"),
  },
  "feed-subscribed": {
    16: async () => import("assets/icons/blueprintjs/16px/feed-subscribed.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/feed-subscribed.svg"),
  },
  film: {
    16: async () => import("assets/icons/blueprintjs/16px/film.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/film.svg"),
  },
  filter: {
    16: async () => import("assets/icons/blueprintjs/16px/filter.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/filter.svg"),
  },
  "filter-keep": {
    16: async () => import("assets/icons/blueprintjs/16px/filter-keep.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/filter-keep.svg"),
  },
  "filter-list": {
    16: async () => import("assets/icons/blueprintjs/16px/filter-list.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/filter-list.svg"),
  },
  "filter-open": {
    16: async () => import("assets/icons/blueprintjs/16px/filter-open.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/filter-open.svg"),
  },
  "filter-remove": {
    16: async () => import("assets/icons/blueprintjs/16px/filter-remove.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/filter-remove.svg"),
  },
  flag: {
    16: async () => import("assets/icons/blueprintjs/16px/flag.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/flag.svg"),
  },
  flame: {
    16: async () => import("assets/icons/blueprintjs/16px/flame.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/flame.svg"),
  },
  flash: {
    16: async () => import("assets/icons/blueprintjs/16px/flash.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/flash.svg"),
  },
  "floppy-disk": {
    16: async () => import("assets/icons/blueprintjs/16px/floppy-disk.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/floppy-disk.svg"),
  },
  "flow-branch": {
    16: async () => import("assets/icons/blueprintjs/16px/flow-branch.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/flow-branch.svg"),
  },
  "flow-end": {
    16: async () => import("assets/icons/blueprintjs/16px/flow-end.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/flow-end.svg"),
  },
  "flow-linear": {
    16: async () => import("assets/icons/blueprintjs/16px/flow-linear.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/flow-linear.svg"),
  },
  "flow-review": {
    16: async () => import("assets/icons/blueprintjs/16px/flow-review.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/flow-review.svg"),
  },
  "flow-review-branch": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/flow-review-branch.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/flow-review-branch.svg"),
  },
  flows: {
    16: async () => import("assets/icons/blueprintjs/16px/flows.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/flows.svg"),
  },
  "folder-close": {
    16: async () => import("assets/icons/blueprintjs/16px/folder-close.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/folder-close.svg"),
  },
  "folder-new": {
    16: async () => import("assets/icons/blueprintjs/16px/folder-new.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/folder-new.svg"),
  },
  "folder-open": {
    16: async () => import("assets/icons/blueprintjs/16px/folder-open.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/folder-open.svg"),
  },
  "folder-shared": {
    16: async () => import("assets/icons/blueprintjs/16px/folder-shared.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/folder-shared.svg"),
  },
  "folder-shared-open": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/folder-shared-open.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/folder-shared-open.svg"),
  },
  follower: {
    16: async () => import("assets/icons/blueprintjs/16px/follower.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/follower.svg"),
  },
  following: {
    16: async () => import("assets/icons/blueprintjs/16px/following.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/following.svg"),
  },
  font: {
    16: async () => import("assets/icons/blueprintjs/16px/font.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/font.svg"),
  },
  fork: {
    16: async () => import("assets/icons/blueprintjs/16px/fork.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/fork.svg"),
  },
  form: {
    16: async () => import("assets/icons/blueprintjs/16px/form.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/form.svg"),
  },
  "full-circle": {
    16: async () => import("assets/icons/blueprintjs/16px/full-circle.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/full-circle.svg"),
  },
  "full-stacked-chart": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/full-stacked-chart.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/full-stacked-chart.svg"),
  },
  fullscreen: {
    16: async () => import("assets/icons/blueprintjs/16px/fullscreen.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/fullscreen.svg"),
  },
  function: {
    16: async () => import("assets/icons/blueprintjs/16px/function.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/function.svg"),
  },
  "gantt-chart": {
    16: async () => import("assets/icons/blueprintjs/16px/gantt-chart.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/gantt-chart.svg"),
  },
  geofence: {
    16: async () => import("assets/icons/blueprintjs/16px/geofence.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/geofence.svg"),
  },
  geolocation: {
    16: async () => import("assets/icons/blueprintjs/16px/geolocation.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/geolocation.svg"),
  },
  geosearch: {
    16: async () => import("assets/icons/blueprintjs/16px/geosearch.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/geosearch.svg"),
  },
  "git-branch": {
    16: async () => import("assets/icons/blueprintjs/16px/git-branch.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/git-branch.svg"),
  },
  "git-commit": {
    16: async () => import("assets/icons/blueprintjs/16px/git-commit.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/git-commit.svg"),
  },
  "git-merge": {
    16: async () => import("assets/icons/blueprintjs/16px/git-merge.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/git-merge.svg"),
  },
  "git-new-branch": {
    16: async () => import("assets/icons/blueprintjs/16px/git-new-branch.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/git-new-branch.svg"),
  },
  "git-pull": {
    16: async () => import("assets/icons/blueprintjs/16px/git-pull.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/git-pull.svg"),
  },
  "git-push": {
    16: async () => import("assets/icons/blueprintjs/16px/git-push.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/git-push.svg"),
  },
  "git-repo": {
    16: async () => import("assets/icons/blueprintjs/16px/git-repo.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/git-repo.svg"),
  },
  glass: {
    16: async () => import("assets/icons/blueprintjs/16px/glass.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/glass.svg"),
  },
  globe: {
    16: async () => import("assets/icons/blueprintjs/16px/globe.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/globe.svg"),
  },
  "globe-network": {
    16: async () => import("assets/icons/blueprintjs/16px/globe-network.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/globe-network.svg"),
  },
  graph: {
    16: async () => import("assets/icons/blueprintjs/16px/graph.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/graph.svg"),
  },
  "graph-remove": {
    16: async () => import("assets/icons/blueprintjs/16px/graph-remove.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/graph-remove.svg"),
  },
  "greater-than": {
    16: async () => import("assets/icons/blueprintjs/16px/greater-than.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/greater-than.svg"),
  },
  "greater-than-or-equal-to": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/greater-than-or-equal-to.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/greater-than-or-equal-to.svg"),
  },
  grid: {
    16: async () => import("assets/icons/blueprintjs/16px/grid.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/grid.svg"),
  },
  "grid-view": {
    16: async () => import("assets/icons/blueprintjs/16px/grid-view.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/grid-view.svg"),
  },
  "group-objects": {
    16: async () => import("assets/icons/blueprintjs/16px/group-objects.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/group-objects.svg"),
  },
  "grouped-bar-chart": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/grouped-bar-chart.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/grouped-bar-chart.svg"),
  },
  hand: {
    16: async () => import("assets/icons/blueprintjs/16px/hand.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/hand.svg"),
  },
  "hand-down": {
    16: async () => import("assets/icons/blueprintjs/16px/hand-down.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/hand-down.svg"),
  },
  "hand-left": {
    16: async () => import("assets/icons/blueprintjs/16px/hand-left.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/hand-left.svg"),
  },
  "hand-right": {
    16: async () => import("assets/icons/blueprintjs/16px/hand-right.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/hand-right.svg"),
  },
  "hand-up": {
    16: async () => import("assets/icons/blueprintjs/16px/hand-up.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/hand-up.svg"),
  },
  hat: {
    16: async () => import("assets/icons/blueprintjs/16px/hat.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/hat.svg"),
  },
  header: {
    16: async () => import("assets/icons/blueprintjs/16px/header.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/header.svg"),
  },
  "header-one": {
    16: async () => import("assets/icons/blueprintjs/16px/header-one.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/header-one.svg"),
  },
  "header-two": {
    16: async () => import("assets/icons/blueprintjs/16px/header-two.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/header-two.svg"),
  },
  headset: {
    16: async () => import("assets/icons/blueprintjs/16px/headset.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/headset.svg"),
  },
  heart: {
    16: async () => import("assets/icons/blueprintjs/16px/heart.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/heart.svg"),
  },
  "heart-broken": {
    16: async () => import("assets/icons/blueprintjs/16px/heart-broken.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/heart-broken.svg"),
  },
  "heat-grid": {
    16: async () => import("assets/icons/blueprintjs/16px/heat-grid.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/heat-grid.svg"),
  },
  heatmap: {
    16: async () => import("assets/icons/blueprintjs/16px/heatmap.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/heatmap.svg"),
  },
  help: {
    16: async () => import("assets/icons/blueprintjs/16px/help.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/help.svg"),
  },
  "helper-management": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/helper-management.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/helper-management.svg"),
  },
  highlight: {
    16: async () => import("assets/icons/blueprintjs/16px/highlight.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/highlight.svg"),
  },
  history: {
    16: async () => import("assets/icons/blueprintjs/16px/history.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/history.svg"),
  },
  home: {
    16: async () => import("assets/icons/blueprintjs/16px/home.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/home.svg"),
  },
  "horizontal-bar-chart": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/horizontal-bar-chart.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/horizontal-bar-chart.svg"),
  },
  "horizontal-bar-chart-asc": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/horizontal-bar-chart-asc.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/horizontal-bar-chart-asc.svg"),
  },
  "horizontal-bar-chart-desc": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/horizontal-bar-chart-desc.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/horizontal-bar-chart-desc.svg"),
  },
  "horizontal-distribution": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/horizontal-distribution.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/horizontal-distribution.svg"),
  },
  "id-number": {
    16: async () => import("assets/icons/blueprintjs/16px/id-number.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/id-number.svg"),
  },
  "image-rotate-left": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/image-rotate-left.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/image-rotate-left.svg"),
  },
  "image-rotate-right": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/image-rotate-right.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/image-rotate-right.svg"),
  },
  import: {
    16: async () => import("assets/icons/blueprintjs/16px/import.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/import.svg"),
  },
  inbox: {
    16: async () => import("assets/icons/blueprintjs/16px/inbox.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/inbox.svg"),
  },
  "inbox-filtered": {
    16: async () => import("assets/icons/blueprintjs/16px/inbox-filtered.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/inbox-filtered.svg"),
  },
  "inbox-geo": {
    16: async () => import("assets/icons/blueprintjs/16px/inbox-geo.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/inbox-geo.svg"),
  },
  "inbox-search": {
    16: async () => import("assets/icons/blueprintjs/16px/inbox-search.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/inbox-search.svg"),
  },
  "inbox-update": {
    16: async () => import("assets/icons/blueprintjs/16px/inbox-update.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/inbox-update.svg"),
  },
  "info-sign": {
    16: async () => import("assets/icons/blueprintjs/16px/info-sign.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/info-sign.svg"),
  },
  inheritance: {
    16: async () => import("assets/icons/blueprintjs/16px/inheritance.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/inheritance.svg"),
  },
  "inherited-group": {
    16: async () => import("assets/icons/blueprintjs/16px/inherited-group.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/inherited-group.svg"),
  },
  "inner-join": {
    16: async () => import("assets/icons/blueprintjs/16px/inner-join.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/inner-join.svg"),
  },
  insert: {
    16: async () => import("assets/icons/blueprintjs/16px/insert.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/insert.svg"),
  },
  intersection: {
    16: async () => import("assets/icons/blueprintjs/16px/intersection.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/intersection.svg"),
  },
  "ip-address": {
    16: async () => import("assets/icons/blueprintjs/16px/ip-address.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/ip-address.svg"),
  },
  issue: {
    16: async () => import("assets/icons/blueprintjs/16px/issue.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/issue.svg"),
  },
  "issue-closed": {
    16: async () => import("assets/icons/blueprintjs/16px/issue-closed.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/issue-closed.svg"),
  },
  "issue-new": {
    16: async () => import("assets/icons/blueprintjs/16px/issue-new.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/issue-new.svg"),
  },
  italic: {
    16: async () => import("assets/icons/blueprintjs/16px/italic.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/italic.svg"),
  },
  "join-table": {
    16: async () => import("assets/icons/blueprintjs/16px/join-table.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/join-table.svg"),
  },
  key: {
    16: async () => import("assets/icons/blueprintjs/16px/key.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/key.svg"),
  },
  "key-backspace": {
    16: async () => import("assets/icons/blueprintjs/16px/key-backspace.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/key-backspace.svg"),
  },
  "key-command": {
    16: async () => import("assets/icons/blueprintjs/16px/key-command.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/key-command.svg"),
  },
  "key-control": {
    16: async () => import("assets/icons/blueprintjs/16px/key-control.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/key-control.svg"),
  },
  "key-delete": {
    16: async () => import("assets/icons/blueprintjs/16px/key-delete.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/key-delete.svg"),
  },
  "key-enter": {
    16: async () => import("assets/icons/blueprintjs/16px/key-enter.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/key-enter.svg"),
  },
  "key-escape": {
    16: async () => import("assets/icons/blueprintjs/16px/key-escape.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/key-escape.svg"),
  },
  "key-option": {
    16: async () => import("assets/icons/blueprintjs/16px/key-option.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/key-option.svg"),
  },
  "key-shift": {
    16: async () => import("assets/icons/blueprintjs/16px/key-shift.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/key-shift.svg"),
  },
  "key-tab": {
    16: async () => import("assets/icons/blueprintjs/16px/key-tab.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/key-tab.svg"),
  },
  "known-vehicle": {
    16: async () => import("assets/icons/blueprintjs/16px/known-vehicle.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/known-vehicle.svg"),
  },
  "lab-test": {
    16: async () => import("assets/icons/blueprintjs/16px/lab-test.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/lab-test.svg"),
  },
  label: {
    16: async () => import("assets/icons/blueprintjs/16px/label.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/label.svg"),
  },
  layer: {
    16: async () => import("assets/icons/blueprintjs/16px/layer.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/layer.svg"),
  },
  layers: {
    16: async () => import("assets/icons/blueprintjs/16px/layers.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/layers.svg"),
  },
  layout: {
    16: async () => import("assets/icons/blueprintjs/16px/layout.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/layout.svg"),
  },
  "layout-auto": {
    16: async () => import("assets/icons/blueprintjs/16px/layout-auto.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/layout-auto.svg"),
  },
  "layout-balloon": {
    16: async () => import("assets/icons/blueprintjs/16px/layout-balloon.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/layout-balloon.svg"),
  },
  "layout-circle": {
    16: async () => import("assets/icons/blueprintjs/16px/layout-circle.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/layout-circle.svg"),
  },
  "layout-grid": {
    16: async () => import("assets/icons/blueprintjs/16px/layout-grid.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/layout-grid.svg"),
  },
  "layout-group-by": {
    16: async () => import("assets/icons/blueprintjs/16px/layout-group-by.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/layout-group-by.svg"),
  },
  "layout-hierarchy": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/layout-hierarchy.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/layout-hierarchy.svg"),
  },
  "layout-linear": {
    16: async () => import("assets/icons/blueprintjs/16px/layout-linear.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/layout-linear.svg"),
  },
  "layout-skew-grid": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/layout-skew-grid.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/layout-skew-grid.svg"),
  },
  "layout-sorted-clusters": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/layout-sorted-clusters.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/layout-sorted-clusters.svg"),
  },
  learning: {
    16: async () => import("assets/icons/blueprintjs/16px/learning.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/learning.svg"),
  },
  "left-join": {
    16: async () => import("assets/icons/blueprintjs/16px/left-join.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/left-join.svg"),
  },
  "less-than": {
    16: async () => import("assets/icons/blueprintjs/16px/less-than.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/less-than.svg"),
  },
  "less-than-or-equal-to": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/less-than-or-equal-to.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/less-than-or-equal-to.svg"),
  },
  lifesaver: {
    16: async () => import("assets/icons/blueprintjs/16px/lifesaver.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/lifesaver.svg"),
  },
  lightbulb: {
    16: async () => import("assets/icons/blueprintjs/16px/lightbulb.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/lightbulb.svg"),
  },
  link: {
    16: async () => import("assets/icons/blueprintjs/16px/link.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/link.svg"),
  },
  list: {
    16: async () => import("assets/icons/blueprintjs/16px/list.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/list.svg"),
  },
  "list-columns": {
    16: async () => import("assets/icons/blueprintjs/16px/list-columns.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/list-columns.svg"),
  },
  "list-detail-view": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/list-detail-view.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/list-detail-view.svg"),
  },
  locate: {
    16: async () => import("assets/icons/blueprintjs/16px/locate.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/locate.svg"),
  },
  lock: {
    16: async () => import("assets/icons/blueprintjs/16px/lock.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/lock.svg"),
  },
  "log-in": {
    16: async () => import("assets/icons/blueprintjs/16px/log-in.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/log-in.svg"),
  },
  "log-out": {
    16: async () => import("assets/icons/blueprintjs/16px/log-out.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/log-out.svg"),
  },
  manual: {
    16: async () => import("assets/icons/blueprintjs/16px/manual.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/manual.svg"),
  },
  "manually-entered-data": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/manually-entered-data.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/manually-entered-data.svg"),
  },
  map: {
    16: async () => import("assets/icons/blueprintjs/16px/map.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/map.svg"),
  },
  "map-create": {
    16: async () => import("assets/icons/blueprintjs/16px/map-create.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/map-create.svg"),
  },
  "map-marker": {
    16: async () => import("assets/icons/blueprintjs/16px/map-marker.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/map-marker.svg"),
  },
  maximize: {
    16: async () => import("assets/icons/blueprintjs/16px/maximize.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/maximize.svg"),
  },
  media: {
    16: async () => import("assets/icons/blueprintjs/16px/media.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/media.svg"),
  },
  menu: {
    16: async () => import("assets/icons/blueprintjs/16px/menu.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/menu.svg"),
  },
  "menu-closed": {
    16: async () => import("assets/icons/blueprintjs/16px/menu-closed.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/menu-closed.svg"),
  },
  "menu-open": {
    16: async () => import("assets/icons/blueprintjs/16px/menu-open.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/menu-open.svg"),
  },
  "merge-columns": {
    16: async () => import("assets/icons/blueprintjs/16px/merge-columns.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/merge-columns.svg"),
  },
  "merge-links": {
    16: async () => import("assets/icons/blueprintjs/16px/merge-links.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/merge-links.svg"),
  },
  minimize: {
    16: async () => import("assets/icons/blueprintjs/16px/minimize.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/minimize.svg"),
  },
  minus: {
    16: async () => import("assets/icons/blueprintjs/16px/minus.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/minus.svg"),
  },
  "mobile-phone": {
    16: async () => import("assets/icons/blueprintjs/16px/mobile-phone.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/mobile-phone.svg"),
  },
  "mobile-video": {
    16: async () => import("assets/icons/blueprintjs/16px/mobile-video.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/mobile-video.svg"),
  },
  modal: {
    16: async () => import("assets/icons/blueprintjs/16px/modal.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/modal.svg"),
  },
  "modal-filled": {
    16: async () => import("assets/icons/blueprintjs/16px/modal-filled.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/modal-filled.svg"),
  },
  moon: {
    16: async () => import("assets/icons/blueprintjs/16px/moon.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/moon.svg"),
  },
  more: {
    16: async () => import("assets/icons/blueprintjs/16px/more.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/more.svg"),
  },
  mountain: {
    16: async () => import("assets/icons/blueprintjs/16px/mountain.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/mountain.svg"),
  },
  move: {
    16: async () => import("assets/icons/blueprintjs/16px/move.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/move.svg"),
  },
  mugshot: {
    16: async () => import("assets/icons/blueprintjs/16px/mugshot.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/mugshot.svg"),
  },
  "multi-select": {
    16: async () => import("assets/icons/blueprintjs/16px/multi-select.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/multi-select.svg"),
  },
  music: {
    16: async () => import("assets/icons/blueprintjs/16px/music.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/music.svg"),
  },
  "new-drawing": {
    16: async () => import("assets/icons/blueprintjs/16px/new-drawing.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/new-drawing.svg"),
  },
  "new-grid-item": {
    16: async () => import("assets/icons/blueprintjs/16px/new-grid-item.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/new-grid-item.svg"),
  },
  "new-layer": {
    16: async () => import("assets/icons/blueprintjs/16px/new-layer.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/new-layer.svg"),
  },
  "new-layers": {
    16: async () => import("assets/icons/blueprintjs/16px/new-layers.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/new-layers.svg"),
  },
  "new-link": {
    16: async () => import("assets/icons/blueprintjs/16px/new-link.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/new-link.svg"),
  },
  "new-object": {
    16: async () => import("assets/icons/blueprintjs/16px/new-object.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/new-object.svg"),
  },
  "new-person": {
    16: async () => import("assets/icons/blueprintjs/16px/new-person.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/new-person.svg"),
  },
  "new-prescription": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/new-prescription.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/new-prescription.svg"),
  },
  "new-text-box": {
    16: async () => import("assets/icons/blueprintjs/16px/new-text-box.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/new-text-box.svg"),
  },
  ninja: {
    16: async () => import("assets/icons/blueprintjs/16px/ninja.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/ninja.svg"),
  },
  "not-equal-to": {
    16: async () => import("assets/icons/blueprintjs/16px/not-equal-to.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/not-equal-to.svg"),
  },
  notifications: {
    16: async () => import("assets/icons/blueprintjs/16px/notifications.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/notifications.svg"),
  },
  "notifications-updated": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/notifications-updated.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/notifications-updated.svg"),
  },
  "numbered-list": {
    16: async () => import("assets/icons/blueprintjs/16px/numbered-list.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/numbered-list.svg"),
  },
  numerical: {
    16: async () => import("assets/icons/blueprintjs/16px/numerical.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/numerical.svg"),
  },
  office: {
    16: async () => import("assets/icons/blueprintjs/16px/office.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/office.svg"),
  },
  offline: {
    16: async () => import("assets/icons/blueprintjs/16px/offline.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/offline.svg"),
  },
  "oil-field": {
    16: async () => import("assets/icons/blueprintjs/16px/oil-field.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/oil-field.svg"),
  },
  "one-column": {
    16: async () => import("assets/icons/blueprintjs/16px/one-column.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/one-column.svg"),
  },
  outdated: {
    16: async () => import("assets/icons/blueprintjs/16px/outdated.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/outdated.svg"),
  },
  "page-layout": {
    16: async () => import("assets/icons/blueprintjs/16px/page-layout.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/page-layout.svg"),
  },
  "panel-stats": {
    16: async () => import("assets/icons/blueprintjs/16px/panel-stats.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/panel-stats.svg"),
  },
  "panel-table": {
    16: async () => import("assets/icons/blueprintjs/16px/panel-table.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/panel-table.svg"),
  },
  paperclip: {
    16: async () => import("assets/icons/blueprintjs/16px/paperclip.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/paperclip.svg"),
  },
  paragraph: {
    16: async () => import("assets/icons/blueprintjs/16px/paragraph.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/paragraph.svg"),
  },
  path: {
    16: async () => import("assets/icons/blueprintjs/16px/path.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/path.svg"),
  },
  "path-search": {
    16: async () => import("assets/icons/blueprintjs/16px/path-search.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/path-search.svg"),
  },
  pause: {
    16: async () => import("assets/icons/blueprintjs/16px/pause.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/pause.svg"),
  },
  people: {
    16: async () => import("assets/icons/blueprintjs/16px/people.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/people.svg"),
  },
  percentage: {
    16: async () => import("assets/icons/blueprintjs/16px/percentage.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/percentage.svg"),
  },
  person: {
    16: async () => import("assets/icons/blueprintjs/16px/person.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/person.svg"),
  },
  phone: {
    16: async () => import("assets/icons/blueprintjs/16px/phone.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/phone.svg"),
  },
  "pie-chart": {
    16: async () => import("assets/icons/blueprintjs/16px/pie-chart.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/pie-chart.svg"),
  },
  pin: {
    16: async () => import("assets/icons/blueprintjs/16px/pin.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/pin.svg"),
  },
  pivot: {
    16: async () => import("assets/icons/blueprintjs/16px/pivot.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/pivot.svg"),
  },
  "pivot-table": {
    16: async () => import("assets/icons/blueprintjs/16px/pivot-table.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/pivot-table.svg"),
  },
  play: {
    16: async () => import("assets/icons/blueprintjs/16px/play.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/play.svg"),
  },
  plus: {
    16: async () => import("assets/icons/blueprintjs/16px/plus.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/plus.svg"),
  },
  "polygon-filter": {
    16: async () => import("assets/icons/blueprintjs/16px/polygon-filter.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/polygon-filter.svg"),
  },
  power: {
    16: async () => import("assets/icons/blueprintjs/16px/power.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/power.svg"),
  },
  "predictive-analysis": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/predictive-analysis.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/predictive-analysis.svg"),
  },
  prescription: {
    16: async () => import("assets/icons/blueprintjs/16px/prescription.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/prescription.svg"),
  },
  presentation: {
    16: async () => import("assets/icons/blueprintjs/16px/presentation.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/presentation.svg"),
  },
  print: {
    16: async () => import("assets/icons/blueprintjs/16px/print.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/print.svg"),
  },
  projects: {
    16: async () => import("assets/icons/blueprintjs/16px/projects.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/projects.svg"),
  },
  properties: {
    16: async () => import("assets/icons/blueprintjs/16px/properties.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/properties.svg"),
  },
  property: {
    16: async () => import("assets/icons/blueprintjs/16px/property.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/property.svg"),
  },
  "publish-function": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/publish-function.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/publish-function.svg"),
  },
  pulse: {
    16: async () => import("assets/icons/blueprintjs/16px/pulse.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/pulse.svg"),
  },
  random: {
    16: async () => import("assets/icons/blueprintjs/16px/random.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/random.svg"),
  },
  record: {
    16: async () => import("assets/icons/blueprintjs/16px/record.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/record.svg"),
  },
  redo: {
    16: async () => import("assets/icons/blueprintjs/16px/redo.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/redo.svg"),
  },
  refresh: {
    16: async () => import("assets/icons/blueprintjs/16px/refresh.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/refresh.svg"),
  },
  "regression-chart": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/regression-chart.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/regression-chart.svg"),
  },
  remove: {
    16: async () => import("assets/icons/blueprintjs/16px/remove.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/remove.svg"),
  },
  "remove-column": {
    16: async () => import("assets/icons/blueprintjs/16px/remove-column.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/remove-column.svg"),
  },
  "remove-column-left": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/remove-column-left.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/remove-column-left.svg"),
  },
  "remove-column-right": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/remove-column-right.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/remove-column-right.svg"),
  },
  "remove-row-bottom": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/remove-row-bottom.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/remove-row-bottom.svg"),
  },
  "remove-row-top": {
    16: async () => import("assets/icons/blueprintjs/16px/remove-row-top.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/remove-row-top.svg"),
  },
  repeat: {
    16: async () => import("assets/icons/blueprintjs/16px/repeat.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/repeat.svg"),
  },
  reset: {
    16: async () => import("assets/icons/blueprintjs/16px/reset.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/reset.svg"),
  },
  resolve: {
    16: async () => import("assets/icons/blueprintjs/16px/resolve.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/resolve.svg"),
  },
  rig: {
    16: async () => import("assets/icons/blueprintjs/16px/rig.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/rig.svg"),
  },
  "right-join": {
    16: async () => import("assets/icons/blueprintjs/16px/right-join.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/right-join.svg"),
  },
  ring: {
    16: async () => import("assets/icons/blueprintjs/16px/ring.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/ring.svg"),
  },
  "rotate-document": {
    16: async () => import("assets/icons/blueprintjs/16px/rotate-document.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/rotate-document.svg"),
  },
  "rotate-page": {
    16: async () => import("assets/icons/blueprintjs/16px/rotate-page.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/rotate-page.svg"),
  },
  route: {
    16: async () => import("assets/icons/blueprintjs/16px/route.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/route.svg"),
  },
  satellite: {
    16: async () => import("assets/icons/blueprintjs/16px/satellite.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/satellite.svg"),
  },
  saved: {
    16: async () => import("assets/icons/blueprintjs/16px/saved.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/saved.svg"),
  },
  "scatter-plot": {
    16: async () => import("assets/icons/blueprintjs/16px/scatter-plot.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/scatter-plot.svg"),
  },
  search: {
    16: async () => import("assets/icons/blueprintjs/16px/search.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/search.svg"),
  },
  "search-around": {
    16: async () => import("assets/icons/blueprintjs/16px/search-around.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/search-around.svg"),
  },
  "search-template": {
    16: async () => import("assets/icons/blueprintjs/16px/search-template.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/search-template.svg"),
  },
  "search-text": {
    16: async () => import("assets/icons/blueprintjs/16px/search-text.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/search-text.svg"),
  },
  "segmented-control": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/segmented-control.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/segmented-control.svg"),
  },
  select: {
    16: async () => import("assets/icons/blueprintjs/16px/select.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/select.svg"),
  },
  selection: {
    16: async () => import("assets/icons/blueprintjs/16px/selection.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/selection.svg"),
  },
  "send-message": {
    16: async () => import("assets/icons/blueprintjs/16px/send-message.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/send-message.svg"),
  },
  "send-to": {
    16: async () => import("assets/icons/blueprintjs/16px/send-to.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/send-to.svg"),
  },
  "send-to-graph": {
    16: async () => import("assets/icons/blueprintjs/16px/send-to-graph.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/send-to-graph.svg"),
  },
  "send-to-map": {
    16: async () => import("assets/icons/blueprintjs/16px/send-to-map.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/send-to-map.svg"),
  },
  "series-add": {
    16: async () => import("assets/icons/blueprintjs/16px/series-add.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/series-add.svg"),
  },
  "series-configuration": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/series-configuration.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/series-configuration.svg"),
  },
  "series-derived": {
    16: async () => import("assets/icons/blueprintjs/16px/series-derived.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/series-derived.svg"),
  },
  "series-filtered": {
    16: async () => import("assets/icons/blueprintjs/16px/series-filtered.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/series-filtered.svg"),
  },
  "series-search": {
    16: async () => import("assets/icons/blueprintjs/16px/series-search.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/series-search.svg"),
  },
  settings: {
    16: async () => import("assets/icons/blueprintjs/16px/settings.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/settings.svg"),
  },
  share: {
    16: async () => import("assets/icons/blueprintjs/16px/share.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/share.svg"),
  },
  shield: {
    16: async () => import("assets/icons/blueprintjs/16px/shield.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/shield.svg"),
  },
  shop: {
    16: async () => import("assets/icons/blueprintjs/16px/shop.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/shop.svg"),
  },
  "shopping-cart": {
    16: async () => import("assets/icons/blueprintjs/16px/shopping-cart.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/shopping-cart.svg"),
  },
  "signal-search": {
    16: async () => import("assets/icons/blueprintjs/16px/signal-search.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/signal-search.svg"),
  },
  "sim-card": {
    16: async () => import("assets/icons/blueprintjs/16px/sim-card.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/sim-card.svg"),
  },
  slash: {
    16: async () => import("assets/icons/blueprintjs/16px/slash.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/slash.svg"),
  },
  "small-cross": {
    16: async () => import("assets/icons/blueprintjs/16px/small-cross.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/small-cross.svg"),
  },
  "small-minus": {
    16: async () => import("assets/icons/blueprintjs/16px/small-minus.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/small-minus.svg"),
  },
  "small-plus": {
    16: async () => import("assets/icons/blueprintjs/16px/small-plus.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/small-plus.svg"),
  },
  "small-tick": {
    16: async () => import("assets/icons/blueprintjs/16px/small-tick.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/small-tick.svg"),
  },
  snowflake: {
    16: async () => import("assets/icons/blueprintjs/16px/snowflake.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/snowflake.svg"),
  },
  "social-media": {
    16: async () => import("assets/icons/blueprintjs/16px/social-media.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/social-media.svg"),
  },
  sort: {
    16: async () => import("assets/icons/blueprintjs/16px/sort.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/sort.svg"),
  },
  "sort-alphabetical": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/sort-alphabetical.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/sort-alphabetical.svg"),
  },
  "sort-alphabetical-desc": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/sort-alphabetical-desc.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/sort-alphabetical-desc.svg"),
  },
  "sort-asc": {
    16: async () => import("assets/icons/blueprintjs/16px/sort-asc.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/sort-asc.svg"),
  },
  "sort-desc": {
    16: async () => import("assets/icons/blueprintjs/16px/sort-desc.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/sort-desc.svg"),
  },
  "sort-numerical": {
    16: async () => import("assets/icons/blueprintjs/16px/sort-numerical.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/sort-numerical.svg"),
  },
  "sort-numerical-desc": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/sort-numerical-desc.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/sort-numerical-desc.svg"),
  },
  "split-columns": {
    16: async () => import("assets/icons/blueprintjs/16px/split-columns.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/split-columns.svg"),
  },
  square: {
    16: async () => import("assets/icons/blueprintjs/16px/square.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/square.svg"),
  },
  "stacked-chart": {
    16: async () => import("assets/icons/blueprintjs/16px/stacked-chart.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/stacked-chart.svg"),
  },
  star: {
    16: async () => import("assets/icons/blueprintjs/16px/star.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/star.svg"),
  },
  "star-empty": {
    16: async () => import("assets/icons/blueprintjs/16px/star-empty.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/star-empty.svg"),
  },
  "step-backward": {
    16: async () => import("assets/icons/blueprintjs/16px/step-backward.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/step-backward.svg"),
  },
  "step-chart": {
    16: async () => import("assets/icons/blueprintjs/16px/step-chart.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/step-chart.svg"),
  },
  "step-forward": {
    16: async () => import("assets/icons/blueprintjs/16px/step-forward.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/step-forward.svg"),
  },
  stop: {
    16: async () => import("assets/icons/blueprintjs/16px/stop.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/stop.svg"),
  },
  stopwatch: {
    16: async () => import("assets/icons/blueprintjs/16px/stopwatch.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/stopwatch.svg"),
  },
  strikethrough: {
    16: async () => import("assets/icons/blueprintjs/16px/strikethrough.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/strikethrough.svg"),
  },
  style: {
    16: async () => import("assets/icons/blueprintjs/16px/style.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/style.svg"),
  },
  "swap-horizontal": {
    16: async () => import("assets/icons/blueprintjs/16px/swap-horizontal.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/swap-horizontal.svg"),
  },
  "swap-vertical": {
    16: async () => import("assets/icons/blueprintjs/16px/swap-vertical.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/swap-vertical.svg"),
  },
  switch: {
    16: async () => import("assets/icons/blueprintjs/16px/switch.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/switch.svg"),
  },
  "symbol-circle": {
    16: async () => import("assets/icons/blueprintjs/16px/symbol-circle.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/symbol-circle.svg"),
  },
  "symbol-cross": {
    16: async () => import("assets/icons/blueprintjs/16px/symbol-cross.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/symbol-cross.svg"),
  },
  "symbol-diamond": {
    16: async () => import("assets/icons/blueprintjs/16px/symbol-diamond.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/symbol-diamond.svg"),
  },
  "symbol-square": {
    16: async () => import("assets/icons/blueprintjs/16px/symbol-square.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/symbol-square.svg"),
  },
  "symbol-triangle-down": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/symbol-triangle-down.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/symbol-triangle-down.svg"),
  },
  "symbol-triangle-up": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/symbol-triangle-up.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/symbol-triangle-up.svg"),
  },
  tag: {
    16: async () => import("assets/icons/blueprintjs/16px/tag.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/tag.svg"),
  },
  "take-action": {
    16: async () => import("assets/icons/blueprintjs/16px/take-action.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/take-action.svg"),
  },
  taxi: {
    16: async () => import("assets/icons/blueprintjs/16px/taxi.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/taxi.svg"),
  },
  "text-highlight": {
    16: async () => import("assets/icons/blueprintjs/16px/text-highlight.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/text-highlight.svg"),
  },
  th: {
    16: async () => import("assets/icons/blueprintjs/16px/th.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/th.svg"),
  },
  "th-derived": {
    16: async () => import("assets/icons/blueprintjs/16px/th-derived.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/th-derived.svg"),
  },
  "th-disconnect": {
    16: async () => import("assets/icons/blueprintjs/16px/th-disconnect.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/th-disconnect.svg"),
  },
  "th-filtered": {
    16: async () => import("assets/icons/blueprintjs/16px/th-filtered.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/th-filtered.svg"),
  },
  "th-list": {
    16: async () => import("assets/icons/blueprintjs/16px/th-list.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/th-list.svg"),
  },
  "thumbs-down": {
    16: async () => import("assets/icons/blueprintjs/16px/thumbs-down.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/thumbs-down.svg"),
  },
  "thumbs-up": {
    16: async () => import("assets/icons/blueprintjs/16px/thumbs-up.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/thumbs-up.svg"),
  },
  tick: {
    16: async () => import("assets/icons/blueprintjs/16px/tick.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/tick.svg"),
  },
  "tick-circle": {
    16: async () => import("assets/icons/blueprintjs/16px/tick-circle.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/tick-circle.svg"),
  },
  time: {
    16: async () => import("assets/icons/blueprintjs/16px/time.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/time.svg"),
  },
  "timeline-area-chart": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/timeline-area-chart.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/timeline-area-chart.svg"),
  },
  "timeline-bar-chart": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/timeline-bar-chart.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/timeline-bar-chart.svg"),
  },
  "timeline-events": {
    16: async () => import("assets/icons/blueprintjs/16px/timeline-events.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/timeline-events.svg"),
  },
  "timeline-line-chart": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/timeline-line-chart.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/timeline-line-chart.svg"),
  },
  tint: {
    16: async () => import("assets/icons/blueprintjs/16px/tint.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/tint.svg"),
  },
  torch: {
    16: async () => import("assets/icons/blueprintjs/16px/torch.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/torch.svg"),
  },
  tractor: {
    16: async () => import("assets/icons/blueprintjs/16px/tractor.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/tractor.svg"),
  },
  train: {
    16: async () => import("assets/icons/blueprintjs/16px/train.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/train.svg"),
  },
  translate: {
    16: async () => import("assets/icons/blueprintjs/16px/translate.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/translate.svg"),
  },
  trash: {
    16: async () => import("assets/icons/blueprintjs/16px/trash.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/trash.svg"),
  },
  tree: {
    16: async () => import("assets/icons/blueprintjs/16px/tree.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/tree.svg"),
  },
  "trending-down": {
    16: async () => import("assets/icons/blueprintjs/16px/trending-down.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/trending-down.svg"),
  },
  "trending-up": {
    16: async () => import("assets/icons/blueprintjs/16px/trending-up.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/trending-up.svg"),
  },
  truck: {
    16: async () => import("assets/icons/blueprintjs/16px/truck.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/truck.svg"),
  },
  "two-columns": {
    16: async () => import("assets/icons/blueprintjs/16px/two-columns.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/two-columns.svg"),
  },
  unarchive: {
    16: async () => import("assets/icons/blueprintjs/16px/unarchive.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/unarchive.svg"),
  },
  underline: {
    16: async () => import("assets/icons/blueprintjs/16px/underline.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/underline.svg"),
  },
  undo: {
    16: async () => import("assets/icons/blueprintjs/16px/undo.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/undo.svg"),
  },
  "ungroup-objects": {
    16: async () => import("assets/icons/blueprintjs/16px/ungroup-objects.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/ungroup-objects.svg"),
  },
  "unknown-vehicle": {
    16: async () => import("assets/icons/blueprintjs/16px/unknown-vehicle.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/unknown-vehicle.svg"),
  },
  unlock: {
    16: async () => import("assets/icons/blueprintjs/16px/unlock.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/unlock.svg"),
  },
  unpin: {
    16: async () => import("assets/icons/blueprintjs/16px/unpin.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/unpin.svg"),
  },
  unresolve: {
    16: async () => import("assets/icons/blueprintjs/16px/unresolve.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/unresolve.svg"),
  },
  updated: {
    16: async () => import("assets/icons/blueprintjs/16px/updated.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/updated.svg"),
  },
  upload: {
    16: async () => import("assets/icons/blueprintjs/16px/upload.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/upload.svg"),
  },
  user: {
    16: async () => import("assets/icons/blueprintjs/16px/user.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/user.svg"),
  },
  variable: {
    16: async () => import("assets/icons/blueprintjs/16px/variable.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/variable.svg"),
  },
  "vertical-bar-chart-asc": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/vertical-bar-chart-asc.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/vertical-bar-chart-asc.svg"),
  },
  "vertical-bar-chart-desc": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/vertical-bar-chart-desc.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/vertical-bar-chart-desc.svg"),
  },
  "vertical-distribution": {
    16: async () =>
      import("assets/icons/blueprintjs/16px/vertical-distribution.svg"),
    20: async () =>
      import("assets/icons/blueprintjs/20px/vertical-distribution.svg"),
  },
  video: {
    16: async () => import("assets/icons/blueprintjs/16px/video.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/video.svg"),
  },
  virus: {
    16: async () => import("assets/icons/blueprintjs/16px/virus.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/virus.svg"),
  },
  "volume-down": {
    16: async () => import("assets/icons/blueprintjs/16px/volume-down.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/volume-down.svg"),
  },
  "volume-off": {
    16: async () => import("assets/icons/blueprintjs/16px/volume-off.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/volume-off.svg"),
  },
  "volume-up": {
    16: async () => import("assets/icons/blueprintjs/16px/volume-up.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/volume-up.svg"),
  },
  walk: {
    16: async () => import("assets/icons/blueprintjs/16px/walk.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/walk.svg"),
  },
  "warning-sign": {
    16: async () => import("assets/icons/blueprintjs/16px/warning-sign.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/warning-sign.svg"),
  },
  "waterfall-chart": {
    16: async () => import("assets/icons/blueprintjs/16px/waterfall-chart.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/waterfall-chart.svg"),
  },
  widget: {
    16: async () => import("assets/icons/blueprintjs/16px/widget.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/widget.svg"),
  },
  "widget-button": {
    16: async () => import("assets/icons/blueprintjs/16px/widget-button.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/widget-button.svg"),
  },
  "widget-footer": {
    16: async () => import("assets/icons/blueprintjs/16px/widget-footer.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/widget-footer.svg"),
  },
  "widget-header": {
    16: async () => import("assets/icons/blueprintjs/16px/widget-header.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/widget-header.svg"),
  },
  wrench: {
    16: async () => import("assets/icons/blueprintjs/16px/wrench.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/wrench.svg"),
  },
  "zoom-in": {
    16: async () => import("assets/icons/blueprintjs/16px/zoom-in.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/zoom-in.svg"),
  },
  "zoom-out": {
    16: async () => import("assets/icons/blueprintjs/16px/zoom-out.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/zoom-out.svg"),
  },
  "zoom-to-fit": {
    16: async () => import("assets/icons/blueprintjs/16px/zoom-to-fit.svg"),
    20: async () => import("assets/icons/blueprintjs/20px/zoom-to-fit.svg"),
  },
};

export default svgImportsMap;
