import Queue from "./Queue";

enum TestType {
  A,
  B,
  C,
  D,
}

describe("#has", () => {
  it("returns true for item type present in queue", () => {
    const defaultQueueItems = [
      { type: TestType.A },
      { type: TestType.B, metadata: { foo: "bar " } },
    ];
    const queue = new Queue<TestType>(defaultQueueItems);

    const testCases = [TestType.A, TestType.B];

    testCases.forEach((input) => {
      const output = queue.has(input);

      expect(output).toEqual(true);
    });
  });

  it("returns false for item type not present in queue", () => {
    const defaultQueueItems = [
      { type: TestType.A },
      { type: TestType.B, metadata: { foo: "bar " } },
    ];
    const queue = new Queue<TestType>(defaultQueueItems);

    const testCases = [TestType.C];

    testCases.forEach((input) => {
      const output = queue.has(input);

      expect(output).toEqual(false);
    });
  });
});

describe("#add", () => {
  it("adds object items to the queue", () => {
    const defaultQueueItems = [{ type: TestType.B, metadata: { foo: "bar " } }];
    const queue = new Queue<TestType>(defaultQueueItems);

    const testCases = [
      { type: TestType.A },
      { type: TestType.C, metadata: {} },
    ];

    testCases.forEach((input) => {
      queue.add(input);

      expect(queue.has(input.type)).toEqual(true);
    });
  });

  it("adds item types only to the queue", () => {
    const defaultQueueItems = [{ type: TestType.B, metadata: { foo: "bar " } }];
    const queue = new Queue<TestType>(defaultQueueItems);

    const testCases = [TestType.A, TestType.C];

    testCases.forEach((input) => {
      queue.add(input);

      expect(queue.has(input)).toEqual(true);
    });
  });

  it("it throws error for non primitive types", () => {
    const defaultQueueItems = [{ type: TestType.B, metadata: { foo: "bar " } }];
    const queue = new Queue<TestType>(defaultQueueItems);

    const testCases = [
      null,
      undefined,
      { foo: "bar" },
    ] as unknown as TestType[];

    testCases.forEach((input) => {
      expect(() => queue.add(input)).toThrowError(
        `Queue.add - ${input} is not a primitive type (String, Number, Boolean)`,
      );
    });
  });
});

describe("#flush", () => {
  it("flushes the queue", () => {
    const defaultQueueItems = [{ type: TestType.B, metadata: { foo: "bar " } }];
    const queue = new Queue<TestType>(defaultQueueItems);

    queue.flush();

    expect(queue.has(defaultQueueItems[0].type)).toEqual(false);
  });
});

describe("#metadata", () => {
  it("returns metadata for default items", () => {
    const defaultQueueItems = [
      { type: TestType.B, metadata: { foo: "bar " } },
      { type: TestType.A },
    ];
    const queue = new Queue<TestType>(defaultQueueItems);

    const testCases = [
      { input: TestType.A, expectedOutput: undefined },
      { input: TestType.B, expectedOutput: defaultQueueItems[0].metadata },
    ];

    testCases.forEach(({ expectedOutput, input }) => {
      const output = queue.metadata(input);

      expect(output).toEqual(expectedOutput);
    });
  });

  it("returns metadata for default items added with #add method", () => {
    const defaultQueueItems = [{ type: TestType.B, metadata: { foo: "bar " } }];
    const queue = new Queue<TestType>(defaultQueueItems);

    const newItems = [
      { type: TestType.A },
      { type: TestType.C, metadata: {} },
      { type: TestType.D, metadata: { bar: " baz" } },
    ];

    const testCases = [...defaultQueueItems, ...newItems];

    newItems.forEach(queue.add);

    testCases.forEach(({ metadata, type }) => {
      const output = queue.metadata(type);

      expect(output).toEqual(metadata);
    });
  });

  it("returns metadata for first encountered item if multiple found", () => {
    const defaultQueueItems = [{ type: TestType.B, metadata: { foo: "bar " } }];
    const queue = new Queue<TestType>(defaultQueueItems);

    const newItems = [
      { type: TestType.A },
      { type: TestType.C, metadata: {} },
      { type: TestType.C, metadata: { bar: " baz" } },
      { type: TestType.B, metadata: { bar: " baz" } },
    ];

    const testCases = [
      { input: TestType.A, expectedOutput: undefined },
      { input: TestType.B, expectedOutput: defaultQueueItems[0].metadata },
      { input: TestType.C, expectedOutput: newItems[1].metadata },
    ];

    newItems.forEach(queue.add);

    testCases.forEach(({ expectedOutput, input }) => {
      const output = queue.metadata(input);

      expect(output).toEqual(expectedOutput);
    });
  });
});
