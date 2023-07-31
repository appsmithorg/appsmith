export interface LayoutComponent {
  layoutType: string; // Identifier; similar to widget type.
  layout: LayoutComponent[] | string[]; // Array of layouts or widgetIds.
  isDropTarget?: boolean; // Whether layout uses drop target.
  widgetsAllowed?: string[]; // identifiers for allowed widgets. widgetType | 1D | 2D.
}

/**
 * CURRENT STRUCTURE
 * - Caters exclusively to the present implementation.
 *
 * - First [] -> column
 * - Second [] -> row
 * - Third {} -> widgets in alignments
 *
 * ! Inextensible.
 * ! Modification is tedious.
 */
export const flexLayer = [
  [
    { id: "1", align: "start" },
    { id: "2", align: "center" },
  ],
  [{ id: "3", align: "center" }],
];

/**
 * NEW STRUCTURE with lists only
 * thesis: a flex only needs a list of items
 * and appropriate props.
 * In this case, props are not passed as they are hardcoded in the layout components.
 *
 * - First [] -> column
 * - Second [] -> row
 * - Third []s -> alignments
 *
 * + updating any layout requires simple array operations.
 * - AutoLayoutLayer has a couple of added complexities:
 *    - If a child is a FillWidget, then it doesn't use alignments.
 *      Child widgets still retain their original alignments though.
 *      So, if the FillWidget is deleted, the Hug widgets return to the original alignment.
 *    - It also employs a ResizeObserver to detect a change in height.
 *      Layouts of different types may want to use it as well.
 *
 *  - props.children remain the same. Canvas is in charge of all children.
 *  - Canvas employs a specific layout type to organize children.
 *  - flexLayers information is appropriated to each sub-layout to group the children properly.
 *  - How to use the flexLayers information is black boxed in the layout component.
 *  - This method is not extensible to accommodate nested layout components.
 */
export const flexLayerList = [
  [["1"], ["2"], []],
  [[], ["3"], []],
];

/**
 * LAYOUT PRESET ONE with aforementioned technique.
 * This layout component caters to the requirements of the Modal widget.
 * Layout:
 *   Title Icon
 *   Column Column Column ...
 *   Footer
 *
 *  layers[0] - Title (row without alignments.)
 *  layers[1] - Icon (row without alignments.)
 *  layers[2] - Main (row with columns (default layout present). no alignments.)
 *  layers[3] - Footer (row with alignments.)
 *
 *  - All layers are rendered inside a column.
 *  - Layers [0 & 1] are rendered inside a row.
 *  - Parent Layout (PresetOne) is not a DropTarget. Hence, it's layout can not be altered.
 *    => Enables Header and Footer layouts without requiring alternate positioning.
 *  - Main layout (layers[2]) has a max-height along with overflow-y: auto; which offers scrolling.
 *
 *  - Layout component is composed for many layouts.
 *  - Layout component assigns appropriate layers to each sub-layout.
 *  - Title, Icon and Footer layouts only have one layer and hence won't render horizontal highlights during drag.
 *    This information is passed as a prop.
 *  - Title and Footer layouts only welcome 1-D widgets, while Icon layout allows icons only.
 *    This information is passed as a prop and is shown via a UI element to the user (.e.g. red dragging box).
 *    => It is important for each layout to have it's own DropTarget and drag hooks.
 *       Else the parent component / canvas will have to know too much to perform the same function.
 *    ? How to determine which layouts have DropTargets?
 *  ? How to interact with a specific nested layout?
 *    e.g. add or remove a column from Main.
 *  ? How to make this method extensible?
 *    e.g. user may want to split cells in the second row of column 1 of the Main layout;
 *    which may lead to introduction of a new nested layout component inside the column.
 *    How will the column identity a separate layout and render it properly?L
 *  ? At the deepest level, some rows have alignments while others don't.
 *    Presently, a single set of utils is used to update flex layers.
 *    How to identify the correct method to update a flex layer for a given layout?
 */
export const presetOne = {
  layoutType: "presetOne",
  layers: [
    ["1"], // Title
    ["2", "3"], // Two icons to the right of the title.
    [
      [
        // Column 1 with 2 rows,
        [["4"], ["5"], []],
        [[], ["6"], []],
      ],
      [[[], [], ["7"]]], // Column 2 with 1 row.
    ],
    [[], [], ["8", "9"]], // Footer with two right (/ end) aligned widgets.
  ],
};

