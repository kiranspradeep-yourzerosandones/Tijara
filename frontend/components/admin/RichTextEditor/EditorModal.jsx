// frontend/components/admin/RichTextEditor/EditorModal.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";

// ============================================================
// TOOLBAR BUTTON
// ============================================================
function TBtn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-all ${
        active
          ? "bg-amber-400 text-gray-900 shadow-sm"
          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
      } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

// ============================================================
// LINK INPUT POPUP
// ============================================================
function LinkInput({ editor, onClose }) {
  const [url, setUrl] = useState(editor?.getAttributes("link").href || "");

  const apply = () => {
    if (url.trim()) {
      editor.chain().focus().setLink({ href: url }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    onClose();
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-b border-gray-200">
      <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-gray-900"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); apply(); }
          if (e.key === "Escape") onClose();
        }}
      />
      <button onClick={apply} className="px-3 py-1.5 bg-amber-400 text-gray-900 rounded-lg text-sm font-medium hover:bg-amber-500">
        Apply
      </button>
      <button onClick={onClose} className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm">
        Cancel
      </button>
    </div>
  );
}

// ============================================================
// EDITOR TOOLBAR
// ============================================================
function EditorToolbar({ editor }) {
  const [showLink, setShowLink] = useState(false);

  if (!editor) return null;

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      {/* Main Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 flex-wrap">

        {/* Undo / Redo */}
        <TBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4" />
          </svg>
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a5 5 0 00-5 5v2M21 10l-4-4m4 4l-4 4" />
          </svg>
        </TBtn>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Heading Dropdown */}
        <select
          value={
            editor.isActive("heading", { level: 2 }) ? "2" :
            editor.isActive("heading", { level: 3 }) ? "3" :
            editor.isActive("heading", { level: 4 }) ? "4" : "0"
          }
          onChange={(e) => {
            const level = parseInt(e.target.value);
            if (level === 0) editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level }).run();
          }}
          className="px-2 py-1.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-700 cursor-pointer hover:border-amber-400 focus:ring-2 focus:ring-amber-400"
        >
          <option value="0">Paragraph</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
        </select>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Text Format */}
        <TBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)">
          <svg className="w-4 h-4 font-bold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M6 4h6a4 4 0 014 4 4 4 0 01-4 4H6V4zm0 8h7a4 4 0 014 4 4 4 0 01-4 4H6v-8z" />
          </svg>
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" />
          </svg>
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (Ctrl+U)">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3" /><line x1="4" y1="21" x2="20" y2="21" />
          </svg>
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" /><path d="M16 6H8a4 4 0 100 8" /><path d="M8 18h8a4 4 0 000-8" />
          </svg>
        </TBtn>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Alignment */}
        <TBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
          </svg>
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
          </svg>
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
          </svg>
        </TBtn>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Lists */}
        <TBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h.01M8 6h12M4 12h.01M8 12h12M4 18h.01M8 18h12" />
          </svg>
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
            <text x="4" y="7" fontSize="6" fill="currentColor" stroke="none">1</text>
            <text x="4" y="13" fontSize="6" fill="currentColor" stroke="none">2</text>
            <text x="4" y="19" fontSize="6" fill="currentColor" stroke="none">3</text>
          </svg>
        </TBtn>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Blocks */}
        <TBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Quote">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code Block">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16,18 22,12 16,6" /><polyline points="8,6 2,12 8,18" />
          </svg>
        </TBtn>
        <TBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
          </svg>
        </TBtn>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Link */}
        <TBtn
          onClick={() => {
            if (editor.isActive("link")) {
              editor.chain().focus().unsetLink().run();
            } else {
              setShowLink(true);
            }
          }}
          active={editor.isActive("link")}
          title={editor.isActive("link") ? "Remove Link" : "Add Link"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </TBtn>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Clear */}
        <TBtn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear Formatting">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h11M9 4v16M18 4l-6 6m6 0l-6-6" />
          </svg>
        </TBtn>
      </div>

      {/* Link Input Bar */}
      {showLink && <LinkInput editor={editor} onClose={() => setShowLink(false)} />}
    </div>
  );
}

