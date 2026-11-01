import type { Metadata } from "next";
import { createOrganization } from "@/actions/platform-actions";
import { FlashNotices } from "@/components/flash-notices";
import { TextFormField } from "@/components/form/text-form-field";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { readFlash } from "@/lib/flash";
import { requireSuperAdmin } from "@/lib/workspace";

export const metadata: Metadata = { title: "Nova organização" };

export default async function NewOrganizationPage({ searchParams }: PageProps<"/platform/organizations/new">) {
  await requireSuperAdmin();
  return (
    <PageContainer>
      <PageHeader
        title="Nova organização"
        breadcrumbs={[{ label: "Organizações", href: "/platform/organizations" }]}
        description="O primeiro admin recebe um convite por e-mail para criar a conta."
      />
      <FlashNotices flash={readFlash(await searchParams)} />
      <Card className="max-w-2xl">
        <form action={createOrganization} className="contents">
          <CardContent className="grid gap-5">
            <TextFormField
              label="Nome"
              id="organization-name"
              name="name"
              placeholder="Paróquia São José"
              required
              maxLength={120}
            />
            <TextFormField
              label="Slug"
              id="organization-slug"
              hint="Identificador único: letras minúsculas, números e hífens."
              name="slug"
              placeholder="paroquia-sao-jose"
              required
              maxLength={60}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              title="Letras minúsculas, números e hífens"
            />
            <TextFormField
              label="E-mail do primeiro admin"
              id="organization-admin-email"
              type="email"
              name="adminEmail"
              placeholder="admin@exemplo.com"
              required
            />
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit">Criar organização</Button>
          </CardFooter>
        </form>
      </Card>
    </PageContainer>
  );
}
