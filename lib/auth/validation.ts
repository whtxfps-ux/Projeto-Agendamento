export type SignupField = "name" | "email" | "password";

export type SignupFieldErrors = Partial<Record<SignupField, string>>;

export type SignupValues = {
  name: string;
  email: string;
  password: string;
};

export type SignupValidation =
  | { valid: true; values: SignupValues }
  | { valid: false; fieldErrors: SignupFieldErrors };

const supabaseAllowedSymbols = "!@#$%^&*()_+-=[]{};':\"|<>?,./`~\\";

export function validateEmail(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return "Informe um e-mail válido.";
  }

  const email = value.trim();
  const [localPart, domain, ...extraParts] = email.split("@");

  if (
    email.length > 254 ||
    !localPart ||
    !domain ||
    extraParts.length > 0 ||
    localPart.length > 64 ||
    !/^[^\s@]+$/u.test(localPart) ||
    !/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/u.test(
      domain,
    )
  ) {
    return "Informe um e-mail válido.";
  }
}

export function validateProfessionalName(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return "Informe seu nome completo.";
  }

  const name = value.normalize("NFC").trim().replace(/\s+/gu, " ");
  const words = name.match(/\p{L}{2,}/gu) ?? [];

  if (
    name.length < 5 ||
    name.length > 100 ||
    !/^\p{L}+(?:[ '\u2019-]\p{L}+)*$/u.test(name) ||
    words.length < 2
  ) {
    return "Informe seu nome e sobrenome usando apenas letras, espaços, apóstrofos ou hífens.";
  }
}

export function validateSignupPassword(
  value: unknown,
): string | undefined {
  if (typeof value !== "string" || Array.from(value).length < 8) {
    return "A senha deve ter pelo menos 8 caracteres.";
  }

  if (new TextEncoder().encode(value).length > 72) {
    return "A senha deve ter no máximo 72 bytes.";
  }

  if (!/\p{Lu}/u.test(value)) {
    return "Inclua pelo menos uma letra maiúscula.";
  }

  if (!/\p{Ll}/u.test(value)) {
    return "Inclua pelo menos uma letra minúscula.";
  }

  if (!/\p{N}/u.test(value)) {
    return "Inclua pelo menos um número.";
  }

  if (!Array.from(value).some((character) => supabaseAllowedSymbols.includes(character))) {
    return "Inclua pelo menos um caractere especial.";
  }
}

export function validateSignup(input: unknown): SignupValidation {
  const values = typeof input === "object" && input !== null ? input : {};
  const nameValue = "name" in values ? values.name : undefined;
  const emailValue = "email" in values ? values.email : undefined;
  const passwordValue = "password" in values ? values.password : undefined;
  const name =
    typeof nameValue === "string"
      ? nameValue.normalize("NFC").trim().replace(/\s+/gu, " ")
      : "";
  const email =
    typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  const fieldErrors: SignupFieldErrors = {
    name: validateProfessionalName(name),
    email: validateEmail(email),
    password: validateSignupPassword(password),
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return { valid: false, fieldErrors };
  }

  return {
    valid: true,
    values: { name, email, password },
  };
}