// ============================================================
// EDITOR STYLES
// ============================================================
const editorStyles = `
  .product-editor .ProseMirror {
    min-height: 350px;
    padding: 24px;
    outline: none;
    font-size: 15px;
    line-height: 1.8;
    color: #1a1a1a;
  }

  .product-editor .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
  }

  .product-editor .ProseMirror h2 {
    font-size: 1.5em;
    font-weight: 700;
    margin: 1.5em 0 0.5em;
    color: #111;
    border-bottom: 2px solid #f3f4f6;
    padding-bottom: 0.3em;
  }

  .product-editor .ProseMirror h3 {
    font-size: 1.25em;
    font-weight: 600;
    margin: 1.2em 0 0.4em;
    color: #222;
  }

  .product-editor .ProseMirror h4 {
    font-size: 1.1em;
    font-weight: 600;
    margin: 1em 0 0.3em;
    color: #333;
  }

  .product-editor .ProseMirror p {
    margin: 0.6em 0;
  }

  .product-editor .ProseMirror ul {
    list-style-type: disc;
    padding-left: 1.5em;
    margin: 0.5em 0;
  }

  .product-editor .ProseMirror ol {
    list-style-type: decimal;
    padding-left: 1.5em;
    margin: 0.5em 0;
  }

  .product-editor .ProseMirror li {
    margin: 0.2em 0;
  }

  .product-editor .ProseMirror li p {
    margin: 0;
  }

  .product-editor .ProseMirror blockquote {
    border-left: 4px solid #fbbf24;
    padding: 0.5em 1em;
    margin: 1em 0;
    background: #fffbeb;
    border-radius: 0 8px 8px 0;
    color: #92400e;
  }

  .product-editor .ProseMirror pre {
    background: #1e293b;
    color: #e2e8f0;
    padding: 1em;
    border-radius: 8px;
    margin: 1em 0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.9em;
    overflow-x: auto;
  }

  .product-editor .ProseMirror code {
    background: #f1f5f9;
    color: #d97706;
    padding: 0.15em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
    font-family: 'JetBrains Mono', monospace;
  }

  .product-editor .ProseMirror pre code {
    background: none;
    color: inherit;
    padding: 0;
    border-radius: 0;
  }

  .product-editor .ProseMirror hr {
    border: none;
    border-top: 2px solid #e5e7eb;
    margin: 1.5em 0;
  }

  .product-editor .ProseMirror a {
    color: #d97706;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }

  .product-editor .ProseMirror a:hover {
    color: #b45309;
  }

  .product-editor .ProseMirror strong {
    font-weight: 700;
  }

  .product-editor .ProseMirror ::selection {
    background: #fde68a;
  }
`;

// ============================================================
// MAIN EDITOR MODAL COMPONENT
// ============================================================
export default function EditorModal({
  isOpen,
  onClose,
  title = "Edit Content",
  value = "",
  onChange,
  placeholder = "Start writing...",
  maxLength = null,
}) {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { class: "editor-link" },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
        defaultAlignment: "left",
      }),
      Placeholder.configure({ placeholder }),
      Underline,
      CharacterCount.configure(maxLength ? { limit: maxLength } : {}),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
      handleKeyDown: (view, event) => {
        // Tab handling for lists
        if (event.key === "Tab") {
          const { state } = view;
          const { $from } = state.selection;
          const listItem = $from.node(-1);
          if (listItem?.type.name === "listItem") {
            event.preventDefault();
            if (event.shiftKey) {
              editor.chain().focus().liftListItem("listItem").run();
            } else {
              editor.chain().focus().sinkListItem("listItem").run();
            }
            return true;
          }
        }
        return false;
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      const text = ed.state.doc.textContent || "";
      setCharCount(text.length);
      setWordCount(text.trim().split(/\s+/).filter(w => w.length > 0).length);
    },
  });

  // Set initial content when modal opens
  useEffect(() => {
    if (isOpen && editor) {
      editor.commands.setContent(value || "");
      const text = editor.state.doc.textContent || "";
      setCharCount(text.length);
      setWordCount(text.trim().split(/\s+/).filter(w => w.length > 0).length);

      // Focus editor after short delay
      setTimeout(() => editor.commands.focus("end"), 100);
    }
  }, [isOpen, editor]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && e.ctrlKey) handleSave();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSave = () => {
    if (editor) {
      const html = editor.getHTML();
      // Return empty string if editor only has empty paragraph
      onChange(html === "<p></p>" ? "" : html);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: editorStyles }} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <div className="relative w-full max-w-5xl bg-white shadow-2xl flex flex-col max-h-[92vh] rounded-lg overflow-hidden product-editor">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {wordCount} words · {charCount} chars
                  {maxLength && <span className="ml-1">· {maxLength - charCount} remaining</span>}
                  <span className="ml-3 text-gray-400">Ctrl+Enter to save</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Toolbar */}
          <EditorToolbar editor={editor} />

          {/* Editor Area */}
          <div className="flex-1 overflow-y-auto">
            <EditorContent editor={editor} />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono">Ctrl+B</kbd>
                Bold
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono">Ctrl+I</kbd>
                Italic
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono">Ctrl+Z</kbd>
                Undo
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold transition-colors rounded-lg flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}