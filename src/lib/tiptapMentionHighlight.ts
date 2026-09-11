import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

/**
 * Custom Tiptap Extension to detect '@' mentions in text nodes
 * and automatically apply inline decorations highlighting them with a distinct background color.
 */
export const MentionHighlightExtension = Extension.create({
  name: 'mentionHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('mentionHighlight'),
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            // Matches @Username or @all or @here or @user_tag
            const mentionRegex = /@[a-zA-Z0-9_ -]{1,30}\b/g;

            state.doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                let match;
                while ((match = mentionRegex.exec(node.text)) !== null) {
                  const start = pos + match.index;
                  const end = start + match[0].length;
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'tiptap-mention-tag-highlight',
                    })
                  );
                }
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
