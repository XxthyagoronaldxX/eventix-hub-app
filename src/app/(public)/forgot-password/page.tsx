import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "@/actions/auth-actions";
import { AuthHeading } from "@/components/auth-heading";
import { FlashNotices } from "@/components/flash-notices";
import { TextFormField } from "@/components/form/text-form-field";
import { Button } from "@/components/ui/button";
import { readFlash } from "@/lib/flash";

export const metadata: Metadata = { title: "Esqueci a senha" };

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  return (
    <>
      <AuthHeading
        title="Esqueceu a senha?"
        description="Informe o seu e-mail e enviaremos um link para criar uma nova senha."
      />
      <FlashNotices flash={readFlash(await searchParams)} />
      <form action={requestPasswordReset} className="grid gap-5">
        <TextFormField label="E-mail" id="email" type="email" name="email" autoComplete="email" required />
        <Button type="submit" size="lg" className="w-full">
          Enviar link
        </Button>
      </form>
      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar para o login
      </Link>
    </>
  );
}
