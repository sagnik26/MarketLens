/** App-wide constants and const maps (ChangeType, SignalType, Priority, PageType, etc.). */

export const ChangeType = {
  PRICING: "pricing",
  FEATURE_ADD: "feature_add",
  FEATURE_REMOVE: "feature_remove",
  MESSAGING: "messaging",
  JOB_SIGNAL: "job_signal",
  REVIEW_TREND: "review_trend",
  CHANGELOG: "changelog",
  CIRCULAR: "circular",
  CUSTOM: "custom",
} as const;

export const SignalType = {
  THREAT: "threat",
  OPPORTUNITY: "opportunity",
  INFORMATIONAL: "informational",
  NOISE: "noise",
} as const;

export const Priority = {
  URGENT: "URGENT",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
} as const;

export const PageType = {
  PRICING: "pricing",
  FEATURES: "features",
  JOBS: "jobs",
  BLOG: "blog",
  REVIEWS: "reviews",
  CHANGELOG: "changelog",
  COMPLIANCE: "compliance",
  CUSTOM: "custom",
} as const;

export const SourceChannel = {
  PRICING: "pricing",
  JOBS: "jobs",
  PRODUCT: "product",
  FEATURES: "features",
  CHANGELOG: "changelog",
  REVIEWS: "reviews",
} as const;

export type SourceChannel = (typeof SourceChannel)[keyof typeof SourceChannel];

export const SOURCE_CHANNEL_LABELS: Record<SourceChannel, string> = {
  [SourceChannel.PRICING]: "Pricing pages",
  [SourceChannel.JOBS]: "Job postings",
  [SourceChannel.PRODUCT]: "Product",
  [SourceChannel.FEATURES]: "Features pages",
  [SourceChannel.CHANGELOG]: "Changelog/release notes",
  [SourceChannel.REVIEWS]: "Reviews",
};
