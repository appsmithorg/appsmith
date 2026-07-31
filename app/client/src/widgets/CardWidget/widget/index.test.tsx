import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { LayoutSystemTypes } from "layoutSystems/types";
import BaseWidget from "widgets/BaseWidget";

import { getCardChromeHeightInPx } from "../chromeHeight";
import type { CardWidgetProps } from "../constants";
import CardWidget from "./index";

const dispatch = jest.fn();

jest.mock("store", () => ({
  __esModule: true,
  default: {
    dispatch: (action: unknown) => dispatch(action),
  },
}));

function makeProps(overrides: Partial<CardWidgetProps> = {}): CardWidgetProps {
  return {
    widgetId: "card1",
    widgetName: "Card1",
    type: "CARD_WIDGET",
    layoutSystemType: LayoutSystemTypes.FIXED,
    isMetaWidget: false,
    // Auto height is what the platform forces for isCanvas widgets.
    dynamicHeight: "AUTO_HEIGHT",
    showHeader: true,
    showFooter: true,
    borderWidth: "1",
    mediaPosition: "NONE",
    expandCollapseEnabled: true,
    isExpanded: true,
    footerActions: {
      footerAction1: {
        id: "footerAction1",
        index: 0,
        widgetId: "",
        isVisible: true,
        label: "Edit",
      },
    },
    menuItems: {},
    ...overrides,
  } as unknown as CardWidgetProps;
}

function makeWidget(props: CardWidgetProps) {
  return new CardWidget(props);
}

