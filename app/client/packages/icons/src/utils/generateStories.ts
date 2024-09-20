import fs from "fs-extra";

const createImportListString = (name: string, dir: string) => {
  return `import { ${name} } from "../components/${dir}/${name}";
`;
};

const createComponentListString = (name: string) => {
  return `<${name} />`;
};

const createStory = (
  title: string,
  description: string,
  importList: string,
  componentList: string,
) => {
  return `import { Meta } from "@storybook/addon-docs";
import { Flex } from "@appsmith/wds";
${importList}
<Meta title="Appsmith Icons/${title}" />

# ${title}

${description}

export const Icons = () => {
  return (
    <Flex gap="spacing-4" wrap="wrap">
      ${componentList}
    </Flex>
  );
};

<Icons />
`;
};

async function generateStories() {
  await generateStory(
    "Thumbnails",
    "Icon set for Widget Explorer Panel, which provides a visual representation of the widgets.",
  );
  await generateStory(
    "Icons",
    "Icon set for Entity Explorer Panel, which provides a visual representation of the widgets.",
  );
  // eslint-disable-next-line no-console
  console.error("\x1b[32mStories generation completed successfully!\x1b[0m");
}

async function generateStory(title: string, description: string) {
  await fs.readdir(`./src/components/${title}/`, async (err, files) => {
    if (err) {
      // eslint-disable-next-line no-console
      return console.error(err);
    }

    let importList = ``;
    let componentList = ``;

    files.forEach((file) => {
      const name = file.replace(".tsx", "");

      importList += createImportListString(name, title);
      componentList += createComponentListString(name);
    });

    await fs.writeFile(
      `./src/stories/${title}.mdx`,
      createStory(title, description, importList, componentList),
      "utf8",
      function (err) {
        // eslint-disable-next-line no-console
        if (err) return console.error(err);
      },
    );
  });
}

generateStories();
