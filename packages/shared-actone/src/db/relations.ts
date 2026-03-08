import { relations } from 'drizzle-orm';
import { projects, projectFiles } from '@docugenix/sanyam-db/schema';
import {
  actoneProjectExt,
  snapshots,
  snapshotFiles,
  assets,
  analyticsSnapshots,
  draftVersions,
} from './schema.js';

export const projectsRelations = relations(projects, ({ one, many }) => ({
  actoneExt: one(actoneProjectExt, {
    fields: [projects.id],
    references: [actoneProjectExt.projectId],
  }),
  projectFiles: many(projectFiles),
  snapshots: many(snapshots),
  assets: many(assets),
  analyticsSnapshots: many(analyticsSnapshots),
  draftVersions: many(draftVersions),
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
