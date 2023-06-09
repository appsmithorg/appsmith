import { AUTOCOMPLETE_MATCH_REGEX } from "constants/BindingsConstants";

describe("AUTOCOMPLETE_MATCH_REGEX match", () => {
  it("1. should match all valid {{ }} bindings", () => {
    const tests = [
      {
        value: `Hello {{appsmith.mode}}A{{Button1.text}} {{{ a: 2 }}}A`,
        matches: [
          { start: 6, end: 8 },
          { start: 21, end: 23 },
          { start: 24, end: 26 },
          { start: 38, end: 40 },
          { start: 41, end: 43 },
          { start: 51, end: 53 },
        ],
      },
      {
        value: `{{Api1.run().then(() => {
      showAlert("", '');
    });}}`,
        matches: [
          { start: 0, end: 2 },
          { start: 58, end: 60 },
        ],
      },
      {
        value: `{{(() => { const a = "}"; return a;})()}}`,
        matches: [
          { start: 0, end: 2 },
          { start: 39, end: 41 },
        ],
      },
      {
        value: `{{Api1.run().then(() => {
      Api1.run();
    }).catch(() => {
      showAlert("", '');
    });}}`,
        matches: [
          { start: 0, end: 2 },
          { start: 97, end: 99 },
        ],
      },
      {
        value: `{{ FilePicker.files[0] ? FilePicker.files[0] : {}}}`,
        matches: [
          { start: 0, end: 2 },
          { start: 49, end: 51 },
        ],
      },
    ];

    test.each(
      tests.map(({ matches, value }) => {
        const executedMatches: Record<string, unknown>[] = [];

        let match;

        while ((match = AUTOCOMPLETE_MATCH_REGEX.exec(value)) !== null) {
          executedMatches.push({
            start: match.index,
            end: AUTOCOMPLETE_MATCH_REGEX.lastIndex,
          });
        }

        expect(executedMatches).toEqual(matches);
      }),
    );
  });
});
