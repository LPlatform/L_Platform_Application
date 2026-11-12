import React, { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { localCompletionSource, pythonLanguage } from '@codemirror/lang-python';
import { LanguageSupport } from '@codemirror/language';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { pythonCompletions } from '../lib/python-completions';

export type CodeLanguage = 'PYTHON' | 'JAVA' | 'CPP';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: CodeLanguage;
  fontSize?: number;
  onSave?: () => void;
  ariaLabel?: string;
}

function languageExtension(language: CodeLanguage) {
  if (language === 'JAVA') return java();
  if (language === 'CPP') return cpp();
  return new LanguageSupport(pythonLanguage, [
    pythonLanguage.data.of({ autocomplete: localCompletionSource }),
    pythonLanguage.data.of({ autocomplete: pythonCompletions }),
  ]);
}

/** CodeMirror 6 editor with VS Code-style suggestions (keywords, builtins, snippets, local names). */
export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  fontSize = 14,
  onSave,
  ariaLabel = 'Code editor',
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langSlot = useRef(new Compartment());
  const themeSlot = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  onChangeRef.current = onChange;
  onSaveRef.current = onSave;

  useEffect(() => {
    if (!hostRef.current) return;
    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          keymap.of([
            indentWithTab,
            {
              key: 'Mod-s',
              preventDefault: true,
              run: () => {
                onSaveRef.current?.();
                return true;
              },
            },
          ]),
          langSlot.current.of(languageExtension(language)),
          themeSlot.current.of(EditorView.theme({ '&': { fontSize: `${fontSize}px` } })),
          EditorView.contentAttributes.of({ 'aria-label': ariaLabel }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: langSlot.current.reconfigure(languageExtension(language)),
    });
  }, [language]);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: themeSlot.current.reconfigure(
        EditorView.theme({ '&': { fontSize: `${fontSize}px` } }),
      ),
    });
  }, [fontSize]);

  useEffect(() => {
    const view = viewRef.current;
    if (view && view.state.doc.toString() !== value) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    }
  }, [value]);

  return <div ref={hostRef} className="code-editor" data-testid="code-editor" />;
};
