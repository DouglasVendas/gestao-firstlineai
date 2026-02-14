
import { GREModule } from "@/types/gre";
import { DocumentEditor } from "./DocumentEditor";
import { DiagnosticForm, DiagnosticQuestion } from "./DiagnosticForm";
import { Card } from "@/components/ui/card";
import { Construction, Loader2 } from "lucide-react";
import { useGREDocuments } from "@/hooks/useGREDocuments";

interface ModuleRouterProps {
    module: GREModule;
}

// Mock questions generator - in production this would come from the database
const getQuestionsForModule = (title: string): DiagnosticQuestion[] => {
    return [
        { id: '1', text: `O processo de ${title} está formalmente documentado?`, weight: 3 },
        { id: '2', text: `Existe um responsável claro por ${title}?`, weight: 2 },
        { id: '3', text: `Os indicadores de ${title} são medidos semanalmente?`, weight: 3 },
        { id: '4', text: `A equipe foi treinada ne ${title}?`, weight: 2 },
    ];
};

export function ModuleRouter({ module }: ModuleRouterProps) {

    // 1. Diagnostic View
    if (module.type === 'diagnostic') {
        const questions = getQuestionsForModule(module.title);
        return (
            <div className="animate-fade-in">
                <DiagnosticForm questions={questions} />
            </div>
        );
    }

    // 2. Playbook & Model View (Rich Text) with Persistence
    if (module.type === 'playbook' || module.type === 'model') {
        return <PersistentDocumentEditor module={module} />;
    }

    // 3. Fallback / Placeholder for Metrics & AI
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground animate-fade-in">
            <Construction className="h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Em Construção</h3>
            <p>O módulo de <strong>{module.type}</strong> está sendo desenvolvido pela nossa equipe de IA.</p>
        </div>
    );
}

// Separated component to use hook conditionally
function PersistentDocumentEditor({ module }: { module: GREModule }) {
    const { savedContent, isLoading, save, isSaving } = useGREDocuments(module.id);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Priority: saved content > template > null
    const contentToLoad = savedContent
        ? JSON.stringify(savedContent)
        : module.initial_content
            ? JSON.stringify(module.initial_content)
            : null;

    return (
        <div className="h-full animate-fade-in">
            <DocumentEditor
                initialContent={contentToLoad}
                onSave={(content) => save(content, 'draft')}
                isSaving={isSaving}
            />
        </div>
    );
}
