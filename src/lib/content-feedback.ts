export type ContentFeedbackContext = {
  title: string;
  canonicalPath: string;
  entityType: "season" | "car" | "person" | "technology";
  entityId: string;
  appVersion: string;
  contentVersion: string;
};

function normalizeSiteUrl(siteUrl: string | undefined): string {
  const value = siteUrl?.trim();
  if (!value) {
    return "http://localhost:3000";
  }
  return value.replace(/\/+$/, "");
}

export function buildCanonicalUrl(
  canonicalPath: string,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL,
): string {
  const baseUrl = normalizeSiteUrl(siteUrl);
  const normalizedPath = canonicalPath.startsWith("/")
    ? canonicalPath
    : `/${canonicalPath}`;
  return `${baseUrl}${normalizedPath}`;
}

export function buildContentFeedbackSubject(
  context: ContentFeedbackContext,
): string {
  return `[内容纠错] ${context.title}`;
}

export function buildContentFeedbackBody(
  context: ContentFeedbackContext,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL,
): string {
  return [
    "你好，产品团队：",
    "",
    "我想报告这个页面里可能存在的事实或编辑问题。",
    "",
    `页面标题：${context.title}`,
    `页面链接：${buildCanonicalUrl(context.canonicalPath, siteUrl)}`,
    `实体类型：${context.entityType}`,
    `实体 ID：${context.entityId}`,
    `应用版本：${context.appVersion}`,
    `内容版本：${context.contentVersion}`,
    "",
    "我认为可能有问题的内容：",
    "",
    "我参考的来源（如果有）：",
    "",
    "补充说明：",
  ].join("\n");
}

export function buildContentFeedbackMailto(
  recipient: string,
  context: ContentFeedbackContext,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL,
): string {
  const subject = buildContentFeedbackSubject(context);
  const body = buildContentFeedbackBody(context, siteUrl);
  return `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
