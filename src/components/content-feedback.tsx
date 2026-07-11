"use client";

import { useState } from "react";
import {
  buildCanonicalUrl,
  type ContentFeedbackContext,
} from "@/lib/content-feedback";

type ContentFeedbackProps = {
  recipient: string;
  mailtoHref: string;
  context: ContentFeedbackContext;
};

export function ContentFeedback({
  recipient,
  mailtoHref,
  context,
}: ContentFeedbackProps) {
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const pageReference = [
    `页面标题：${context.title}`,
    `页面链接：${buildCanonicalUrl(context.canonicalPath)}`,
    `实体类型：${context.entityType}`,
    `实体 ID：${context.entityId}`,
    `应用版本：${context.appVersion}`,
    `内容版本：${context.contentVersion}`,
  ].join("\n");

  return (
    <section
      className="content-feedback"
      aria-labelledby="content-feedback-title"
    >
      <div className="section-head">
        <h2 className="section-title" id="content-feedback-title">
          发现内容问题？
        </h2>
      </div>
      <p className="section-text">
        如果你发现史实、译名或表述问题，可以把当前页面信息带入邮件草稿，
        直接发给内容负责人复核。
      </p>
      <div className="content-feedback-actions">
        <a
          href={mailtoHref}
          className="content-feedback-primary tap-target"
          aria-label={`报告 ${context.title} 的内容问题`}
        >
          报告内容问题
        </a>
        <button
          type="button"
          className="content-feedback-secondary tap-target"
          onClick={() => setFallbackOpen((open) => !open)}
          aria-expanded={fallbackOpen}
          aria-controls="content-feedback-fallback"
        >
          无法打开邮件？查看手动反馈方式
        </button>
      </div>
      {fallbackOpen ? (
        <div
          id="content-feedback-fallback"
          className="content-feedback-fallback"
        >
          <p className="content-feedback-fallback-text">
            如果设备没有配置邮件客户端，请手动发送邮件到
            <strong>{recipient}</strong>，并附上下面的页面参考信息。
          </p>
          <label
            className="content-feedback-fallback-label"
            htmlFor="feedback-reference"
          >
            页面参考信息
          </label>
          <textarea
            id="feedback-reference"
            className="content-feedback-fallback-textarea"
            value={pageReference}
            readOnly
          />
        </div>
      ) : null}
    </section>
  );
}
