import { AI_AGENTS_TEST } from "../../../../support/Constants";

describe(
  `${AI_AGENTS_TEST}: This is a dummy test`,
  { tags: ["@tag.AIAgents"] },
  function () {
    it("1. This is a dummy test to check if the tag is working.", () => {
      expect(true).to.equal(true);
    });
  },
);
