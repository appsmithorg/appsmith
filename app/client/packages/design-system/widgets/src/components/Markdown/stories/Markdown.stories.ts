import { Markdown } from "@appsmith/wds";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Markdown> = {
  title: "WDS/Widgets/Markdown",
  component: Markdown,
};

export default meta;
type Story = StoryObj<typeof Markdown>;

export const Default: Story = {
  args: {
    children: `# Hello, Markdown!

This is a \`paragraph\` with **bold** and *italic* text.

## Code Example

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

- List item 1
- List item 2
- List item 3
    - List item 3.1
    - List item 3.2
    - List item 3.3
      - List item 3.3.1
      - List item 3.3.2

1. List item 1
2. List item 2
3. List item 3

[Visit Appsmith](https://www.appsmith.com)

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

## Table Example

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1, Cell 1 | Row 1, Cell 2 | Row 1, Cell 3 |
| Row 2, Cell 1 | Row 2, Cell 2 | Row 2, Cell 3 |
| Row 3, Cell 1 | Row 3, Cell 2 | Row 3, Cell 3 |

## Blockquote Example

> This is a blockquote.
>
> It can span multiple lines.
`,
  },
};
