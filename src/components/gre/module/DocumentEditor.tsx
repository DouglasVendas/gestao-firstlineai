
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, Quote, Heading1, Heading2, Save } from "lucide-react";
import { useState } from 'react';

interface DocumentEditorProps {
    initialContent?: string | null;
    onSave?: (content: string) => void;
    isReadOnly?: boolean;
    isSaving?: boolean;
}

export function DocumentEditor({ initialContent = "", onSave, isReadOnly = false, isSaving = false }: DocumentEditorProps) {

    const editor = useEditor({
        extensions: [
            StarterKit,
        ],
        content: initialContent ? JSON.parse(initialContent) : '<p>Comece a escrever aqui...</p>',
        editable: !isReadOnly,
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4',
            },
        },
    });

    const handleSave = () => {
        if (!editor || !onSave) return;
        onSave(JSON.stringify(editor.getJSON()));
    };

    if (!editor) {
        return null;
    }

    return (
        <div className="border rounded-md bg-background overflow-hidden relative flex flex-col h-full min-h-[400px]">
            {!isReadOnly && (
                <div className="border-b bg-muted/20 p-2 flex gap-1 flex-wrap sticky top-0 z-10 backdrop-blur">
                    <Button
                        variant={editor.isActive('bold') ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={editor.isActive('italic') ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-border mx-1 self-center" />
                    <Button
                        variant={editor.isActive('heading', { level: 1 }) ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    >
                        <Heading1 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={editor.isActive('heading', { level: 2 }) ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    >
                        <Heading2 className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-border mx-1 self-center" />
                    <Button
                        variant={editor.isActive('bulletList') ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={editor.isActive('orderedList') ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    >
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={editor.isActive('blockquote') ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    >
                        <Quote className="h-4 w-4" />
                    </Button>

                    <div className="flex-1" />
                    {onSave && (
                        <Button size="sm" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? "Salvando..." : <><Save className="h-4 w-4 mr-2" /> Salvar</>}
                        </Button>
                    )}
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
