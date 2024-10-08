import React from "react";
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import { faker } from "@faker-js/faker";

import { AIChat, type AIChatProps } from "..";
import userEvent from "@testing-library/user-event";

const renderComponent = (props: Partial<AIChatProps> = {}) => {
  const defaultProps: AIChatProps = {
    username: "",
    thread: [],
    prompt: "",
    onPromptChange: jest.fn(),
  };

  return render(<AIChat {...defaultProps} {...props} />);
};

describe("@appsmith/wds/AIChat", () => {
  it("should render chat's title", () => {
    const chatTitle = faker.lorem.words(2);

    renderComponent({ chatTitle });

    expect(screen.getByTestId("t--aichat-chat-title")).toHaveTextContent(
      chatTitle,
    );
  });

  it("should render username", () => {
    const username = faker.name.firstName();

    renderComponent({ username });

    expect(screen.getByTestId("t--aichat-username")).toHaveTextContent(
      username,
    );
  });

  it("should render thread", () => {
    const thread = [
      {
        id: faker.datatype.uuid(),
        content: faker.lorem.paragraph(1),
        isAssistant: false,
      },
      {
        id: faker.datatype.uuid(),
        content: faker.lorem.paragraph(2),
        isAssistant: true,
      },
    ];

    renderComponent({ thread });

    const messages = within(
      screen.getByTestId("t--aichat-thread"),
    ).getAllByRole("listitem");

    expect(messages).toHaveLength(thread.length);
    expect(messages[0]).toHaveTextContent(thread[0].content);
    expect(messages[1]).toHaveTextContent(thread[1].content);
  });

  it("should render prompt input placeholder", () => {
    const promptInputPlaceholder = faker.lorem.words(3);

    renderComponent({
      promptInputPlaceholder,
    });

    expect(screen.getByRole("textbox")).toHaveAttribute(
      "placeholder",
      promptInputPlaceholder,
    );
  });

  it("should render prompt input value", () => {
    const prompt = faker.lorem.words(3);

    renderComponent({
      prompt,
    });

    expect(screen.getByRole("textbox")).toHaveValue(prompt);
  });

  it("should trigger user's prompt", async () => {
    const onPromptChange = jest.fn();

    renderComponent({
      onPromptChange,
    });

    await userEvent.type(screen.getByRole("textbox"), "A");

    expect(onPromptChange).toHaveBeenCalledWith("A");
  });

  it("should submit user's prompt", async () => {
    const onSubmit = jest.fn();

    renderComponent({
      prompt: "ABCD",
      onSubmit,
    });

    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(onSubmit).toHaveBeenCalled();
  });
});
