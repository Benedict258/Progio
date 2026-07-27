"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

interface ProseMirrorEditorProps {
  content: string;
  onUpdate: (html: string) => void;
  placeholder?: string;
}

export function ProseMirrorEditor({
  content,
  onUpdate,
  placeholder = "Start writing...",
}: ProseMirrorEditorProps) {
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

  if (!editor) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-slate-400">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg bg-white min-h-[400px]">
      <EditorContent editor={editor} />
    </div>
  );
}
