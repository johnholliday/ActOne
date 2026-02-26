/**
 * T074: Text edit generator.
 *
 * Produces .actone source edits from diagram operations
 * (create/delete/rename elements).
 */

import type { TextEdit } from '$lib/ast/text-edit.js';
import type { ElementType } from './stable-refs.js';

export type DiagramOperation =
  | { kind: 'create'; elementType: ElementType; name: string; properties?: Record<string, string> }
  | { kind: 'delete'; elementType: ElementType; name: string; sourceRange?: { start: number; end: number } }
  | { kind: 'rename'; elementType: ElementType; oldName: string; newName: string }
  | { kind: 'move'; elementType: ElementType; name: string; newParent?: string }
  | { kind: 'connect'; sourceType: ElementType; sourceName: string; targetType: ElementType; targetName: string; label?: string }
  | { kind: 'disconnect'; sourceType: ElementType; sourceName: string; targetType: ElementType; targetName: string };

/**
 * Generate ActOne source text for creating a new element.
 */
function generateCreateBlock(op: Extract<DiagramOperation, { kind: 'create' }>): string {
  const props = op.properties ?? {};

  switch (op.elementType) {
    case 'character':
      return [
        `Character "${op.name}" {`,
        props['nature'] ? `  nature: ${props['nature']}` : '  nature: Human',
        props['bio'] ? `  bio: "${props['bio']}"` : '',
        '}',
        '',
      ].filter(Boolean).join('\n');

    case 'scene':
      return [
        `Scene "${op.name}" {`,
        props['sceneType'] ? `  type: ${props['sceneType']}` : '',
        props['location'] ? `  location: ${props['location']}` : '',
        '}',
        '',
      ].filter(Boolean).join('\n');

    case 'world':
      return [
        `World "${op.name}" {`,
        props['period'] ? `  period: "${props['period']}"` : '',
        '}',
        '',
      ].filter(Boolean).join('\n');

    case 'location':
      return [
        `  Location "${op.name}" {`,
        props['description'] ? `    description: "${props['description']}"` : '',
        '  }',
      ].join('\n');

    case 'plot':
      return [
        `Plot "${op.name}" {`,
        '}',
        '',
      ].join('\n');

    case 'interaction':
      return [
        `Interaction "${op.name}" {`,
        props['participants'] ? `  participants: [${props['participants']}]` : '',
        '}',
        '',
      ].filter(Boolean).join('\n');

    case 'timeline':
      return [
        `Timeline "${op.name}" {`,
        '}',
        '',
      ].join('\n');

    case 'theme':
      return [
        `Theme "${op.name}" {`,
        props['statement'] ? `  statement: "${props['statement']}"` : '',
        '}',
        '',
      ].filter(Boolean).join('\n');

    default:
      return `// TODO: Create ${op.elementType} "${op.name}"\n`;
  }
}

/**
 * Generate TextEdits from a diagram operation.
 *
 * @param operation - The diagram operation to convert
 * @param sourceText - The current source text (needed for insert position and renames)
 * @returns Array of TextEdits to apply to the source
 */
export function generateTextEdits(
  operation: DiagramOperation,
  sourceText: string,
): TextEdit[] {
  switch (operation.kind) {
    case 'create': {
      const block = generateCreateBlock(operation);
      // Append to end of file
      return [{
        offset: sourceText.length,
        length: 0,
        newText: `\n${block}`,
      }];
    }

    case 'delete': {
      if (operation.sourceRange) {
        return [{
          offset: operation.sourceRange.start,
          length: operation.sourceRange.end - operation.sourceRange.start,
          newText: '',
        }];
      }
      // Without a source range, find the element by pattern matching
      const pattern = new RegExp(
        `\\n?\\s*${capitalize(operation.elementType)}\\s+"${escapeRegex(operation.name)}"\\s*\\{[^}]*\\}\\n?`,
        's',
      );
      const match = pattern.exec(sourceText);
      if (match) {
        return [{
          offset: match.index,
          length: match[0].length,
          newText: '',
        }];
      }
      return [];
    }

    case 'rename': {
      const edits: TextEdit[] = [];
      // Find all occurrences of the old name in quoted strings
      const quotedPattern = new RegExp(`"${escapeRegex(operation.oldName)}"`, 'g');
      let match: RegExpExecArray | null;
      while ((match = quotedPattern.exec(sourceText)) !== null) {
        edits.push({
          offset: match.index,
          length: match[0].length,
          newText: `"${operation.newName}"`,
        });
      }

      // Find unquoted references (e.g., in participant lists, location refs)
      const refPattern = new RegExp(`\\b${escapeRegex(operation.oldName)}\\b`, 'g');
      while ((match = refPattern.exec(sourceText)) !== null) {
        // Skip if this is inside a quoted string (already handled above)
        const before = sourceText.substring(0, match.index);
        const quoteCount = (before.match(/"/g) ?? []).length;
        if (quoteCount % 2 === 0) {
          edits.push({
            offset: match.index,
            length: match[0].length,
            newText: operation.newName,
          });
        }
      }
      return edits;
    }

    case 'connect': {
      // Add a relationship/reference from source to target
      if (operation.sourceType === 'character' && operation.targetType === 'character') {
        // Find the source character block and add a relationship
        const pattern = new RegExp(
          `(${capitalize(operation.sourceType)}\\s+"${escapeRegex(operation.sourceName)}"\\s*\\{)`,
        );
        const match = pattern.exec(sourceText);
        if (match) {
          const insertOffset = match.index + match[0].length;
          const relText = operation.label
            ? `\n  relationship: "${operation.targetName}" weight: 5 "${operation.label}"`
            : `\n  relationship: "${operation.targetName}" weight: 5`;
          return [{
            offset: insertOffset,
            length: 0,
            newText: relText,
          }];
        }
      }
      return [];
    }

    case 'disconnect': {
      // Remove a relationship line
      const pattern = new RegExp(
        `\\n\\s*relationship:\\s*"${escapeRegex(operation.targetName)}"[^\\n]*`,
      );
      const match = pattern.exec(sourceText);
      if (match) {
        return [{
          offset: match.index,
          length: match[0].length,
          newText: '',
        }];
      }
      return [];
    }

    case 'move': {
      // Move operations are complex (reposition element in AST)
      // For now, return empty — would need full AST range information
      return [];
    }
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
