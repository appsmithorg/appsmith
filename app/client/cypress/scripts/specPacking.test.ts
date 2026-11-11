import {
  DEFAULT_SPEC_DURATION_MS,
  divideSpecsIntoBalancedGroups,
  specDurationMs,
} from "./specPacking";
import type { DataItem } from "./specPacking";

const spec = (name: string, duration: string | number): DataItem => ({
  name,
  duration,
});

const totalOf = (group: DataItem[]) =>
  group.reduce((acc, item) => acc + specDurationMs(item), 0);

const namesOf = (groups: DataItem[][]) =>
  groups.map((group) => group.map((item) => item.name));

describe("specDurationMs", () => {
  it("reads numeric and string durations alike", () => {
    expect(specDurationMs(spec("a", 5000))).toBe(5000);
    expect(specDurationMs(spec("a", "5000"))).toBe(5000);
  });

  it("falls back to the default weight when the duration is unusable", () => {
    expect(specDurationMs(spec("a", ""))).toBe(DEFAULT_SPEC_DURATION_MS);
    expect(specDurationMs(spec("a", "not-a-number"))).toBe(
      DEFAULT_SPEC_DURATION_MS,
    );
    expect(specDurationMs(spec("a", 0))).toBe(DEFAULT_SPEC_DURATION_MS);
    expect(specDurationMs(spec("a", -1))).toBe(DEFAULT_SPEC_DURATION_MS);
  });
});

describe("divideSpecsIntoBalancedGroups", () => {
  it("keeps the heaviest spec off an already loaded group", () => {
    // Fed in ascending order, so the heaviest spec arrives last.
    const specs = [
      spec("light-1", 1000),
      spec("light-2", 1000),
      spec("medium", 4000),
      spec("heaviest", 6000),
    ];

    const groups = divideSpecsIntoBalancedGroups(specs, 2);

    expect(totalOf(groups[0])).toBe(6000);
    expect(totalOf(groups[1])).toBe(6000);
  });

  it("places every spec exactly once", () => {
    const specs = Array.from({ length: 50 }, (_, index) =>
      spec(`spec-${index}`, (index % 7) * 1000 + 500),
    );

    const groups = divideSpecsIntoBalancedGroups(specs, 6);
    const placed = groups
      .flat()
      .map((item) => item.name)
      .sort();

    expect(groups).toHaveLength(6);
    expect(placed).toEqual(specs.map((item) => item.name).sort());
  });

  it("balances a long tail within one spec of the heaviest group", () => {
    const specs = Array.from({ length: 200 }, (_, index) =>
      spec(`spec-${index}`, ((index * 37) % 23) * 1000 + 1000),
    );

    const groups = divideSpecsIntoBalancedGroups(specs, 12);
    const totals = groups.map(totalOf);
    const heaviestSpec = Math.max(...specs.map(specDurationMs));

    expect(Math.max(...totals) - Math.min(...totals)).toBeLessThanOrEqual(
      heaviestSpec,
    );
  });

  it("produces the same groups regardless of input order", () => {
    const specs = Array.from({ length: 40 }, (_, index) =>
      spec(`spec-${index}`, ((index * 13) % 9) * 1000 + 1000),
    );

    const forwards = divideSpecsIntoBalancedGroups(specs, 5);
    const backwards = divideSpecsIntoBalancedGroups([...specs].reverse(), 5);

    expect(namesOf(backwards)).toEqual(namesOf(forwards));
  });

  it("weights specs with no recorded duration at the default", () => {
    const groups = divideSpecsIntoBalancedGroups(
      [
        spec("unknown", ""),
        spec("known", DEFAULT_SPEC_DURATION_MS - 1000),
        spec("filler", 1000),
      ],
      2,
    );

    // "unknown" is the heaviest once it takes the default weight, so it is placed
    // first and "filler" lands beside the lighter known spec.
    expect(namesOf(groups)).toEqual([["unknown"], ["known", "filler"]]);
  });

  it("does not mutate the caller's array", () => {
    const specs = [spec("a", 1000), spec("b", 9000)];

    divideSpecsIntoBalancedGroups(specs, 2);

    expect(specs.map((item) => item.name)).toEqual(["a", "b"]);
  });

  it("returns no groups when there are no runners to fill", () => {
    expect(divideSpecsIntoBalancedGroups([spec("a", 1000)], 0)).toEqual([]);
  });
});
