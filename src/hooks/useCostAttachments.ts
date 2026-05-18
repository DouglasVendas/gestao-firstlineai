import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth/AuthContext";

export const COST_ATTACHMENT_BUCKET = "expense-receipts";
export const MAX_COST_ATTACHMENT_SIZE = 10 * 1024 * 1024;

export type CostType = "fixed" | "variable";

export interface CostAttachment {
  id: string;
  organization_id: string;
  cost_type: CostType;
  fixed_cost_id: string | null;
  fixed_cost_payment_id?: string | null;
  variable_cost_id: string | null;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

export function sanitizeStorageFileName(fileName: string) {
  const normalized = fileName
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "comprovante";
}

export function validateCostAttachmentFile(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return "Formato inválido. Envie PDF, PNG, JPG, JPEG ou WEBP.";
  }

  if (file.size > MAX_COST_ATTACHMENT_SIZE) {
    return "Arquivo muito grande. O limite é 10MB.";
  }

  return null;
}

export function buildCostAttachmentPath({
  organizationId,
  costType,
  costId,
  fileName,
  timestamp = Date.now(),
}: {
  organizationId: string;
  costType: CostType;
  costId: string;
  fileName: string;
  timestamp?: number;
}) {
  return `org/${organizationId}/costs/${costType}/${costId}/${timestamp}-${sanitizeStorageFileName(fileName)}`;
}

export async function resolveActiveOrganizationId(organizationId?: string | null) {
  if (organizationId) return organizationId;

  const { data: fsData } = await supabase
    .from("financial_settings")
    .select("organization_id")
    .limit(1)
    .maybeSingle();

  if (fsData?.organization_id) return fsData.organization_id;

  const { data: clientData } = await supabase
    .from("clients")
    .select("organization_id")
    .limit(1)
    .maybeSingle();

  return clientData?.organization_id || null;
}

async function uploadCostAttachment({
  file,
  costId,
  costType,
  organizationId,
  userId,
  fixedCostPaymentId,
}: {
  file: File;
  costId: string;
  costType: CostType;
  organizationId: string;
  userId?: string | null;
  fixedCostPaymentId?: string | null;
}) {
  const validationError = validateCostAttachmentFile(file);
  if (validationError) throw new Error(validationError);

  const filePath = buildCostAttachmentPath({
    organizationId,
    costType,
    costId,
    fileName: file.name,
  });

  const { error: uploadError } = await supabase.storage
    .from(COST_ATTACHMENT_BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const attachmentPayload = {
    organization_id: organizationId,
    cost_type: costType,
    fixed_cost_id: costType === "fixed" && !fixedCostPaymentId ? costId : null,
    fixed_cost_payment_id: costType === "fixed" && fixedCostPaymentId ? fixedCostPaymentId : null,
    variable_cost_id: costType === "variable" ? costId : null,
    file_path: filePath,
    file_name: file.name,
    mime_type: file.type,
    file_size: file.size,
    uploaded_by: userId || null,
  };

  const { data, error: insertError } = await supabase
    .from("cost_attachments" as any)
    .insert(attachmentPayload)
    .select()
    .single();

  if (insertError) {
    await supabase.storage.from(COST_ATTACHMENT_BUCKET).remove([filePath]);
    throw insertError;
  }

  return data as CostAttachment;
}

export async function uploadCostAttachments({
  files,
  costId,
  costType,
  organizationId,
  userId,
  fixedCostPaymentId,
}: {
  files?: File[];
  costId: string;
  costType: CostType;
  organizationId: string;
  userId?: string | null;
  fixedCostPaymentId?: string | null;
}) {
  if (!files?.length) return [];

  const uploaded: CostAttachment[] = [];
  for (const file of files) {
    uploaded.push(await uploadCostAttachment({ file, costId, costType, organizationId, userId, fixedCostPaymentId }));
  }

  return uploaded;
}

export async function createCostAttachmentSignedUrl(filePath: string) {
  const { data, error } = await supabase.storage
    .from(COST_ATTACHMENT_BUCKET)
    .createSignedUrl(filePath, 60 * 10);

  if (error) throw error;
  return data.signedUrl;
}

export async function deleteCostAttachment(attachment: CostAttachment) {
  const { error: storageError } = await supabase.storage
    .from(COST_ATTACHMENT_BUCKET)
    .remove([attachment.file_path]);

  if (storageError) throw storageError;

  const { error: dbError } = await supabase
    .from("cost_attachments" as any)
    .delete()
    .eq("id", attachment.id);

  if (dbError) throw dbError;
}

export async function deleteCostAttachmentsForCost(costType: CostType, costId: string) {
  const idColumn = costType === "fixed" ? "fixed_cost_id" : "variable_cost_id";
  const { data, error } = await supabase
    .from("cost_attachments" as any)
    .select("*")
    .eq(idColumn, costId);

  if (error) throw error;

  const attachments = (data || []) as CostAttachment[];
  if (attachments.length) {
    const { error: storageError } = await supabase.storage
      .from(COST_ATTACHMENT_BUCKET)
      .remove(attachments.map((attachment) => attachment.file_path));

    if (storageError) throw storageError;
  }
}

export function useOpenCostAttachment() {
  return useMutation({
    mutationFn: async (attachment: CostAttachment) => {
      const url = await createCostAttachmentSignedUrl(attachment.file_path);
      window.open(url, "_blank", "noopener,noreferrer");
    },
  });
}

export function useDeleteCostAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCostAttachment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed_costs"] });
      queryClient.invalidateQueries({ queryKey: ["variable_costs"] });
    },
  });
}

export function useUploadCostAttachments() {
  const queryClient = useQueryClient();
  const { organizationId, user } = useAuth();

  return useMutation({
    mutationFn: async ({
      files,
      costId,
      costType,
    }: {
      files: File[];
      costId: string;
      costType: CostType;
    }) => {
      if (!organizationId) throw new Error("Organização não identificada para anexar comprovante.");

      return uploadCostAttachments({
        files,
        costId,
        costType,
        organizationId,
        userId: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed_costs"] });
      queryClient.invalidateQueries({ queryKey: ["variable_costs"] });
    },
  });
}
