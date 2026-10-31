"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

export function AuthForm({ initialError }: { initialError: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(
    initialError
      ? "Não foi possível confirmar seu e-mail. Peça um novo link de confirmação ou tente entrar."
      : "",
  );
  const [isError, setIsError] = useState(initialError);
  const [isLoading, setIsLoading] = useState(false);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
    setIsError(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const normalizedEmail = email.trim().toLowerCase();

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          router.replace("/dashboard");
          router.refresh();
          return;
        }

        setMessage(
          "Conta criada! Confira sua caixa de entrada e confirme seu e-mail para continuar.",
        );
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        throw error;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir a operação. Tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="Sobre o Agenda">
        <Link className="brand" href="/" aria-label="Agenda, início">
          <span className="brand-mark" aria-hidden="true">
            a
          </span>
          <span>agenda</span>
        </Link>

        <div className="story-content">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            SEU TRABALHO, NO SEU TEMPO
          </span>
          <h1>
            Menos mensagens.
            <br />
            Mais tempo
            <br />
            <span>para você.</span>
          </h1>
          <p>
            Seus clientes escolhem o serviço e o melhor horário. Você cuida do
            que faz de melhor.
          </p>

          <div className="story-note">
            <span className="note-icon" aria-hidden="true">
              ✳
            </span>
            <span>
              <strong>Seu atendimento, do seu jeito.</strong>
              <br />
              Uma agenda simples para quem trabalha com as mãos.
            </span>
          </div>
        </div>

        <span className="story-footer">FEITO PARA QUEM FAZ ACONTECER</span>
        <span className="story-orbit story-orbit-one" aria-hidden="true" />
        <span className="story-orbit story-orbit-two" aria-hidden="true" />
      </section>

      <section className="auth-panel" aria-label="Acesso à sua conta">
        <div className="auth-mobile-brand brand" aria-hidden="true">
          <span className="brand-mark">a</span>
          <span>agenda</span>
        </div>

        <div className="auth-card">
          <span className="form-kicker">
            {mode === "signup" ? "UM BOM COMEÇO" : "QUE BOM TER VOCÊ DE VOLTA"}
          </span>
          <h2>{mode === "signup" ? "Sua agenda começa aqui." : "Vamos continuar?"}</h2>
          <p className="form-description">
            {mode === "signup"
              ? "Crie sua conta e organize seus atendimentos em um só lugar."
              : "Entre na sua conta para cuidar dos seus atendimentos."}
          </p>

          <div className="auth-tabs" role="tablist" aria-label="Acesso">
            <button
              className={mode === "signup" ? "auth-tab active" : "auth-tab"}
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              onClick={() => changeMode("signup")}
            >
              Criar conta
            </button>
            <button
              className={mode === "login" ? "auth-tab active" : "auth-tab"}
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => changeMode("login")}
            >
              Entrar
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <label className="field">
                <span>Seu nome</span>
                <input
                  autoComplete="name"
                  name="name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Como podemos te chamar?"
                  required
                  value={name}
                />
              </label>
            )}

            <label className="field">
              <span>E-mail</span>
              <input
                autoComplete="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@email.com"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="field">
              <span>Senha</span>
              <input
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                minLength={8}
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Pelo menos 8 caracteres"
                required
                type="password"
                value={password}
              />
            </label>

            {message && (
              <p
                className={isError ? "form-message error" : "form-message success"}
                role="status"
              >
                {message}
              </p>
            )}

            <button className="submit-button" disabled={isLoading} type="submit">
              {isLoading
                ? "Só um instante..."
                : mode === "signup"
                  ? "Criar minha conta"
                  : "Entrar na minha conta"}
              {!isLoading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <p className="privacy-note">
            Seus dados ficam protegidos e só você acessa sua conta.
          </p>
        </div>

        <p className="panel-footer">
          Feito para profissionais autônomos.
        </p>
      </section>
    </main>
  );
}
