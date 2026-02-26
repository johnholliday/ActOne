import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import {
  projects,
  sourceFiles,
  snapshots,
  snapshotFiles,
  assets,
  analyticsSnapshots,
  draftVersions,
} from './schema.js';

// ── Project schemas ────────────────────────────────────────────────────

export const projectSelectSchema = createSelectSchema(projects);
export const projectInsertSchema = createInsertSchema(projects);
export const projectUpdateSchema = createUpdateSchema(projects);

// ── Source file schemas ────────────────────────────────────────────────

export const sourceFileSelectSchema = createSelectSchema(sourceFiles);
export const sourceFileInsertSchema = createInsertSchema(sourceFiles);
export const sourceFileUpdateSchema = createUpdateSchema(sourceFiles);

// ── Snapshot schemas ───────────────────────────────────────────────────

export const snapshotSelectSchema = createSelectSchema(snapshots);
export const snapshotInsertSchema = createInsertSchema(snapshots);

// ── Snapshot file schemas ──────────────────────────────────────────────

export const snapshotFileSelectSchema = createSelectSchema(snapshotFiles);
export const snapshotFileInsertSchema = createInsertSchema(snapshotFiles);

// ── Asset schemas ──────────────────────────────────────────────────────

export const assetSelectSchema = createSelectSchema(assets);
export const assetInsertSchema = createInsertSchema(assets);

// ── Analytics snapshot schemas ─────────────────────────────────────────

export const analyticsSnapshotSelectSchema =
  createSelectSchema(analyticsSnapshots);
export const analyticsSnapshotInsertSchema =
  createInsertSchema(analyticsSnapshots);

// ── Draft version schemas ──────────────────────────────────────────────

export const draftVersionSelectSchema = createSelectSchema(draftVersions);
export const draftVersionInsertSchema = createInsertSchema(draftVersions);
