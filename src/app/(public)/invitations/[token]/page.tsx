import { MailX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { acceptInvitation } from "@/actions/auth-actions";
import { AuthHeading } from "@/components/auth-heading";
import { EmptyState } from "@/components/empty-state";
import { FlashNotices } from "@/components/flash-notices";
import { TextFormField } from "@/components/form/text-form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest, attempt } from "@/lib/api/api-client";
import type { InvitationPreview } from "@/lib/api/types";
import { readFlash } from "@/lib/flash";
import { ROLE_LABELS } from "@/lib/format";

export const metadata: Metadata = { title: "Aceitar convite" };

export default async function AcceptInvitationPage({ params, searchParams }: PageProps<"/invitations/[token]">) {
  const { token } = await params;
  const invitation = await attempt(() =>
    apiRequest<InvitationPreview>(`/auth/invitations/${token}`, { authenticated: false }),
  );

  if (!invitation.ok) {
    return (
      <EmptyState
        icon={MailX}
        title="Convite indisponível"
        description={invitation.message}
        action={
          <Button variant="outline" asChild>
            <Link href="/login">Ir para o login</Link>
          </Button>
        }
      />
    );
  }

  const { organizationName, email, role, hasAccount } = invitation.value;
  return (
    <>
      <AuthHeading
        title={`Entrar em ${organizationName}`}
        description={
          <>
            Convite para <span className="font-medium text-foreground">{email}</span> como{" "}
            <Badge variant="secondary">{ROLE_LABELS[role]}</Badge>
          </>
        }
      />
      <FlashNotices flash={readFlash(await searchParams)} />
      <form action={acceptInvitation} className="grid gap-5">
        <input type="hidden" name="token" value={token} />
        {!hasAccount && (
          <TextFormField
            label="Seu nome"
            id="name"
            type="text"
            name="name"
            autoComplete="name"
            required
            maxLength={120}
          />
        )}
        <TextFormField
          label={hasAccount ? "Sua senha atual" : "Crie uma senha"}
          id="password"
          hint={hasAccount ? undefined : "Pelo menos 8 caracteres, com letras e números."}
          type="password"
          name="password"
          autoComplete={hasAccount ? "current-password" : "new-password"}
          minLength={hasAccount ? undefined : 8}
          required
        />
        <Button type="submit" size="lg" className="w-full">
          {hasAccount ? "Entrar e aceitar convite" : "Criar conta e aceitar convite"}
        </Button>
      </form>
    </>
  );
}
