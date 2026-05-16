import { ChangeEvent } from "react";
import { FileText, Loader2, Paperclip, Trash2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  CostAttachment,
  useDeleteCostAttachment,
  useOpenCostAttachment,
  validateCostAttachmentFile,
} from "@/hooks/useCostAttachments";
import { cn } from "@/lib/utils";

interface CostAttachmentInputProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  existingAttachments?: CostAttachment[];
  disabled?: boolean;
  className?: string;
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function CostAttachmentInput({
  files,
  onFilesChange,
  existingAttachments = [],
  disabled,
  className,
}: CostAttachmentInputProps) {
  const { toast } = useToast();
  const openAttachment = useOpenCostAttachment();
  const deleteAttachment = useDeleteCostAttachment();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const validFiles: File[] = [];

    selectedFiles.forEach((file) => {
      const validationError = validateCostAttachmentFile(file);
      if (validationError) {
        toast({
          variant: "destructive",
          title: `Arquivo recusado: ${file.name}`,
          description: validationError,
        });
        return;
      }
      validFiles.push(file);
    });

    onFilesChange([...files, ...validFiles]);
    event.target.value = "";
  };

  const removePendingFile = (index: number) => {
    onFilesChange(files.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleDeleteAttachment = (attachment: CostAttachment) => {
    deleteAttachment.mutate(attachment, {
      onSuccess: () => {
        toast({ title: "Anexo removido", description: "O comprovante foi removido da saída." });
      },
      onError: (error) => {
        toast({ variant: "destructive", title: "Erro ao remover anexo", description: error.message });
      },
    });
  };

  const handleOpenAttachment = (attachment: CostAttachment) => {
    openAttachment.mutate(attachment, {
      onError: (error) => {
        toast({ variant: "destructive", title: "Erro ao abrir anexo", description: error.message });
      },
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-2">
        <Label>Recibo / Nota fiscal</Label>
        <label className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 py-5 text-center transition-colors hover:bg-muted/40",
          disabled && "pointer-events-none opacity-60"
        )}>
          <UploadCloud className="mb-2 h-6 w-6 text-muted-foreground" />
          <span className="text-sm font-medium">Clique para anexar PDF ou imagem</span>
          <span className="mt-1 text-xs text-muted-foreground">PDF, PNG, JPG, JPEG ou WEBP até 10MB</span>
          <input
            type="file"
            className="sr-only"
            accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
            multiple
            disabled={disabled}
            onChange={handleFileChange}
          />
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2 rounded-lg border border-border bg-card p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Para enviar ao salvar</p>
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{file.name}</span>
                <Badge variant="outline">{formatFileSize(file.size)}</Badge>
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removePendingFile(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {existingAttachments.length > 0 && (
        <div className="space-y-2 rounded-lg border border-border bg-card p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Anexos salvos</p>
          {existingAttachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center justify-between gap-2 text-sm">
              <button
                type="button"
                className="flex min-w-0 items-center gap-2 text-left hover:text-primary"
                onClick={() => handleOpenAttachment(attachment)}
                disabled={openAttachment.isPending}
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{attachment.file_name}</span>
                <Badge variant="secondary">{formatFileSize(attachment.file_size)}</Badge>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                disabled={deleteAttachment.isPending}
                onClick={() => handleDeleteAttachment(attachment)}
              >
                {deleteAttachment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
