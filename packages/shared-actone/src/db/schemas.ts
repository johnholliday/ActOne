import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import {
  projects,
  projectFiles,
  actoneProjectExt,
  assets,
  draftVersions,
} from './schema.js';
import {
  projectSnapshots,
  projectSnapshotFiles,
  projectAnalytics,
} from '@docugenix/sanyam-projects/schema';

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

// ── Snapshot schemas (from sanyam-projects tables) ──────────────────

export const snapshotSelectSchema = createSelectSchema(projectSnapshots);
export const snapshotInsertSchema = createInsertSchema(projectSnapshots);

// ── Snapshot file schemas ──────────────────────────────────────────

export const snapshotFileSelectSchema = createSelectSchema(projectSnapshotFiles);
export const snapshotFileInsertSchema = createInsertSchema(projectSnapshotFiles);

// ── Asset schemas ──────────────────────────────────────────────────

export const assetSelectSchema = createSelectSchema(assets);
export const assetInsertSchema = createInsertSchema(assets);

// ── Analytics snapshot schemas ─────────────────────────────────────

export const analyticsSnapshotSelectSchema =
  createSelectSchema(projectAnalytics);
export const analyticsSnapshotInsertSchema =
  createInsertSchema(projectAnalytics);

// ── Draft version schemas ──────────────────────────────────────────

export const draftVersionSelectSchema = createSelectSchema(draftVersions);
export const draftVersionInsertSchema = createInsertSchema(draftVersions);
