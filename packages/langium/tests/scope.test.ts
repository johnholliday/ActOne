import { describe, it, expect } from 'vitest';
import { parseHelper } from 'langium/test';
import { createActOneServices } from '../src/services/actone-module.js';
import type {
  Story,
  SceneParticipantsProp,
  ScenePovProp,
  SceneLocationProp,
  SceneLayerProp,
  RelationshipsProp,
  InteractionParticipantsProp,
  LocConnectsProp,
  PlotSubplotProp,
  SubplotConvergesProp,
} from '../src/generated/ast.js';
import {
  isCharacterDef,
  isSceneDef,
  isInteractionDef,
  isWorldDef,
  isPlotDef,
} from '../src/generated/ast.js';

const services = createActOneServices();
const parse = parseHelper<Story>(services.ActOne);

describe('character reference resolution', () => {
  it('resolves character names in scene participants', async () => {
    const doc = await parse(`
      story "Scope Test" {
        character Alice {
          bio: "A curious adventurer.",
        }
        character Bob {
          bio: "A steadfast companion.",
        }
        scene Meeting {
          participants: [Alice, Bob],
          objective: "Alice and Bob meet.",
        }
      }
    `);

    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const story = doc.parseResult.value;
    const scenes = story.elements.filter(isSceneDef);
    expect(scenes).toHaveLength(1);

    const scene = scenes[0]!;
    const partProp = scene.properties.find(
      (p): p is SceneParticipantsProp => p.$type === 'SceneParticipantsProp',
    );
    expect(partProp).toBeDefined();
    expect(partProp!.participants).toHaveLength(2);

    const [aliceRef, bobRef] = partProp!.participants;
    expect(aliceRef!.ref).toBeDefined();
    expect(aliceRef!.ref?.name).toBe('Alice');
    expect(aliceRef!.$refText).toBe('Alice');

    expect(bobRef!.ref).toBeDefined();
    expect(bobRef!.ref?.name).toBe('Bob');
    expect(bobRef!.$refText).toBe('Bob');
  });

  it('resolves character names in relationships', async () => {
    const doc = await parse(`
      story "Relationship Test" {
        character Mira {
          bio: "A physicist.",
          relationships: [
            {
              to: Kael,
              weight: 72,
              label: "former partner",
            },
          ],
        }
        character Kael {
          bio: "A navigator.",
        }
      }
    `);

    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const story = doc.parseResult.value;
    const chars = story.elements.filter(isCharacterDef);
    const mira = chars.find((c) => c.name === 'Mira')!;
    expect(mira).toBeDefined();

    const relProp = mira.properties.find(
      (p): p is RelationshipsProp => p.$type === 'RelationshipsProp',
    );
    expect(relProp).toBeDefined();
    expect(relProp!.relationships).toHaveLength(1);

    const rel = relProp!.relationships[0]!;
    expect(rel.target.ref).toBeDefined();
    expect(rel.target.ref?.name).toBe('Kael');
    expect(rel.target.$refText).toBe('Kael');
  });

  it('resolves character names in interaction participants', async () => {
    const doc = await parse(`
      story "Interaction Test" {
        character Mira {
          bio: "A physicist.",
        }
        character Kael {
          bio: "A navigator.",
        }
        interaction MiraKaelTalk {
          participants: [Mira, Kael],
          pattern: "greeting -> discussion -> farewell",
        }
      }
    `);

    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const story = doc.parseResult.value;
    const interactions = story.elements.filter(isInteractionDef);
    expect(interactions).toHaveLength(1);

    const interaction = interactions[0]!;
    const partProp = interaction.properties.find(
      (p): p is InteractionParticipantsProp =>
        p.$type === 'InteractionParticipantsProp',
    );
    expect(partProp).toBeDefined();
    expect(partProp!.participants).toHaveLength(2);

    const [miraRef, kaelRef] = partProp!.participants;
    expect(miraRef!.ref).toBeDefined();
    expect(miraRef!.ref?.name).toBe('Mira');

    expect(kaelRef!.ref).toBeDefined();
    expect(kaelRef!.ref?.name).toBe('Kael');
  });

  it('resolves character names in scene pov', async () => {
    const doc = await parse(`
      story "POV Test" {
        character Elena {
          bio: "A painter.",
        }
        scene Awakening {
          pov: Elena,
          participants: [Elena],
          objective: "Elena wakes up.",
        }
      }
    `);

    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const story = doc.parseResult.value;
    const scenes = story.elements.filter(isSceneDef);
    expect(scenes).toHaveLength(1);

    const scene = scenes[0]!;
    const povProp = scene.properties.find(
      (p): p is ScenePovProp => p.$type === 'ScenePovProp',
    );
    expect(povProp).toBeDefined();
    expect(povProp!.character).toBeDefined();
    expect(povProp!.character?.ref).toBeDefined();
    expect(povProp!.character?.ref?.name).toBe('Elena');
  });
});

