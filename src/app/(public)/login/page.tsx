import type { Metadata } from "next";
import Link from "next/link";
import { login } from "@/actions/auth-actions";
import { AuthHeading } from "@/components/auth-heading";
import { FlashNotices } from "@/components/flash-notices";
import { TextFormField } from "@/components/form/text-form-field";
import { Button } from "@/components/ui/button";
import { readFlash, readSearchParam } from "@/lib/flash";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const query = await searchParams;
  const nextPath = readSearchParam(query, "next") ?? "/dashboard";
  return (
    <>
      <AuthHeading title="Bem-vindo de volta" description="Entre para gerenciar seus eventos e tickets." />
      <FlashNotices flash={readFlash(query)} />
      <form action={login} className="grid gap-5">
        <input type="hidden" name="next" value={nextPath} />
        <TextFormField
          label="E-mail"
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          required
        />
        <TextFormField
          label="Senha"
          id="password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
        <Button type="submit" size="lg" className="w-full">
          Entrar
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/forgot-password" className="font-medium text-primary hover:underline">
          Esqueci a senha
        </Link>
      </p>
    </>
  );
}
