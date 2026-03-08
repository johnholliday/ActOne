import { relations } from 'drizzle-orm';
import {
  projects,
  sourceFiles,
  snapshots,
  snapshotFiles,
  assets,
  analyticsSnapshots,
  draftVersions,
} from './schema.js';

export const projectsRelations = relations(projects, ({ many }) => ({
  sourceFiles: many(sourceFiles),
  snapshots: many(snapshots),
  assets: many(assets),
  analyticsSnapshots: many(analyticsSnapshots),
  draftVersions: many(draftVersions),
}));

export const sourceFilesRelations = relations(sourceFiles, ({ one }) => ({
  project: one(projects, {
    fields: [sourceFiles.projectId],
    references: [projects.id],
  }),
}));

export const snapshotsRelations = relations(snapshots, ({ one, many }) => ({
  project: one(projects, {
    fields: [snapshots.projectId],
    references: [projects.id],
  }),
  files: many(snapshotFiles),
}));

export const snapshotFilesRelations = relations(snapshotFiles, ({ one }) => ({
  snapshot: one(snapshots, {
    fields: [snapshotFiles.snapshotId],
    references: [snapshots.id],
  }),
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  project: one(projects, {
    fields: [assets.projectId],
    references: [projects.id],
  }),
}));

export const analyticsSnapshotsRelations = relations(
  analyticsSnapshots,
  ({ one }) => ({
    project: one(projects, {
      fields: [analyticsSnapshots.projectId],
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
