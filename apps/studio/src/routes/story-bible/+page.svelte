<script lang="ts">
  /**
   * T103: Story Bible page.
   *
   * Comprehensive reference with sections for Characters, Worlds,
   * Relationships, Themes, Plots, and Scenes.
   */
  import { astStore } from '$lib/stores/ast.svelte.js';
  import {
    findCharacters,
    findWorlds,
    findScenes,
    findPlots,
    findThemes,
    findInteractions,
    findTimelines,
    countSceneAppearances,
    getCharacterRelationships,
  } from '$lib/ast/ast-utils.js';
  import { extractAnalytics } from '$lib/project/analytics.js';

  const story = $derived(astStore.activeAst);
  const characters = $derived(story ? findCharacters(story) : []);
  const worlds = $derived(story ? findWorlds(story) : []);
  const scenes = $derived(story ? findScenes(story) : []);
  const plots = $derived(story ? findPlots(story) : []);
  const themes = $derived(story ? findThemes(story) : []);
  const interactions = $derived(story ? findInteractions(story) : []);
  const timelines = $derived(story ? findTimelines(story) : []);
  const analytics = $derived(story ? extractAnalytics(story) : null);

  // Build character names list and relationship matrix for the Relationships tab
  const characterNames = $derived(characters.map((c) => c.name));
  const relationshipLookup = $derived(() => {
    const lookup = new Map<string, { weight: number; label: string; dynamic: boolean }>();
    if (!analytics) return lookup;
    for (const rel of analytics.relationshipMatrix) {
      lookup.set(`${rel.from}→${rel.to}`, rel);
    }
    return lookup;
  });

  let activeTab = $state<string>('characters');

  const tabs = [
    { id: 'characters', label: 'Characters' },
    { id: 'worlds', label: 'Worlds' },
    { id: 'relationships', label: 'Relationships' },
    { id: 'themes', label: 'Themes' },
    { id: 'plots', label: 'Plots' },
    { id: 'scenes', label: 'Scenes' },
    { id: 'interactions', label: 'Interactions' },
    { id: 'timelines', label: 'Timelines' },
  ];

  function getRelationshipCell(from: string, to: string): { weight: number; label: string; dynamic: boolean } | null {
    if (from === to) return null;
    const lookup = relationshipLookup();
    return lookup.get(`${from}→${to}`) ?? null;
  }

  function weightColor(weight: number): string {
    if (weight > 50) return '#22c55e';
    if (weight > 0) return '#86efac';
    if (weight === 0) return '#6b7280';
    if (weight > -50) return '#fca5a5';
    return '#ef4444';
  }
</script>