describe('location reference resolution', () => {
  it('resolves location names in scene location', async () => {
    const doc = await parse(`
      story "Location Test" {
        world TestWorld {
          locations: [
            {
              name: Library,
              description: "A quiet reading room.",
            },
          ],
        }
        character Reader {
          bio: "Loves books.",
        }
        scene Reading {
          location: Library,
          participants: [Reader],
          objective: "Reader explores the library.",
        }
      }
    `);

    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const story = doc.parseResult.value;
    const scenes = story.elements.filter(isSceneDef);
    expect(scenes).toHaveLength(1);

    const scene = scenes[0]!;
    const locProp = scene.properties.find(
      (p): p is SceneLocationProp => p.$type === 'SceneLocationProp',
    );
    expect(locProp).toBeDefined();
    expect(locProp!.location).toBeDefined();
    expect(locProp!.location.location.ref).toBeDefined();
    expect(locProp!.location.location.ref?.name).toBe('Library');
  });

  it('resolves location names in connects_to', async () => {
    const doc = await parse(`
      story "Connectivity Test" {
        world Realm {
          locations: [
            {
              name: Entrance,
              description: "The grand entrance hall.",
              connects_to: [Sanctum],
            },
            {
              name: Sanctum,
              description: "A sacred inner chamber.",
              connects_to: [Entrance],
            },
          ],
        }
      }
    `);

    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const story = doc.parseResult.value;
    const worlds = story.elements.filter(isWorldDef);
    expect(worlds).toHaveLength(1);

    const world = worlds[0]!;
    const locationBlock = world.properties.find(
      (p) => p.$type === 'LocationBlock',
    );
    expect(locationBlock).toBeDefined();

    // Access LocationBlock's locations array
    const locations = (
      locationBlock as { locations: Array<{ name: string; properties: Array<{ $type: string }> }> }
    ).locations;
    expect(locations).toHaveLength(2);

    const entrance = locations.find((loc) => loc.name === 'Entrance')!;
    expect(entrance).toBeDefined();

    const connectsProp = entrance.properties.find(
      (p): p is LocConnectsProp => p.$type === 'LocConnectsProp',
    );
    expect(connectsProp).toBeDefined();
    expect(connectsProp!.connections).toHaveLength(1);

    const sanctumRef = connectsProp!.connections[0]!;
    expect(sanctumRef.location.ref).toBeDefined();
    expect(sanctumRef.location.ref?.name).toBe('Sanctum');

    // Verify the reverse connection too
    const sanctum = locations.find((loc) => loc.name === 'Sanctum')!;
    const sanctumConnects = sanctum.properties.find(
      (p): p is LocConnectsProp => p.$type === 'LocConnectsProp',
    );
    expect(sanctumConnects).toBeDefined();
    expect(sanctumConnects!.connections).toHaveLength(1);

    const entranceRef = sanctumConnects!.connections[0]!;
    expect(entranceRef.location.ref).toBeDefined();
    expect(entranceRef.location.ref?.name).toBe('Entrance');
  });
});

describe('timeline layer reference resolution', () => {
  it('resolves timeline layer names in scenes', async () => {
    const doc = await parse(`
      story "Timeline Test" {
        character Traveler {
          bio: "A time traveler.",
        }
        timeline MainTimeline {
          structure: Nonlinear,
          span: "A decade",
          layers: [
            {
              name: PastLayer,
              description: "Events from the past.",
              period: "1990s",
            },
            {
              name: PresentLayer,
              description: "Current events.",
              period: "2020s",
            },
          ],
        }
        scene MemoryScene {
          type: Reflection,
          layer: PastLayer,
          participants: [Traveler],
          objective: "Traveler remembers the past.",
        }
        scene CurrentDay {
          type: Action,
          layer: PresentLayer,
          participants: [Traveler],
          objective: "Traveler acts in the present.",
        }
      }
    `);

    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const story = doc.parseResult.value;
    const scenes = story.elements.filter(isSceneDef);
    expect(scenes).toHaveLength(2);

    const memoryScene = scenes.find((s) => s.name === 'MemoryScene')!;
    expect(memoryScene).toBeDefined();

    const layerProp = memoryScene.properties.find(
      (p): p is SceneLayerProp => p.$type === 'SceneLayerProp',
    );
    expect(layerProp).toBeDefined();
    expect(layerProp!.layer.ref).toBeDefined();
    expect(layerProp!.layer.ref?.name).toBe('PastLayer');

    const currentDay = scenes.find((s) => s.name === 'CurrentDay')!;
    expect(currentDay).toBeDefined();

    const currentLayerProp = currentDay.properties.find(
      (p): p is SceneLayerProp => p.$type === 'SceneLayerProp',
    );
    expect(currentLayerProp).toBeDefined();
    expect(currentLayerProp!.layer.ref).toBeDefined();
    expect(currentLayerProp!.layer.ref?.name).toBe('PresentLayer');
  });
});

