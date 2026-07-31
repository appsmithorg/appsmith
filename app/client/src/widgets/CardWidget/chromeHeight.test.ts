import { GridDefaults } from "constants/WidgetConstants";

import type { CardChromeProps } from "./chromeHeight";
import {
  getCardChromeHeightInPx,
  getCardChromeHeightInRows,
} from "./chromeHeight";
import type { CardFooterAction } from "./constants";
import {
  CARD_FOOTER_HEIGHT,
  CARD_HEADER_HEIGHT,
  DEFAULT_MEDIA_HEIGHT,
  MediaPositionTypes,
} from "./constants";

function footerAction(isVisible: unknown): Record<string, CardFooterAction> {
  return {
    footerAction1: {
      id: "footerAction1",
      index: 0,
      widgetId: "",
      isVisible,
    } as unknown as CardFooterAction,
  };
}

const VISIBLE_FOOTER = footerAction(true);

// Mirrors CardWidget.getDefaults(): header + footer + 1px borders.
const DEFAULTS: CardChromeProps = {
  showHeader: true,
  showFooter: true,
  borderWidth: "1",
  mediaPosition: MediaPositionTypes.NONE,
  mediaHeight: DEFAULT_MEDIA_HEIGHT,
  footerActions: VISIBLE_FOOTER,
};

const DEFAULT_CHROME = CARD_HEADER_HEIGHT + CARD_FOOTER_HEIGHT + 2;

describe("getCardChromeHeightInPx", () => {
  it("sums header, footer and borders for the widget defaults", () => {
    expect(getCardChromeHeightInPx(DEFAULTS)).toBe(DEFAULT_CHROME);
  });

  it.each([
    [
      "header hidden",
      { showHeader: false },
      DEFAULT_CHROME - CARD_HEADER_HEIGHT,
    ],
    [
      "footer hidden",
      { showFooter: false },
      DEFAULT_CHROME - CARD_FOOTER_HEIGHT,
    ],
    [
      "all footer actions hidden",
      { footerActions: footerAction(false) },
      DEFAULT_CHROME - CARD_FOOTER_HEIGHT,
    ],
    [
      "no footer actions at all",
      { footerActions: {} },
      DEFAULT_CHROME - CARD_FOOTER_HEIGHT,
    ],
    [
      "top media adds its height",
      {
        mediaPosition: MediaPositionTypes.TOP,
        mediaImage: "https://example.com/a.png",
      },
      DEFAULT_CHROME + DEFAULT_MEDIA_HEIGHT,
    ],
    [
      "left media adds no vertical chrome",
      {
        mediaPosition: MediaPositionTypes.LEFT,
        mediaImage: "https://example.com/a.png",
      },
      DEFAULT_CHROME,
    ],
    [
      "top media with no image adds nothing",
      { mediaPosition: MediaPositionTypes.TOP },
      DEFAULT_CHROME,
    ],
  ])("%s", (_label, override, expected) => {
    expect(getCardChromeHeightInPx({ ...DEFAULTS, ...override })).toBe(
      expected,
    );
  });

  // The header renders whenever showHeader !== false (see getWidgetView), so an
  // undefined binding result must still reserve the header. Counting it here but
  // rendering it there was a 50px body over-allocation under overflow: hidden.
  it.each([undefined, null, "", "{{Query1.data[0].show}}"])(
    "reserves header and footer when the flag is %p (not an explicit false)",
    (value) => {
      expect(
        getCardChromeHeightInPx({
          ...DEFAULTS,
          showHeader: value,
          showFooter: value,
        }),
      ).toBe(DEFAULT_CHROME);
    },
  );

  describe("unevaluated bindings", () => {
    // The sagas read raw DSL props, so bindable values arrive as "{{...}}".
    it("falls back to the default media height instead of producing NaN", () => {
      const chrome = getCardChromeHeightInPx({
        ...DEFAULTS,
        mediaPosition: MediaPositionTypes.TOP,
        mediaImage: "{{Query1.data[0].image}}",
        mediaHeight: "{{Query1.data[0].height}}",
      });

      expect(chrome).toBe(DEFAULT_CHROME + DEFAULT_MEDIA_HEIGHT);
      expect(Number.isNaN(chrome)).toBe(false);
    });

    it("reserves media height when mediaPosition itself is a binding", () => {
      expect(
        getCardChromeHeightInPx({
          ...DEFAULTS,
          mediaPosition: "{{Query1.data[0].position}}",
          mediaImage: "https://example.com/a.png",
        }),
      ).toBe(DEFAULT_CHROME + DEFAULT_MEDIA_HEIGHT);
    });

    it("reserves the footer when action visibility is a binding", () => {
      expect(
        getCardChromeHeightInPx({
          ...DEFAULTS,
          footerActions: footerAction("{{Query1.data[0].visible}}"),
        }),
      ).toBe(DEFAULT_CHROME);
    });

    it("never produces NaN from a non-numeric borderWidth", () => {
      const chrome = getCardChromeHeightInPx({
        ...DEFAULTS,
        borderWidth: "{{appsmith.store.border}}",
      });

      expect(chrome).toBe(DEFAULT_CHROME - 2);
      expect(Number.isNaN(chrome)).toBe(false);
    });
  });

  describe("expansion", () => {
    it("drops the footer when collapsed via the meta property", () => {
      expect(
        getCardChromeHeightInPx({
          ...DEFAULTS,
          expandCollapseEnabled: true,
          isExpanded: false,
        }),
      ).toBe(DEFAULT_CHROME - CARD_FOOTER_HEIGHT);
    });

    // isExpanded is a meta property and is absent from the DSL the sagas read,
    // so the persisted defaultExpanded is the only signal available there.
    it("falls back to defaultExpanded when isExpanded is absent", () => {
      expect(
        getCardChromeHeightInPx({
          ...DEFAULTS,
          expandCollapseEnabled: true,
          defaultExpanded: false,
        }),
      ).toBe(DEFAULT_CHROME - CARD_FOOTER_HEIGHT);
    });

    it("prefers the live meta value over defaultExpanded", () => {
      expect(
        getCardChromeHeightInPx({
          ...DEFAULTS,
          expandCollapseEnabled: true,
          defaultExpanded: false,
          isExpanded: true,
        }),
      ).toBe(DEFAULT_CHROME);
    });

    it("ignores expansion state when the feature is off", () => {
      expect(
        getCardChromeHeightInPx({
          ...DEFAULTS,
          expandCollapseEnabled: false,
          isExpanded: false,
        }),
      ).toBe(DEFAULT_CHROME);
    });
  });

  // A negative bindable value must contribute nothing, not subtract from the
  // header/footer chrome above it. Clamping only the total would let this
  // under-reserve and clip the body.
  describe("negative values cannot cancel out real chrome", () => {
    it("ignores a negative mediaHeight instead of shrinking the chrome", () => {
      expect(
        getCardChromeHeightInPx({
          ...DEFAULTS,
          mediaPosition: MediaPositionTypes.TOP,
          mediaImage: "https://example.com/a.png",
          mediaHeight: -60,
        }),
      ).toBe(DEFAULT_CHROME);
    });

    it("ignores a negative borderWidth instead of shrinking the chrome", () => {
      expect(getCardChromeHeightInPx({ ...DEFAULTS, borderWidth: "-40" })).toBe(
        DEFAULT_CHROME - 2,
      );
    });

    it("still reserves the header when both are negative", () => {
      expect(
        getCardChromeHeightInPx({
          ...DEFAULTS,
          showFooter: false,
          mediaPosition: MediaPositionTypes.TOP,
          mediaImage: "https://example.com/a.png",
          mediaHeight: -500,
          borderWidth: "-500",
        }),
      ).toBe(CARD_HEADER_HEIGHT);
    });
  });

  it("never returns a negative height", () => {
    expect(
      getCardChromeHeightInPx({
        ...DEFAULTS,
        showHeader: false,
        showFooter: false,
        borderWidth: "-40",
      }),
    ).toBe(0);
  });
});

