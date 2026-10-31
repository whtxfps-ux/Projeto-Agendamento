import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="dashboard-page dashboard-loading" aria-live="polite">
          Preparando sua agenda...
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const metadataName = data.user.user_metadata.full_name;
  const name =
    (typeof metadataName === "string" ? metadataName.trim() : "") ||
    data.user.email?.split("@")[0] ||
    "profissional";

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link className="brand" href="/" aria-label="Agenda, início">
          <span className="brand-mark" aria-hidden="true">
            a
          </span>
          <span>agenda</span>
        </Link>
        <form action={signOut}>
          <button className="sign-out-button" type="submit">
            Sair da conta
          </button>
        </form>
      </header>

      <section className="dashboard-content">
        <span className="eyebrow">
          <span className="eyebrow-dot" />
          SUA JORNADA COMEÇA AQUI
        </span>
        <h1>
          Oi, {name}
          <span className="greeting-period">.</span>
        </h1>
        <p>
          Sua conta está pronta. O próximo passo é montar o perfil do seu
          negócio para seus clientes começarem a agendar.
        </p>

        <div className="setup-card">
          <span className="setup-number">01</span>
          <div>
            <h2>Vamos preparar seu espaço?</h2>
            <p>
              Em breve você poderá cadastrar seu negócio, adicionar serviços e
              configurar seus horários.
            </p>
          </div>
          <span className="setup-status">PRÓXIMA ETAPA</span>
        </div>

        <div className="account-card">
          <span className="account-avatar" aria-hidden="true">
            {name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <span className="account-label">SUA CONTA</span>
            <p>{data.user.email}</p>
          </div>
          <span className="account-check" aria-label="Conta conectada">
            ✓
          </span>
        </div>
      </section>
    </main>
  );
}
