import { relations } from 'drizzle-orm';
import { projects, projectFiles } from '@docugenix/sanyam-db/schema';
import {
  projectSnapshots,
  projectSnapshotFiles,
  projectAnalytics,
} from '@docugenix/sanyam-projects/schema';
import {
  actoneProjectExt,
  assets,
  draftVersions,
  conversations,
  chatMessages,
} from './schema.js';

export const projectsRelations = relations(projects, ({ one, many }) => ({
  actoneExt: one(actoneProjectExt, {
    fields: [projects.id],
    references: [actoneProjectExt.projectId],
  }),
  projectFiles: many(projectFiles),
  snapshots: many(projectSnapshots),
  assets: many(assets),
  analyticsSnapshots: many(projectAnalytics),
  draftVersions: many(draftVersions),
  conversations: many(conversations),
}));

export const actoneProjectExtRelations = relations(actoneProjectExt, ({ one }) => ({
  project: one(projects, {
    fields: [actoneProjectExt.projectId],
    references: [projects.id],
  }),
}));

export const projectFilesRelations = relations(projectFiles, ({ one }) => ({
  project: one(projects, {
    fields: [projectFiles.projectId],
    references: [projects.id],
  }),
}));

export const snapshotsRelations = relations(projectSnapshots, ({ one, many }) => ({
  project: one(projects, {
    fields: [projectSnapshots.projectId],
    references: [projects.id],
  }),
  files: many(projectSnapshotFiles),
}));

export const snapshotFilesRelations = relations(projectSnapshotFiles, ({ one }) => ({
  snapshot: one(projectSnapshots, {
    fields: [projectSnapshotFiles.snapshotId],
    references: [projectSnapshots.id],
  }),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  project: one(projects, {
    fields: [assets.projectId],
    references: [projects.id],
  }),
}));

export const analyticsSnapshotsRelations = relations(
  projectAnalytics,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectAnalytics.projectId],
      references: [projects.id],
    }),
  }),
);

export const draftVersionsRelations = relations(draftVersions, ({ one }) => ({
  project: one(projects, {
    fields: [draftVersions.projectId],
    references: [projects.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  project: one(projects, {
    fields: [conversations.projectId],
    references: [projects.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [chatMessages.conversationId],
    references: [conversations.id],
  }),
}));