describe("CardWidget expand/collapse reflow", () => {
  beforeEach(() => {
    dispatch.mockClear();
  });

  // Requesting a height of 0 is the platform's "widget went invisible" signal:
  // in the editor the update is dropped, and in preview/published the card
  // collapses to zero rows, taking the expand chevron with it. The widget must
  // request its real chrome height instead.
  it("requests the chrome height (never 0) when collapsing", () => {
    const props = makeProps({ isExpanded: false });
    const widget = makeWidget(props);

    widget.componentDidUpdate(makeProps({ isExpanded: true }));

    expect(dispatch).toHaveBeenCalledTimes(1);

    const action = dispatch.mock.calls[0][0];
    const expectedChrome = getCardChromeHeightInPx(props);

    expect(action.type).toBe(ReduxActionTypes.UPDATE_WIDGET_AUTO_HEIGHT);
    expect(action.payload.widgetId).toBe("card1");
    expect(action.payload.height).toBe(expectedChrome);
    expect(action.payload.height).toBeGreaterThan(0);
  });

  it("recomputes container heights when expanding", () => {
    const widget = makeWidget(makeProps({ isExpanded: true }));

    widget.componentDidUpdate(makeProps({ isExpanded: false }));

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0].type).toBe(
      ReduxActionTypes.CHECK_CONTAINERS_FOR_AUTO_HEIGHT,
    );
  });

  it("does nothing when the expanded state did not change", () => {
    const widget = makeWidget(makeProps({ isExpanded: true }));

    widget.componentDidUpdate(makeProps({ isExpanded: true }));

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does not reflow for meta widgets (Card inside a List row)", () => {
    const widget = makeWidget(
      makeProps({ isExpanded: false, isMetaWidget: true }),
    );

    widget.componentDidUpdate(makeProps({ isExpanded: true }));

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does not reflow outside fixed layout", () => {
    const widget = makeWidget(
      makeProps({
        isExpanded: false,
        layoutSystemType: LayoutSystemTypes.AUTO,
      }),
    );

    widget.componentDidUpdate(makeProps({ isExpanded: true }));

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does not reflow when auto height is off", () => {
    const widget = makeWidget(
      makeProps({ isExpanded: false, dynamicHeight: "FIXED" }),
    );

    widget.componentDidUpdate(makeProps({ isExpanded: true }));

    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe("CardWidget sniping mode (Connect to widget)", () => {
  const snipe = (data: string) => {
    const updates = CardWidget.getMethods().getSnipingModeUpdates({
      data,
      run: "{{Query1.run()}}",
      isDynamicPropertyPath: true,
    });

    return Object.fromEntries(
      updates.map((u) => [u.propertyPath, u.propertyValue as string]),
    );
  };

  it("seeds cardData with the first record of the bound query", () => {
    expect(snipe("{{Query1.data}}").cardData).toBe("{{Query1.data?.[0]}}");
  });

  // Seeding only cardData made "bind a query to a card" a visible no-op:
  // nothing renders cardData, so the card looked untouched.
  it("also seeds the visible title and subtitle", () => {
    const updates = snipe("{{Query1.data}}");

    expect(Object.keys(updates).sort()).toEqual([
      "cardData",
      "subtitle",
      "title",
    ]);
    expect(updates.title).toContain("Query1.data?.[0]?.title");
    expect(updates.title).toContain("Query1.data?.[0]?.name");
    expect(updates.subtitle).toContain("Query1.data?.[0]?.subtitle");
  });

  it("falls back to the first string field so any record shape shows something", () => {
    expect(snipe("{{Query1.data}}").title).toContain(
      'Object.values(Query1.data?.[0] ?? {}).find((value) => typeof value === "string")',
    );
  });

  it("handles a nested binding path", () => {
    expect(snipe("{{Query1.data.users}}").cardData).toBe(
      "{{Query1.data.users?.[0]}}",
    );
  });

  it("leaves a non-binding value alone rather than corrupting it", () => {
    const updates = CardWidget.getMethods().getSnipingModeUpdates({
      data: "not-a-binding",
      run: "",
      isDynamicPropertyPath: true,
    });

    expect(updates).toHaveLength(1);
    expect(updates[0].propertyValue).toBe("not-a-binding");
  });

  it("produces bindings with balanced braces", () => {
    for (const value of Object.values(snipe("{{Query1.data}}"))) {
      expect(value.startsWith("{{")).toBe(true);
      expect(value.endsWith("}}")).toBe(true);
    }
  });
});

describe("CardWidget one-click binding (Connect data)", () => {
  const bind = (
    aliases: { name: string; alias: string }[],
    data = "{{Query1.data}}",
  ) =>
    CardWidget.getMethods().getPropertyUpdatesForQueryBinding(
      { select: { data, run: "{{Query1.run()}}" } },
      makeProps(),
      { aliases } as never,
    );

  it("requests a plain select — the card indexes the first row itself", () => {
    expect(CardWidget.getMethods().getQueryGenerationConfig()).toEqual({
      select: {},
    });
  });

  // Unlike sniping mode, this flow knows the real column names, so it binds
  // the exact fields rather than resolving them at runtime.
  it("binds the mapped columns exactly", () => {
    const { modify } = bind([
      { name: "title", alias: "full_name" },
      { name: "subtitle", alias: "email" },
    ]);

    expect(modify).toEqual({
      cardData: "{{Query1.data?.[0]}}",
      title: '{{Query1.data?.[0]?.["full_name"]}}',
      subtitle: '{{Query1.data?.[0]?.["email"]}}',
    });
  });

  it("escapes column names that dot notation cannot express", () => {
    const { modify } = bind([
      { name: "title", alias: "First Name" },
      { name: "subtitle", alias: "e-mail" },
    ]);

    expect(modify).toEqual({
      cardData: "{{Query1.data?.[0]}}",
      title: '{{Query1.data?.[0]?.["First Name"]}}',
      subtitle: '{{Query1.data?.[0]?.["e-mail"]}}',
    });
  });

  // A name containing the closing delimiter cannot be bound safely at all.
  it("skips a column whose name would break out of the binding", () => {
    const { modify } = bind([
      { name: "title", alias: "bad}}name" },
      { name: "subtitle", alias: "email" },
    ]);

    expect(modify).toEqual({
      cardData: "{{Query1.data?.[0]}}",
      subtitle: '{{Query1.data?.[0]?.["email"]}}',
    });
  });

  it("omits subtitle when the user did not map one", () => {
    const { modify } = bind([{ name: "title", alias: "full_name" }]);

    expect(modify).toEqual({
      cardData: "{{Query1.data?.[0]}}",
      title: '{{Query1.data?.[0]?.["full_name"]}}',
    });
  });

  it("still binds cardData when no aliases are mapped", () => {
    expect(bind([]).modify).toEqual({ cardData: "{{Query1.data?.[0]}}" });
  });

  it("returns nothing for a non-select query config", () => {
    expect(
      CardWidget.getMethods().getPropertyUpdatesForQueryBinding(
        {},
        makeProps(),
        { aliases: [] } as never,
      ),
    ).toEqual({});
  });
});

describe("CardWidget overflow menu visibility", () => {
  const withMenu = (overrides: Partial<CardWidgetProps> = {}) =>
    makeWidget(
      makeProps({
        menuItems: {
          menuItem1: {
            id: "menuItem1",
            index: 0,
            widgetId: "",
            isVisible: true,
            label: "First",
          },
          menuItem2: {
            id: "menuItem2",
            index: 1,
            widgetId: "",
            isVisible: true,
            label: "Second",
          },
        },
        ...overrides,
      } as Partial<CardWidgetProps>),
    );

  it("shows visible menu items by default", () => {
    expect(withMenu().getVisibleMenuItems()).toHaveLength(2);
  });

  it("filters out items that are not explicitly visible", () => {
    const widget = withMenu({
      menuItems: {
        menuItem1: {
          id: "menuItem1",
          index: 0,
          widgetId: "",
          isVisible: false,
          label: "First",
        },
      },
    } as Partial<CardWidgetProps>);

    expect(widget.getVisibleMenuItems()).toHaveLength(0);
  });

  // The shared MENU_ITEMS control will not delete the last remaining item, so
  // "Show menu" is the supported way to remove the ⋮ menu entirely.
  it("hides the whole menu when showMenu is off, regardless of item visibility", () => {
    expect(withMenu({ showMenu: false }).getVisibleMenuItems()).toHaveLength(0);
  });

  it("treats an absent showMenu as on, so existing cards are unchanged", () => {
    expect(
      withMenu({ showMenu: undefined }).getVisibleMenuItems(),
    ).toHaveLength(2);
  });
});

describe("CardWidget disabled state", () => {
  let executeAction: jest.SpyInstance;

  beforeEach(() => {
    // handleCardClick and friends call super.executeAction, which resolves on
    // BaseWidget's prototype rather than the instance.
    executeAction = jest
      .spyOn(BaseWidget.prototype, "executeAction")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    executeAction.mockRestore();
  });

  it("fires card, footer and menu actions when enabled", () => {
    const widget = makeWidget(
      makeProps({ isDisabled: false, onCardClick: "{{showAlert('hi')}}" }),
    );

    widget.handleCardClick();
    widget.handleFooterActionClick("{{showAlert('footer')}}");
    widget.handleMenuItemClick("{{showAlert('menu')}}");

    expect(executeAction).toHaveBeenCalledTimes(3);
  });

  // A disabled card must not fire actions even if the component's own guards
  // are bypassed — this is the boundary where the action actually leaves.
  it("fires nothing when disabled", () => {
    const widget = makeWidget(
      makeProps({ isDisabled: true, onCardClick: "{{showAlert('hi')}}" }),
    );

    widget.handleCardClick();
    widget.handleFooterActionClick("{{showAlert('footer')}}");
    widget.handleMenuItemClick("{{showAlert('menu')}}");

    expect(executeAction).not.toHaveBeenCalled();
  });
});
