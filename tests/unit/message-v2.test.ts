import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { MessageContent } from "@/features/im/message-content";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

it("shows V2 history text and files when legacy content is empty", () => {
  const markup = renderToStaticMarkup(
    createElement(MessageContent, {
      type: 144,
      content: "",
      message: {
        components: [
          {
            type: 17,
            components: [
              { type: 10, content: "**Report**" },
              { type: 13, file: { url: "attachment://report.txt" } },
            ],
          },
        ],
        attachments: [
          {
            id: "file",
            filename: "report.txt",
            url: "https://example.org/report.txt",
            content_type: "text/plain",
          },
        ],
      },
    }),
  );
  expect(markup).toContain("<strong>Report</strong>");
  expect(markup).toContain('href="https://example.org/report.txt"');
});

it("still reads the existing notification payload", () => {
  const markup = renderToStaticMarkup(
    createElement(MessageContent, {
      type: 1400,
      content: JSON.stringify({ text: "Notice" }),
    }),
  );
  expect(markup).toContain("Notice");
});

it("uses the declared type even when the component body is missing", () => {
  const markup = renderToStaticMarkup(
    createElement(MessageContent, {
      type: 144,
      content: JSON.stringify({ content: "stale body" }),
    }),
  );
  expect(markup).not.toContain("stale body");
});

it("shows component bodies inside existing forwarded history", () => {
  const markup = renderToStaticMarkup(
    createElement(MessageContent, {
      type: 107,
      content: JSON.stringify({
        multiMessage: [
          {
            contentType: 144,
            message: { components: [{ type: 10, content: "forwarded text" }] },
          },
        ],
      }),
    }),
  );
  expect(markup).toContain("forwarded text");
});
