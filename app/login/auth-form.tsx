"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  validateEmail,
  validateSignup,
  type SignupFieldErrors,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";
import { signUpProfessional } from "@/app/actions/auth";

type AuthMode = "login" | "signup";

export function AuthForm({ initialError }: { initialError: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({});
  const [message, setMessage] = useState(
    initialError
      ? "Não foi possível confirmar seu e-mail. Peça um novo link de confirmação ou tente entrar."
      : "",
  );
  const [isError, setIsError] = useState(initialError);
  const [isLoading, setIsLoading] = useState(false);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setIsPasswordVisible(false);
    setMessage("");
    setIsError(false);
    setFieldErrors({});
  }

  function clearFieldError(field: keyof SignupFieldErrors) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setMessage("");
    setIsError(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    setFieldErrors({});

    if (mode === "signup") {
      const validation = validateSignup({ name, email, password });
      if (!validation.valid) {
        setFieldErrors(validation.fieldErrors);
        setIsError(true);
        setMessage("Revise os campos destacados.");
        return;
      }
    } else {
      const emailError = validateEmail(email);
      if (emailError) {
        setFieldErrors({ email: emailError });
        setIsError(true);
        setMessage("Revise o e-mail informado.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (mode === "signup") {
        const result = await signUpProfessional({
          name,
          email: normalizedEmail,
          password,
        });

        if (!result.success) {
          setFieldErrors(result.fieldErrors ?? {});
          setIsError(true);
          setMessage(result.message);
          return;
        }

        if (result.authenticated) {
          router.replace("/dashboard");
          router.refresh();
          return;
        }

        setMessage(result.message);
        return;
      }

      const supabase = createClient();
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
                <span>Nome completo</span>
                <input
                  autoComplete="name"
                  maxLength={100}
                  name="name"
                  onChange={(event) => {
                    setName(event.target.value);
                    clearFieldError("name");
                  }}
                  placeholder="Ex.: Ana Júlia da Silva"
                  required
                  aria-invalid={Boolean(fieldErrors.name)}
                  value={name}
                />
                {fieldErrors.name && (
                  <span className="field-error">{fieldErrors.name}</span>
                )}
              </label>
            )}

            <label className="field">
              <span>E-mail</span>
              <input
                autoComplete="email"
                name="email"
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearFieldError("email");
                }}
                placeholder="voce@email.com"
                required
                type="email"
                aria-invalid={Boolean(fieldErrors.email)}
                value={email}
              />
              {fieldErrors.email && (
                <span className="field-error">{fieldErrors.email}</span>
              )}
            </label>

            <div className="field">
              <label htmlFor="password">Senha</label>
              <div className="password-input-wrap">
                <input
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  id="password"
                  minLength={mode === "signup" ? 8 : undefined}
                  name="password"
                  onChange={(event) => {
                    setPassword(event.target.value);
                    clearFieldError("password");
                  }}
                  placeholder={
                    mode === "signup"
                      ? "8+ caracteres, maiúscula, minúscula, número e símbolo"
                      : "Sua senha"
                  }
                  required
                  type={isPasswordVisible ? "text" : "password"}
                  maxLength={mode === "signup" ? 72 : undefined}
                  aria-invalid={Boolean(fieldErrors.password)}
                  value={password}
                />
                <button
                  aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={isPasswordVisible}
                  className="password-visibility"
                  onClick={() => setIsPasswordVisible((visible) => !visible)}
                  type="button"
                >
                  {isPasswordVisible ? (
                    <svg
                      aria-hidden="true"
                      fill="none"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 5.2A10.7 10.7 0 0112 5c5.5 0 9 7 9 7a15.7 15.7 0 01-3 3.8M6.2 6.2C3.9 7.7 2 12 2 12s3.5 7 10 7a9.7 9.7 0 004.1-.9"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.7"
                      />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      fill="none"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.7"
                      />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
                    </svg>
                  )}
                </button>
              </div>
              {mode === "signup" && (
                <span className="field-hint">
                  Use 8+ caracteres, com maiúscula, minúscula, número e símbolo.
                </span>
              )}
              {fieldErrors.password && (
                <span className="field-error">{fieldErrors.password}</span>
              )}
            </div>

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
            Usamos seu nome e e-mail para criar e proteger sua conta.
          </p>
        </div>

        <p className="panel-footer">
          Feito para profissionais autônomos.
        </p>
      </section>
    </main>
  );
}