describe('scene reference resolution', () => {
  it('resolves scene names in subplot converges_at', async () => {
    const doc = await parse(`
      story "Subplot Test" {
        character Hero {
          bio: "The main character.",
        }
        scene FinalShowdown {
          type: Climax,
          participants: [Hero],
          objective: "The final confrontation.",
        }
        plot MainPlot {
          conflict_type: Interpersonal,
          beats: [
            {
              beat: "The hero sets out.",
              act: 1,
              type: Inciting,
            },
          ],
          subplot Investigation: {
            description: "Hero uncovers the truth.",
            beats: ["Clue found", "Pattern recognized"],
            converges_at: FinalShowdown,
          },
        }
      }
    `);

    expect(doc.parseResult.parserErrors).toHaveLength(0);

    const story = doc.parseResult.value;
    const plots = story.elements.filter(isPlotDef);
    expect(plots).toHaveLength(1);

    const plot = plots[0]!;
    const subplotProp = plot.properties.find(
      (p): p is PlotSubplotProp => p.$type === 'PlotSubplotProp',
    );
    expect(subplotProp).toBeDefined();
    expect(subplotProp!.name).toBe('Investigation');

    const convergesProp = subplotProp!.properties.find(
      (p): p is SubplotConvergesProp => p.$type === 'SubplotConvergesProp',
    );
    expect(convergesProp).toBeDefined();
    expect(convergesProp!.scene.ref).toBeDefined();
    expect(convergesProp!.scene.ref?.name).toBe('FinalShowdown');
  });
});

describe('unresolved references', () => {
  it('reports errors for undefined character references', async () => {
    const doc = await parse(`
      story "Bad Ref Test" {
        character Alice {
          bio: "Exists.",
        }
        scene Broken {
          participants: [Alice, NonExistentChar],
          objective: "This should have a linker error.",
        }
      }
    `);

    // The document may parse without parser errors, but should have linking errors
    // Check that the unresolved reference is flagged
    const story = doc.parseResult.value;
    const scenes = story.elements.filter(isSceneDef);
    const scene = scenes[0]!;
    const partProp = scene.properties.find(
      (p): p is SceneParticipantsProp => p.$type === 'SceneParticipantsProp',
    );
    expect(partProp).toBeDefined();
    expect(partProp!.participants).toHaveLength(2);

    // Alice should resolve fine
    const aliceRef = partProp!.participants[0]!;
    expect(aliceRef.ref).toBeDefined();
    expect(aliceRef.ref?.name).toBe('Alice');

    // NonExistentChar should NOT resolve
    const badRef = partProp!.participants[1]!;
    expect(badRef.ref).toBeUndefined();
    expect(badRef.error).toBeDefined();
    expect(badRef.$refText).toBe('NonExistentChar');
  });

  it('reports errors for undefined location references', async () => {
    const doc = await parse(`
      story "Bad Location Test" {
        world TestWorld {
          locations: [
            {
              name: RealPlace,
              description: "This location exists.",
            },
          ],
        }
        character Wanderer {
          bio: "A lost soul.",
        }
        scene Lost {
          location: FakePlace,
          participants: [Wanderer],
          objective: "Wanderer is in a nonexistent place.",
        }
      }
    `);

    const story = doc.parseResult.value;
    const scenes = story.elements.filter(isSceneDef);
    const scene = scenes[0]!;
    const locProp = scene.properties.find(
      (p): p is SceneLocationProp => p.$type === 'SceneLocationProp',
    );
    expect(locProp).toBeDefined();

    // FakePlace should NOT resolve
    const locationRef = locProp!.location;
    expect(locationRef.location.ref).toBeUndefined();
    expect(locationRef.location.error).toBeDefined();
    expect(locationRef.location.$refText).toBe('FakePlace');
  });
});
