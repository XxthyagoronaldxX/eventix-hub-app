import { Building2 } from "lucide-react";
import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PageContainer } from "@/components/page-container";

export const metadata: Metadata = { title: "Sem organização" };

export default function NoOrganizationPage() {
  return (
    <PageContainer>
      <EmptyState
        icon={Building2}
        title="Você ainda não participa de nenhuma organização"
        description="Peça a um admin para enviar um convite para o seu e-mail."
      />
    </PageContainer>
  );
}