<div class="story-bible">
  <h1>Story Bible</h1>

  <nav class="tab-bar">
    {#each tabs as tab}
      <button
        class="tab"
        class:active={activeTab === tab.id}
        onclick={() => (activeTab = tab.id)}
      >
        {tab.label}
      </button>
    {/each}
  </nav>

  <div class="content">
    {#if !story}
      <div class="empty">No story loaded. Open a project to view the Story Bible.</div>
    {:else if activeTab === 'characters'}
      <section>
        {#each characters as char}
          <article class="card">
            <h2>{char.name}</h2>
            <div class="meta">{char.nature ?? 'Human'} &middot; {char.role ?? 'Unknown role'}</div>
            {#if char.bio}<p class="bio">{char.bio}</p>{/if}
            {#if char.voice}<p class="voice">Voice: {char.voice}</p>{/if}

            {#if char.personality.length > 0}
              <h3>Personality</h3>
              <div class="trait-bars">
                {#each char.personality as trait}
                  <div class="trait">
                    <span class="trait-name">{trait.name}</span>
                    <div class="trait-bar">
                      <div class="trait-fill" style="width: {trait.value * 100}%"></div>
                    </div>
                    <span class="trait-value">{Math.round(trait.value * 100)}%</span>
                  </div>
                {/each}
              </div>
            {/if}

            {#if char.relationships.length > 0}
              <h3>Relationships</h3>
              <ul class="rel-list">
                {#each char.relationships as rel}
                  <li>
                    <strong>{rel.to}</strong>
                    {#if rel.label} — {rel.label}{/if}
                    {#if rel.weight !== undefined}
                      <span class="weight">(weight: {rel.weight})</span>
                    {/if}
                    {#if rel.dynamic}
                      <span class="dynamic">dynamic</span>
                    {/if}
                  </li>
                {/each}
              </ul>
            {/if}

            {#if char.arc}
              <h3>Character Arc</h3>
              {#if char.arc.description}<p>{char.arc.description}</p>{/if}
              {#if char.arc.start}<p><strong>Start:</strong> {char.arc.start}</p>{/if}
              {#if char.arc.end}<p><strong>End:</strong> {char.arc.end}</p>{/if}
            {/if}

            {#if story}
              <div class="appearances">
                Appears in {countSceneAppearances(story, char.name)} scene(s)
              </div>
            {/if}
          </article>
        {/each}
      </section>
    {:else if activeTab === 'worlds'}
      <section>
        {#each worlds as world}
          <article class="card">
            <h2>{world.name}</h2>
            {#if world.period}<div class="meta">{world.period}</div>{/if}

            {#if world.locations.length > 0}
              <h3>Locations</h3>
              {#each world.locations as loc}
                <div class="location">
                  <strong>{loc.name}</strong>
                  {#if loc.description}<p>{loc.description}</p>{/if}
                  {#if loc.connectsTo.length > 0}
                    <p class="connects">Connects to: {loc.connectsTo.join(', ')}</p>
                  {/if}
                </div>
              {/each}
            {/if}

            {#if world.rules.length > 0}
              <h3>Rules</h3>
              <ul>
                {#each world.rules as rule}
                  <li>{rule.rule}{#if rule.category} <span class="meta">({rule.category})</span>{/if}</li>
                {/each}
              </ul>
            {/if}
          </article>
        {/each}
      </section>
    {:else if activeTab === 'relationships'}
      <section>
        {#if characterNames.length < 2}
          <div class="empty">Define at least 2 characters with relationships to view the matrix.</div>
        {:else}
          <div class="matrix-scroll">
            <table class="rel-matrix">
              <thead>
                <tr>
                  <th class="corner"></th>
                  {#each characterNames as name}
                    <th class="col-header"><span>{name}</span></th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each characterNames as fromName}
                  <tr>
                    <td class="row-header">{fromName}</td>
                    {#each characterNames as toName}
                      {@const rel = getRelationshipCell(fromName, toName)}
                      <td
                        class="matrix-cell"
                        class:self={fromName === toName}
                        title={rel ? `${fromName} → ${toName}: ${rel.label} (weight: ${rel.weight})${rel.dynamic ? ' [dynamic]' : ''}` : fromName === toName ? '—' : 'No relationship'}
                      >
                        {#if fromName === toName}
                          <span class="self-marker">—</span>
                        {:else if rel}
                          <span class="weight-badge" style="background: {weightColor(rel.weight)};">
                            {rel.weight}
                          </span>
                        {:else}
                          <span class="no-rel">·</span>
                        {/if}
                      </td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          {#if analytics && analytics.relationshipMatrix.length > 0}
            <h3 style="margin-top: 16px;">Relationship Details</h3>
            <div class="rel-details">
              {#each analytics.relationshipMatrix as rel}
                <div class="rel-detail-row">
                  <span class="rel-from">{rel.from}</span>
                  <span class="rel-arrow">→</span>
                  <span class="rel-to">{rel.to}</span>
                  <span class="weight-badge-sm" style="background: {weightColor(rel.weight)};">{rel.weight}</span>
                  {#if rel.label}<span class="rel-label">{rel.label}</span>{/if}
                  {#if rel.dynamic}<span class="dynamic">dynamic</span>{/if}
                </div>
              {/each}
            </div>
          {/if}
        {/if}
      </section>

    {:else if activeTab === 'themes'}
      <section>
        {#each themes as theme}
          <article class="card">
            <h2>{theme.name}</h2>
            {#if theme.statement}<p class="statement">{theme.statement}</p>{/if}
            {#if theme.counter}<p><strong>Counter:</strong> {theme.counter}</p>{/if}
            {#if theme.tension}<p><strong>Tension:</strong> {theme.tension}</p>{/if}
            {#if theme.motifs.length > 0}
              <h3>Motifs</h3>
              <div class="motifs">{theme.motifs.join(', ')}</div>
            {/if}
          </article>
        {/each}
      </section>
    {:else if activeTab === 'plots'}
      <section>
        {#each plots as plot}
          <article class="card">
            <h2>{plot.name}</h2>
            {#if plot.conflictType}<div class="meta">{plot.conflictType}</div>{/if}
            {#if plot.resolutionPattern}<div class="meta">Resolution: {plot.resolutionPattern}</div>{/if}

            {#if plot.beats.length > 0}
              <h3>Beats</h3>
              <ol class="beat-list">
                {#each plot.beats as beat}
                  <li>
                    <strong>{beat.beat}</strong>
                    {#if beat.type} <span class="meta">[{beat.type}]</span>{/if}
                    {#if beat.act !== undefined} <span class="meta">Act {beat.act}</span>{/if}
                  </li>
                {/each}
              </ol>
            {/if}
          </article>
        {/each}
      </section>
    {:else if activeTab === 'scenes'}
      <section>
        <table class="scene-table">
          <thead>
            <tr>
              <th>Scene</th>
              <th>Type</th>
              <th>Location</th>
              <th>Participants</th>
              <th>Objective</th>
            </tr>
          </thead>
          <tbody>
            {#each scenes as scene}
              <tr>
                <td>{scene.name}</td>
                <td>{scene.sceneType ?? '—'}</td>
                <td>{scene.location ?? '—'}</td>
                <td>{scene.participants.join(', ')}</td>
                <td>{scene.objective ?? '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </section>
    {:else if activeTab === 'interactions'}
      <section>
        {#each interactions as inter}
          <article class="card">
            <h2>{inter.name}</h2>
            <div class="meta">Participants: {inter.participants.join(', ')}</div>
            {#if inter.pattern}<p>Pattern: {inter.pattern}</p>{/if}
            {#if inter.subtext}<p>Subtext: {inter.subtext}</p>{/if}
            {#if inter.powerDynamic}<p>Power dynamic: {inter.powerDynamic}</p>{/if}
          </article>
        {/each}
      </section>
    {:else if activeTab === 'timelines'}
      <section>
        {#each timelines as tl}
          <article class="card">
            <h2>{tl.name}</h2>
            {#if tl.structure}<div class="meta">{tl.structure}</div>{/if}
            {#if tl.span}<p>Span: {tl.span}</p>{/if}
            {#if tl.layers.length > 0}
              <h3>Layers</h3>
              <ul>
                {#each tl.layers as layer}
                  <li>
                    <strong>{layer.name}</strong>
                    {#if layer.period} ({layer.period}){/if}
                    {#if layer.description} — {layer.description}{/if}
                  </li>
                {/each}
              </ul>
            {/if}
          </article>
        {/each}
      </section>
    {/if}
  </div>
</div>

<style>
  .story-bible {
    max-width: 960px;
    margin: 0 auto;
    padding: 24px;
    color: #e2e8f0;
  }

  h1 {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 16px;
  }

  .tab-bar {
    display: flex;
    gap: 2px;
    border-bottom: 1px solid #334155;
    margin-bottom: 20px;
  }

  .tab {
    padding: 8px 16px;
    background: none;
    border: none;
    color: #64748b;
    font-size: 13px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
  }

  .tab:hover { color: #94a3b8; }
  .tab.active { color: #e2e8f0; border-bottom-color: #3b82f6; }

  .empty { text-align: center; color: #475569; padding: 48px; }

  .card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
  }

  .card h2 { font-size: 16px; margin: 0 0 4px; }
  .card h3 { font-size: 13px; margin: 12px 0 6px; color: #94a3b8; }
  .meta { font-size: 12px; color: #64748b; }
  .bio { font-size: 13px; color: #94a3b8; margin-top: 8px; }
  .voice { font-size: 12px; color: #64748b; font-style: italic; }

  .trait-bars { display: flex; flex-direction: column; gap: 4px; }
  .trait { display: flex; align-items: center; gap: 8px; font-size: 12px; }
  .trait-name { width: 100px; color: #94a3b8; }
  .trait-bar { flex: 1; height: 6px; background: #334155; border-radius: 3px; }
  .trait-fill { height: 100%; background: #3b82f6; border-radius: 3px; }
  .trait-value { width: 36px; text-align: right; color: #64748b; font-size: 11px; }

  .rel-list { list-style: none; padding: 0; font-size: 12px; }
  .rel-list li { padding: 2px 0; }
  .weight { color: #64748b; font-size: 11px; }
  .dynamic { color: #f59e0b; font-size: 10px; text-transform: uppercase; }

  .appearances { margin-top: 8px; font-size: 11px; color: #475569; }

  .location { margin-bottom: 8px; font-size: 13px; }
  .connects { font-size: 11px; color: #64748b; }
  .statement { font-size: 14px; font-style: italic; color: #cbd5e1; }
  .motifs { font-size: 12px; color: #94a3b8; }

  .beat-list { font-size: 13px; padding-left: 20px; }
  .beat-list li { margin-bottom: 4px; }

  .scene-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .scene-table th { text-align: left; padding: 8px; border-bottom: 1px solid #334155; color: #94a3b8; font-size: 11px; }
  .scene-table td { padding: 8px; border-bottom: 1px solid #1e293b; }

  /* Relationship Matrix */
  .matrix-scroll { overflow-x: auto; }

  .rel-matrix { border-collapse: collapse; font-size: 11px; }
  .rel-matrix th, .rel-matrix td { padding: 6px; text-align: center; border: 1px solid #1e293b; }
  .corner { background: transparent; border: none !important; }
  .col-header { background: #1e293b; max-width: 60px; }
  .col-header span { display: inline-block; writing-mode: vertical-lr; transform: rotate(180deg); white-space: nowrap; color: #94a3b8; font-weight: 600; }
  .row-header { background: #1e293b; text-align: right; padding-right: 10px; color: #94a3b8; font-weight: 600; white-space: nowrap; }

  .matrix-cell { min-width: 40px; min-height: 32px; background: #0f172a; }
  .matrix-cell.self { background: #1e293b; }
  .self-marker { color: #334155; }
  .no-rel { color: #334155; }

  .weight-badge {
    display: inline-block;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 10px;
    font-weight: 600;
    color: #0f172a;
  }

  .rel-details { display: flex; flex-direction: column; gap: 4px; }
  .rel-detail-row { display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 4px 0; }
  .rel-from, .rel-to { color: #e2e8f0; font-weight: 500; }
  .rel-arrow { color: #475569; }
  .weight-badge-sm { display: inline-block; padding: 0 4px; border-radius: 3px; font-size: 10px; font-weight: 600; color: #0f172a; }
  .rel-label { color: #94a3b8; font-style: italic; }
</style>