describe("getCardChromeHeightInRows", () => {
  // The saga reserves rows while the renderer subtracts pixels; if these two
  // ever disagree the card clips or gaps. This is the invariant that the old
  // "CONSTRAINT: keep in sync" comment asserted without enforcing.
  const MATRIX: CardChromeProps[] = [
    DEFAULTS,
    { ...DEFAULTS, showHeader: false },
    { ...DEFAULTS, showFooter: false },
    { ...DEFAULTS, showHeader: undefined, showFooter: undefined },
    { ...DEFAULTS, footerActions: footerAction(false) },
    { ...DEFAULTS, footerActions: footerAction("{{binding}}") },
    {
      ...DEFAULTS,
      mediaPosition: MediaPositionTypes.TOP,
      mediaImage: "https://example.com/a.png",
    },
    {
      ...DEFAULTS,
      mediaPosition: MediaPositionTypes.TOP,
      mediaImage: "{{binding}}",
      mediaHeight: "{{binding}}",
    },
    {
      ...DEFAULTS,
      mediaPosition: MediaPositionTypes.LEFT,
      mediaImage: "https://example.com/a.png",
    },
    { ...DEFAULTS, expandCollapseEnabled: true, isExpanded: false },
    { ...DEFAULTS, expandCollapseEnabled: true, defaultExpanded: false },
    { ...DEFAULTS, borderWidth: "4" },
    { ...DEFAULTS, borderWidth: "{{binding}}" },
  ];

  it.each(MATRIX.map((props, index) => [index, props]))(
    "row offset matches the pixel height for case %i",
    (_index, props) => {
      const px = getCardChromeHeightInPx(props as CardChromeProps);
      const rows = getCardChromeHeightInRows(props as CardChromeProps);

      expect(rows).toBe(Math.ceil(px / GridDefaults.DEFAULT_GRID_ROW_HEIGHT));
      expect(Number.isNaN(rows)).toBe(false);
      expect(rows).toBeGreaterThanOrEqual(0);
    },
  );
});
