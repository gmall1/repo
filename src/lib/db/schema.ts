import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  uniqueIndex,
  index,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const visibilityEnum = pgEnum("visibility", ["public", "private"]);
export const ownerTypeEnum = pgEnum("owner_type", ["user", "org"]);
export const issueStateEnum = pgEnum("issue_state", ["open", "closed"]);
export const prStateEnum = pgEnum("pr_state", ["open", "merged", "closed"]);
export const orgRoleEnum = pgEnum("org_role", ["owner", "admin", "member"]);
export const planEnum = pgEnum("plan", ["free", "pro", "team"]);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    usernameLower: text("username_lower").notNull(),
    email: text("email").notNull(),
    emailLower: text("email_lower").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    websiteUrl: text("website_url"),
    location: text("location"),
    emailVerifiedAt: timestamp("email_verified_at"),
    plan: planEnum("plan").notNull().default("free"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    usernameIdx: uniqueIndex("users_username_lower_idx").on(t.usernameLower),
    emailIdx: uniqueIndex("users_email_lower_idx").on(t.emailLower),
  }),
);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userAgent: text("user_agent"),
  ip: text("ip"),
});

export const apiTokens = pgTable(
  "api_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull(),
    prefix: text("prefix").notNull(),
    scopes: text("scopes").notNull().default("repo"),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    hashIdx: uniqueIndex("api_tokens_hash_idx").on(t.tokenHash),
    userIdx: index("api_tokens_user_idx").on(t.userId),
  }),
);

export const emailVerifications = pgTable("email_verifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const passwordResets = pgTable("password_resets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orgs = pgTable(
  "orgs",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    nameLower: text("name_lower").notNull(),
    displayName: text("display_name"),
    description: text("description"),
    avatarUrl: text("avatar_url"),
    plan: planEnum("plan").notNull().default("free"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    nameIdx: uniqueIndex("orgs_name_lower_idx").on(t.nameLower),
  }),
);

export const orgMembers = pgTable(
  "org_members",
  {
    orgId: text("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: orgRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.orgId, t.userId] }),
  }),
);

export const repos = pgTable(
  "repos",
  {
    id: text("id").primaryKey(),
    ownerType: ownerTypeEnum("owner_type").notNull(),
    ownerId: text("owner_id").notNull(),
    ownerName: text("owner_name").notNull(),
    name: text("name").notNull(),
    nameLower: text("name_lower").notNull(),
    description: text("description"),
    visibility: visibilityEnum("visibility").notNull().default("public"),
    defaultBranch: text("default_branch").notNull().default("main"),
    storagePath: text("storage_path").notNull(),
    forkedFromId: text("forked_from_id"),
    starsCount: integer("stars_count").notNull().default(0),
    forksCount: integer("forks_count").notNull().default(0),
    issuesCount: integer("issues_count").notNull().default(0),
    pullsCount: integer("pulls_count").notNull().default(0),
    pushedAt: timestamp("pushed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    ownerNameIdx: uniqueIndex("repos_owner_name_idx").on(t.ownerName, t.nameLower),
    ownerIdx: index("repos_owner_idx").on(t.ownerId),
    visibilityIdx: index("repos_visibility_idx").on(t.visibility),
  }),
);

export const stars = pgTable(
  "stars",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    repoId: text("repo_id")
      .notNull()
      .references(() => repos.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.repoId] }),
    repoIdx: index("stars_repo_idx").on(t.repoId),
  }),
);

export const follows = pgTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.followerId, t.followingId] }),
  }),
);

export const issues = pgTable(
  "issues",
  {
    id: text("id").primaryKey(),
    repoId: text("repo_id")
      .notNull()
      .references(() => repos.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    state: issueStateEnum("state").notNull().default("open"),
    closedAt: timestamp("closed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    repoNumberIdx: uniqueIndex("issues_repo_number_idx").on(t.repoId, t.number),
    repoStateIdx: index("issues_repo_state_idx").on(t.repoId, t.state),
  }),
);

export const issueComments = pgTable("issue_comments", {
  id: text("id").primaryKey(),
  issueId: text("issue_id")
    .notNull()
    .references(() => issues.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const labels = pgTable(
  "labels",
  {
    id: text("id").primaryKey(),
    repoId: text("repo_id")
      .notNull()
      .references(() => repos.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull(),
    description: text("description"),
  },
  (t) => ({
    repoNameIdx: uniqueIndex("labels_repo_name_idx").on(t.repoId, t.name),
  }),
);

export const issueLabels = pgTable(
  "issue_labels",
  {
    issueId: text("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    labelId: text("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.issueId, t.labelId] }),
  }),
);

export const pullRequests = pgTable(
  "pull_requests",
  {
    id: text("id").primaryKey(),
    repoId: text("repo_id")
      .notNull()
      .references(() => repos.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    state: prStateEnum("state").notNull().default("open"),
    headBranch: text("head_branch").notNull(),
    baseBranch: text("base_branch").notNull(),
    headSha: text("head_sha"),
    baseSha: text("base_sha"),
    mergedAt: timestamp("merged_at"),
    mergedBy: text("merged_by"),
    mergeSha: text("merge_sha"),
    closedAt: timestamp("closed_at"),
    aiSummary: text("ai_summary"),
    aiReview: text("ai_review"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    repoNumberIdx: uniqueIndex("pulls_repo_number_idx").on(t.repoId, t.number),
    repoStateIdx: index("pulls_repo_state_idx").on(t.repoId, t.state),
  }),
);

export const prComments = pgTable("pr_comments", {
  id: text("id").primaryKey(),
  prId: text("pr_id")
    .notNull()
    .references(() => pullRequests.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  filePath: text("file_path"),
  line: integer("line"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    repoId: text("repo_id").references(() => repos.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    payload: text("payload").notNull().default("{}"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    actorIdx: index("events_actor_idx").on(t.actorId),
    repoIdx: index("events_repo_idx").on(t.repoId),
    createdIdx: index("events_created_idx").on(t.createdAt),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  tokens: many(apiTokens),
  starred: many(stars),
  orgMemberships: many(orgMembers),
  events: many(events),
}));

export const orgsRelations = relations(orgs, ({ many }) => ({
  members: many(orgMembers),
}));

export const reposRelations = relations(repos, ({ many }) => ({
  issues: many(issues),
  pulls: many(pullRequests),
  stars: many(stars),
  labels: many(labels),
}));

export const issuesRelations = relations(issues, ({ many, one }) => ({
  comments: many(issueComments),
  repo: one(repos, { fields: [issues.repoId], references: [repos.id] }),
  author: one(users, { fields: [issues.authorId], references: [users.id] }),
}));

export const pullRequestsRelations = relations(pullRequests, ({ many, one }) => ({
  comments: many(prComments),
  repo: one(repos, { fields: [pullRequests.repoId], references: [repos.id] }),
  author: one(users, { fields: [pullRequests.authorId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type Repo = typeof repos.$inferSelect;
export type Issue = typeof issues.$inferSelect;
export type PullRequest = typeof pullRequests.$inferSelect;
export type Session = typeof sessions.$inferSelect;
