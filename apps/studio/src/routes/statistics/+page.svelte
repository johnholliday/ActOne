<script lang="ts">
  /**
   * T104: Statistics Dashboard.
   *
   * Overview cards, scene type distribution, character screen time,
   * pacing rhythm, and word count trend.
   */
  import { astStore } from '$lib/stores/ast.svelte.js';
  import { projectStore } from '$lib/stores/project.svelte.js';
  import { extractAnalytics, type StoryAnalytics } from '$lib/project/analytics.js';

  const analytics = $derived<StoryAnalytics | null>(
    astStore.activeAst ? extractAnalytics(astStore.activeAst) : null,
  );

  const maxScreenTime = $derived(
    analytics
      ? Math.max(...analytics.characterScreenTime.map((c) => c.sceneCount), 1)
      : 1,
  );

  interface TimeseriesPoint {
    capturedAt: string;
    wordCount: number;
    sceneCount: number;
    characterCount: number;
  }

  let timeseries = $state<TimeseriesPoint[]>([]);
  let timeseriesLoading = $state(false);

  const maxTrendWord = $derived(
    timeseries.length > 0 ? Math.max(...timeseries.map((p) => p.wordCount), 1) : 1,
  );

  async function loadTimeseries() {
    const projectId = projectStore.project?.id;
    if (!projectId) return;

    timeseriesLoading = true;
    try {
      const res = await fetch(`/api/analytics/timeseries?projectId=${projectId}&limit=30`);
      if (res.ok) {
        const data = await res.json();
        timeseries = (data.snapshots ?? []).reverse();
      }
    } finally {
      timeseriesLoading = false;
    }
  }

  async function captureSnapshot() {
    if (!analytics || !projectStore.project) return;

    const body = {
      projectId: projectStore.project.id,
      wordCount: analytics.wordCount,
      sceneCount: analytics.sceneCount,
      characterCount: analytics.characterCount,
      metrics: {
        sceneTypeDistribution: analytics.sceneTypeDistribution,
        characterScreenTime: Object.fromEntries(
          analytics.characterScreenTime.map((c) => [c.name, c.sceneCount]),
        ),
        pacingRhythm: analytics.pacingRhythm.map((p) => p.sceneType),
      },
    };

    const res = await fetch('/api/analytics/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      await loadTimeseries();
    }
  }

  $effect(() => {
    if (projectStore.project?.id) {
      loadTimeseries();
    }
  });
</script>

