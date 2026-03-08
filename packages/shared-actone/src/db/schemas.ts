import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import {
  projects,
  projectFiles,
  actoneProjectExt,
  snapshots,
  snapshotFiles,
  assets,
  analyticsSnapshots,
  draftVersions,
} from './schema.js';

// ── Project schemas ────────────────────────────────────────────────

export const projectSelectSchema = createSelectSchema(projects);
export const projectInsertSchema = createInsertSchema(projects);
export const projectUpdateSchema = createUpdateSchema(projects);

// ── Project extension schemas ──────────────────────────────────────

export const actoneProjectExtSelectSchema = createSelectSchema(actoneProjectExt);
export const actoneProjectExtInsertSchema = createInsertSchema(actoneProjectExt);
export const actoneProjectExtUpdateSchema = createUpdateSchema(actoneProjectExt);

// ── Project file schemas ───────────────────────────────────────────

export const projectFileSelectSchema = createSelectSchema(projectFiles);
export const projectFileInsertSchema = createInsertSchema(projectFiles);
export const projectFileUpdateSchema = createUpdateSchema(projectFiles);

// Backward-compatible aliases
export const sourceFileSelectSchema = projectFileSelectSchema;
export const sourceFileInsertSchema = projectFileInsertSchema;
export const sourceFileUpdateSchema = projectFileUpdateSchema;

// ── Snapshot schemas ───────────────────────────────────────────────

export const snapshotSelectSchema = createSelectSchema(snapshots);
export const snapshotInsertSchema = createInsertSchema(snapshots);

// ── Snapshot file schemas ──────────────────────────────────────────

export const snapshotFileSelectSchema = createSelectSchema(snapshotFiles);
export const snapshotFileInsertSchema = createInsertSchema(snapshotFiles);

// ── Asset schemas ──────────────────────────────────────────────────

export const assetSelectSchema = createSelectSchema(assets);
export const assetInsertSchema = createInsertSchema(assets);

// ── Analytics snapshot schemas ─────────────────────────────────────

export const analyticsSnapshotSelectSchema =
  createSelectSchema(analyticsSnapshots);
export const analyticsSnapshotInsertSchema =
  createInsertSchema(analyticsSnapshots);

// ── Draft version schemas ──────────────────────────────────────────

export const draftVersionSelectSchema = createSelectSchema(draftVersions);
export const draftVersionInsertSchema = createInsertSchema(draftVersions);
