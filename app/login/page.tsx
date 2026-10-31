import { Suspense } from "react";
import { AuthForm } from "./auth-form";

export default function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  return (
    <Suspense
      fallback={
        <main className="auth-page auth-loading" aria-live="polite">
          Preparando seu acesso...
        </main>
      }
    >
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginContent({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const { error } = await searchParams;
  return <AuthForm initialError={error === "confirmation"} />;
}