<div class="statistics">
  <h1>Statistics</h1>

  {#if !analytics}
    <div class="empty">No story loaded. Open a project to view statistics.</div>
  {:else}
    <!-- Overview Cards -->
    <div class="overview-grid">
      <div class="stat-card">
        <div class="stat-value">{analytics.sceneCount}</div>
        <div class="stat-label">Scenes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{analytics.characterCount}</div>
        <div class="stat-label">Characters</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{analytics.worldCount}</div>
        <div class="stat-label">Worlds</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{analytics.themeCount}</div>
        <div class="stat-label">Themes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{analytics.plotCount}</div>
        <div class="stat-label">Plots</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{analytics.wordCount.toLocaleString()}</div>
        <div class="stat-label">Words</div>
      </div>
    </div>

    <!-- Scene Type Distribution -->
    <section class="chart-section">
      <h2>Scene Type Distribution</h2>
      <div class="bar-chart">
        {#each Object.entries(analytics.sceneTypeDistribution) as [type, count]}
          <div class="bar-row">
            <span class="bar-label">{type}</span>
            <div class="bar-track">
              <div
                class="bar-fill"
                style="width: {(count / analytics.sceneCount) * 100}%; background: {analytics.pacingRhythm.find(p => p.sceneType === type)?.color ?? '#6366f1'};"
              ></div>
            </div>
            <span class="bar-value">{count}</span>
          </div>
        {/each}
      </div>
    </section>

    <!-- Character Screen Time -->
    <section class="chart-section">
      <h2>Character Screen Time</h2>
      <div class="bar-chart">
        {#each analytics.characterScreenTime as char}
          <div class="bar-row">
            <span class="bar-label">{char.name}</span>
            <div class="bar-track">
              <div
                class="bar-fill"
                style="width: {(char.sceneCount / maxScreenTime) * 100}%; background: #3b82f6;"
              ></div>
            </div>
            <span class="bar-value">{char.sceneCount} ({char.percentage.toFixed(0)}%)</span>
          </div>
        {/each}
      </div>
    </section>

    <!-- Pacing Rhythm -->
    <section class="chart-section">
      <h2>Pacing Rhythm</h2>
      <div class="pacing-strip">
        {#each analytics.pacingRhythm as block}
          <div
            class="pacing-block"
            style="background: {block.color};"
            title="{block.sceneName} ({block.sceneType})"
          ></div>
        {/each}
      </div>
      <div class="pacing-legend">
        {#each Object.entries(analytics.sceneTypeDistribution) as [type]}
          <span class="legend-item">
            <span
              class="legend-dot"
              style="background: {analytics.pacingRhythm.find(p => p.sceneType === type)?.color ?? '#6366f1'};"
            ></span>
            {type}
          </span>
        {/each}
      </div>
    </section>

    <!-- Word Count Trend Over Time -->
    <section class="chart-section">
      <div class="trend-header">
        <h2>Word Count Trend</h2>
        <button class="snapshot-btn" onclick={captureSnapshot}>
          Capture Snapshot
        </button>
      </div>

      {#if timeseriesLoading}
        <div class="trend-loading">Loading trend data...</div>
      {:else if timeseries.length === 0}
        <div class="trend-empty">
          No snapshots yet. Click "Capture Snapshot" to start tracking word count over time.
        </div>
      {:else}
        <div class="trend-chart">
          <div class="trend-bars">
            {#each timeseries as point}
              {@const height = maxTrendWord > 0 ? (point.wordCount / maxTrendWord) * 100 : 0}
              <div class="trend-bar-col" title="{new Date(point.capturedAt).toLocaleDateString()}: {point.wordCount} words, {point.sceneCount} scenes, {point.characterCount} characters">
                <div class="trend-bar" style="height: {height}%;"></div>
              </div>
            {/each}
          </div>
          <div class="trend-labels">
            {#if timeseries.length > 0}
              <span class="trend-label">{new Date(timeseries[0]!.capturedAt).toLocaleDateString()}</span>
              <span class="trend-label">{new Date(timeseries[timeseries.length - 1]!.capturedAt).toLocaleDateString()}</span>
            {/if}
          </div>
        </div>
        <div class="trend-stats">
          {#if timeseries.length >= 2}
            {@const first = timeseries[0]!}
            {@const last = timeseries[timeseries.length - 1]!}
            {@const diff = last.wordCount - first.wordCount}
            <span class="trend-stat">
              {diff >= 0 ? '+' : ''}{diff} words since first snapshot
            </span>
          {/if}
        </div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .statistics {
    max-width: 960px;
    margin: 0 auto;
    padding: 24px;
    color: #e2e8f0;
  }

  h1 { font-size: 24px; font-weight: 700; margin: 0 0 20px; }
  h2 { font-size: 16px; font-weight: 600; margin: 0 0 12px; }

  .empty { text-align: center; color: #475569; padding: 48px; }

  .overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
  }

  .stat-value { font-size: 28px; font-weight: 700; color: #f1f5f9; }
  .stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }

  .chart-section {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .bar-chart { display: flex; flex-direction: column; gap: 6px; }

  .bar-row { display: flex; align-items: center; gap: 8px; }
  .bar-label { width: 100px; font-size: 12px; color: #94a3b8; text-align: right; flex-shrink: 0; }
  .bar-track { flex: 1; height: 16px; background: #0f172a; border-radius: 4px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
  .bar-value { width: 80px; font-size: 11px; color: #64748b; }

  .pacing-strip {
    display: flex;
    gap: 2px;
    height: 32px;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .pacing-block {
    flex: 1;
    border-radius: 2px;
    cursor: default;
  }

  .pacing-legend {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    font-size: 11px;
    color: #94a3b8;
  }

  .legend-item { display: flex; align-items: center; gap: 4px; }
  .legend-dot { width: 8px; height: 8px; border-radius: 2px; }

  /* Word Count Trend */
  .trend-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .trend-header h2 { margin: 0; }

  .snapshot-btn {
    padding: 4px 12px;
    font-size: 11px;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .snapshot-btn:hover { background: #2563eb; }

  .trend-loading, .trend-empty { color: #64748b; font-size: 13px; padding: 16px 0; text-align: center; }

  .trend-chart { margin-top: 8px; }

  .trend-bars {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 120px;
    padding: 0 4px;
  }

  .trend-bar-col {
    flex: 1;
    display: flex;
    align-items: flex-end;
    height: 100%;
    cursor: default;
  }

  .trend-bar {
    width: 100%;
    background: #3b82f6;
    border-radius: 2px 2px 0 0;
    min-height: 2px;
    transition: height 0.3s ease;
  }

  .trend-labels {
    display: flex;
    justify-content: space-between;
    padding: 4px 4px 0;
  }

  .trend-label { font-size: 10px; color: #64748b; }

  .trend-stats {
    margin-top: 8px;
    font-size: 12px;
    color: #94a3b8;
  }

  .trend-stat { font-weight: 500; }
</style>
