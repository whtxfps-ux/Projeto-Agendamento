"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  validateSignup,
  type SignupFieldErrors,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export type SignupActionResult =
  | { success: true; authenticated: boolean; message: string }
  | {
      success: false;
      fieldErrors?: SignupFieldErrors;
      message: string;
    };

export async function signUpProfessional(
  input: unknown,
): Promise<SignupActionResult> {
  const validation = validateSignup(input);

  if (!validation.valid) {
    return {
      success: false,
      fieldErrors: validation.fieldErrors,
      message: "Revise os campos destacados.",
    };
  }

  const origin = (await headers()).get("origin");

  if (!origin) {
    return {
      success: false,
      message: "Não foi possível identificar o endereço do cadastro. Tente novamente.",
    };
  }

  let emailRedirectTo: string;

  try {
    const originUrl = new URL(origin);
    if (originUrl.protocol !== "http:" && originUrl.protocol !== "https:") {
      throw new Error("Unsupported origin protocol.");
    }
    emailRedirectTo = new URL("/auth/callback", originUrl).toString();
  } catch {
    return {
      success: false,
      message: "Não foi possível iniciar o cadastro neste endereço.",
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: validation.values.email,
      password: validation.values.password,
      options: {
        data: { full_name: validation.values.name },
        emailRedirectTo,
      },
    });

    if (error) {
      if (error.code === "over_email_send_rate_limit") {
        return {
          success: false,
          message:
            "O limite de envio de e-mails do Supabase foi atingido. Aguarde a renovação da cota ou configure um SMTP personalizado no painel.",
        };
      }

      if (error.code === "over_request_rate_limit") {
        return {
          success: false,
          message:
            "O limite temporário de tentativas do Supabase foi atingido. Aguarde alguns minutos antes de tentar novamente.",
        };
      }

      if (error.status === 429) {
        return {
          success: false,
          message:
            "O Supabase limitou temporariamente o cadastro. Aguarde um pouco e tente novamente.",
        };
      }

      console.error("Supabase professional signup failed:", {
        code: error.code,
        status: error.status,
      });
      return {
        success: false,
        message: "Não foi possível criar a conta agora. Confira os dados e tente novamente.",
      };
    }

    return {
      success: true,
      authenticated: Boolean(data.session),
      message:
        "Se o e-mail puder ser usado, você receberá as instruções para concluir o cadastro.",
    };
  } catch (error) {
    console.error("Supabase professional signup request failed:", {
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      success: false,
      message: "Não foi possível concluir o cadastro agora. Tente novamente.",
    };
  }
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Não foi possível sair da conta: ${error.message}`);
  }

  redirect("/login");
}