/**
 * UPDATED LAYOUT PRESET ONE with layout type specification.
 * - A more elaborate structure where each level specifies the layout to be used.
 * - Layouts are self aware of how to use the provided information. e.g. render widgets or render another layout.
 *
 * AUTO_LAYOUT_LAYER - a row with up to three alignments. It would render no alignment if a Fill widget is present among the children. Renders widgets and uses ResizeObserver.
 * LEAN_AUTO_LAYOUT_LAYER - a row with no alignments. Renders widgets and does not use ResizeObserver.
 * COLUMN - a start aligned column very similar to the FlexBoxComponent on release.
 *
 * HEADER - Row. nowrap.
 * MAIN - Row. wrap. overflow-y.
 *
 * - LEAN_AUTO_LAYOUT_LAYER and COLUMN are DropTargets.
 * - AUTO_LAYOUT_LAYER is a DropTarget only at the footer level, not when rendered inside a COLUMN.
 * ? How to control when a layout uses a DropTarget?
 *   - Add appropriate props for using DropTarget and widget selection.
 *   ? What are the risks of exposing this information in the DSL?
 *   ? How does the risk compare to the rigidity and black boxed nature of the alternate implementation?
 *   ? Can appropriate guard checks be introduced to satisfactorily mitigate the risk?
 * ? How to properly update flex layers, accounting for presence / absence of alignments?
 *   - At the lowest level only a few array operations are employed; adding / removing items at a specific index.
 *   - It is important to correctly identify source and destination arrays.
 *     - { sourceArray, sourceIndex, destinationArray, destinationIndex }
 *       is all the information required to perform necessary operations (WIDGET_ ADD / MOVE / DELETE / COPY / PASTE).
 * ? Will copy paste experience be different for different layouts?
 *   - Presently, pasted widgets are placed in new rows at the bottom of the parent.
 *   - This will not work for row layouts, e.g. Title, Icon, etc.
 *   ? How to abstract this functionality?
 *     - Render pasted widgets next to the copied widget in the same array. (sourceIndex + 1).
 *     - or at the end of the destination array, if different from source array.
 *
 *
 *  + Precisely control the behavior of layouts.
 *  + Extensible. Accommodates infinite nesting and use of multiple layouts in the same canvas.
 *  + Re-use of atomic layouts simplifies creation of complex layouts in terms of time and effort.
 *  + Makes rooms for exposing more properties to the user in the future if we decide to allow creation / editing of layouts.
 *  ! Introduces a very deeply nested structure within the DSL which itself is very deeply nested.
 */
export const presetOneV2 = [
  {
    layoutType: "presetOne",
    layout: [
      {
        layoutType: "HEADER",
        layout: [
          {
            layoutType: "LEAN_AUTO_LAYOUT_LAYER",
            layout: ["1"],
            isDropTarget: true,
            widgetsAllowed: ["1D"],
          },
          {
            layoutType: "LEAN_AUTO_LAYOUT_LAYER",
            layout: ["2", "3"],
            isDropTarget: true,
            widgetsAllowed: ["ICON_WIDGET"],
          },
        ],
      },
      {
        layoutType: "MAIN",
        layout: [
          {
            layoutType: "COLUMN",
            layout: [
              {
                layoutType: "AUTO_LAYOUT_LAYER",
                layout: [["4"], ["5"], []],
              },
              {
                layoutType: "AUTO_LAYOUT_LAYER",
                layout: [[], ["6"], []],
              },
            ],
            isDropTarget: true,
          },
          {
            layoutType: "COLUMN",
            layout: [
              {
                layoutType: "AUTO_LAYOUT_LAYER",
                layout: [[], [], ["7"]],
              },
            ],
            isDropTarget: true,
          },
        ],
      },
      {
        // Footer
        layoutType: "AUTO_LAYOUT_LAYER",
        layout: [[], [], ["8", "9"]],
        isDropTarget: true,
        widgetsAllowed: ["1D"],
      },
    ],
  },
];

/**
 * Example: Extensibility of this structure.
 * - User changes the first row of Column 1 of Main to use a SPLIT_CELL.
 * => Nest another layout within the same column.
 *
 * ? How does the user interact with the layout components to make such decisions?
 */
export const presetOneV2SplitCell = [
  {
    layoutType: "presetOne",
    layout: [
      {
        layoutType: "HEADER",
        layout: [
          {
            layoutType: "LEAN_AUTO_LAYOUT_LAYER",
            layout: ["1"],
            isDropTarget: true,
            widgetsAllowed: ["1D"],
          },
          {
            layoutType: "LEAN_AUTO_LAYOUT_LAYER",
            layout: ["2", "3"],
            isDropTarget: true,
            widgetsAllowed: ["ICON_WIDGET"],
          },
        ],
      },
      {
        layoutType: "MAIN",
        layout: [
          {
            layoutType: "COLUMN",
            layout: [
              {
                layoutType: "SPLIT_CELL",
                layout: [
                  {
                    layoutType: "AUTO_LAYOUT_LAYER",
                    layout: [["4"], [], []],
                    isDropTarget: true,
                  },
                  {
                    layoutType: "AUTO_LAYOUT_LAYER",
                    layout: [[], ["5"], []],
                    isDropTarget: true,
                  },
                ],
              },
              {
                layoutType: "AUTO_LAYOUT_LAYER",
                layout: [[], ["6"], []],
              },
            ],
            isDropTarget: true,
          },
          {
            layoutType: "COLUMN",
            layout: [
              {
                layoutType: "AUTO_LAYOUT_LAYER",
                layout: [[], [], ["7"]],
              },
            ],
            isDropTarget: true,
          },
        ],
      },
      {
        // Footer
        layoutType: "AUTO_LAYOUT_LAYER",
        layout: [[], [], ["8", "9"]],
        isDropTarget: true,
        widgetsAllowed: ["1D"],
      },
    ],
  },
];

/**
 * Default AutoLayout in the new structure.
 *
 * + Migration of current apps on AutoLayout would be straightforward.
 */
export const defaultLayoutV2 = [
  {
    layoutType: "default",
    layout: [
      {
        layoutType: "COLUMN",
        layout: [
          {
            layoutType: "AUTO_LAYOUT_LAYER",
            layout: [[], [], []],
          },
          {
            layoutType: "AUTO_LAYOUT_LAYER",
            layout: [[], [], []],
          },
        ],
      },
    ],
    isDropTarget: true,
  },
];
