"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState, useCallback, useRef } from "react";
import { AIToolbar } from "./AIToolbar";

interface ProseMirrorEditorProps {
  content: string;
  onUpdate: (html: string) => void;
  placeholder?: string;
  applicationId?: string;
}

export function ProseMirrorEditor({
  content,
  onUpdate,
  placeholder = "Start writing...",
  applicationId,
}: ProseMirrorEditorProps) {
  const [selectedText, setSelectedText] = useState("");
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none min-h-[400px] focus:outline-none px-4 py-3 text-sm leading-relaxed",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content]);

  const handleSelection = useCallback(() => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    if (from === to) {
      setShowToolbar(false);
      setSelectedText("");
      return;
    }

    const text = editor.state.doc.textBetween(from, to, " ");
    if (text.trim().length < 5) {
      setShowToolbar(false);
      setSelectedText("");
      return;
    }

    // Get selection position for toolbar
    const { view } = editor;
    const coords = view.coordsAtPos(from);
    const endCoords = view.coordsAtPos(to);

    setSelectedText(text);
    setToolbarPosition({
      x: coords.left,
      y: Math.min(coords.top, endCoords.top),
    });
    setShowToolbar(true);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    editor.on("selectionUpdate", handleSelection);
    return () => {
      editor.off("selectionUpdate", handleSelection);
    };
  }, [editor, handleSelection]);

  const handleReplace = useCallback(
    (newText: string) => {
      if (!editor) return;

      const { from, to } = editor.state.selection;
      if (from === to) return;

      // Replace selected text
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContentAt(from, newText)
        .run();

      setShowToolbar(false);
      setSelectedText("");
      onUpdate(editor.getHTML());
    },
    [editor, onUpdate]
  );

  const handleDismiss = useCallback(() => {
    setShowToolbar(false);
    setSelectedText("");
  }, []);

  if (!editor) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-slate-400">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="relative" ref={editorRef}>
      <div className="border border-slate-200 rounded-lg bg-white min-h-[400px]">
        <EditorContent editor={editor} />
      </div>

      {/* AI Toolbar */}
      {showToolbar && applicationId && (
        <AIToolbar
          applicationId={applicationId}
          selectedText={selectedText}
          position={toolbarPosition}
          onReplace={handleReplace}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
}
