import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { resetPassword } from "@/actions/auth-actions";
import { AuthHeading } from "@/components/auth-heading";
import { FlashNotices } from "@/components/flash-notices";
import { TextFormField } from "@/components/form/text-form-field";
import { Button } from "@/components/ui/button";
import { readFlash, readSearchParam } from "@/lib/flash";

export const metadata: Metadata = { title: "Redefinir senha" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const query = await searchParams;
  const token = readSearchParam(query, "token");
  return (
    <>
      <AuthHeading title="Criar nova senha" description="Use pelo menos 8 caracteres, com letras e números." />
      <FlashNotices flash={readFlash(query)} />
      {token ? (
        <form action={resetPassword} className="grid gap-5">
          <input type="hidden" name="token" value={token} />
          <TextFormField
            label="Nova senha"
            id="password"
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <TextFormField
            label="Confirme a nova senha"
            id="passwordConfirmation"
            type="password"
            name="passwordConfirmation"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <Button type="submit" size="lg" className="w-full">
            Salvar nova senha
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">Este link está incompleto. Peça um novo link de redefinição.</p>
      )}
      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar para o login
      </Link>
    </>
  );
}
