import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContentFeedback } from "@/components/content-feedback";
import {
  buildCanonicalUrl,
  buildContentFeedbackBody,
  buildContentFeedbackMailto,
  buildContentFeedbackSubject,
} from "@/lib/content-feedback";

const context = {
  title: "1988 赛季",
  canonicalPath: "/seasons/1988",
  entityType: "season" as const,
  entityId: "season-1988",
  appVersion: "0.1.0",
  contentVersion: "abc123def456",
};

describe("content feedback helpers", () => {
  it("builds the canonical URL, subject, body, and mailto payload", () => {
    expect(buildCanonicalUrl("/seasons/1988", "https://track.example/")).toBe(
      "https://track.example/seasons/1988",
    );
    expect(buildContentFeedbackSubject(context)).toBe("[内容纠错] 1988 赛季");

    const body = buildContentFeedbackBody(context, "https://track.example");
    expect(body).toContain("页面标题：1988 赛季");
    expect(body).toContain("页面链接：https://track.example/seasons/1988");
    expect(body).toContain("实体类型：season");
    expect(body).toContain("实体 ID：season-1988");
    expect(body).toContain("应用版本：0.1.0");
    expect(body).toContain("内容版本：abc123def456");

    expect(
      buildContentFeedbackMailto(
        "feedback@example.com",
        context,
        "https://track.example",
      ),
    ).toContain("mailto:feedback%40example.com?subject=");
  });
});

describe("ContentFeedback", () => {
  it("renders the mailto action and reveals the manual fallback", () => {
    render(
      <ContentFeedback
        recipient="feedback@example.com"
        mailtoHref={buildContentFeedbackMailto(
          "feedback@example.com",
          context,
          "https://track.example",
        )}
        context={context}
      />,
    );

    expect(
      screen.getByRole("link", { name: "报告 1988 赛季 的内容问题" }),
    ).toHaveAttribute("href", expect.stringContaining("mailto:"));
    expect(screen.queryByLabelText("页面参考信息")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "无法打开邮件？查看手动反馈方式" }),
    );

    expect(
      (screen.getByLabelText("页面参考信息") as HTMLTextAreaElement).value,
    ).toContain("页面标题：1988 赛季");
    expect(screen.getByText(/feedback@example.com/)).toBeInTheDocument();
  });
});
