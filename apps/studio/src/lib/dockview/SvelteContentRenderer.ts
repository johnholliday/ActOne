/**
 * Bridge between dockview-core and Svelte 5 components.
 *
 * Implements IContentRenderer to mount/unmount Svelte components
 * inside dockview panel containers using Svelte 5's mount()/unmount().
 */
import { mount, unmount, type Component } from 'svelte';
import { writable, type Writable } from 'svelte/store';
import type {
  IContentRenderer,
  GroupPanelPartInitParameters,
  PanelUpdateEvent,
  Parameters,
} from 'dockview-core';

export class SvelteContentRenderer implements IContentRenderer {
  readonly element: HTMLElement;
  private instance: Record<string, unknown> | null = null;
  private readonly panelParams: Writable<Parameters>;
  private readonly component: Component;

  constructor(component: Component) {
    this.element = document.createElement('div');
    this.element.style.width = '100%';
    this.element.style.height = '100%';
    this.element.style.overflow = 'hidden';
    this.component = component;
    this.panelParams = writable({});
  }

  init(parameters: GroupPanelPartInitParameters): void {
    this.panelParams.set(parameters.params ?? {});

    this.instance = mount(this.component, {
      target: this.element,
      props: {
        api: parameters.api,
        containerApi: parameters.containerApi,
        title: parameters.title,
        panelParams: this.panelParams,
      },
    });
  }

  update(event: PanelUpdateEvent<Parameters>): void {
    if (event.params) {
      this.panelParams.set(event.params);
    }
  }

  dispose(): void {
    if (this.instance) {
      unmount(this.instance);
      this.instance = null;
    }
  }
}
