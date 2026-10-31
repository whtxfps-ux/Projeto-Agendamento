import assert from "node:assert/strict";
import test from "node:test";
import {
  validateEmail,
  validateProfessionalName,
  validateSignup,
  validateSignupPassword,
} from "./validation.ts";

test("accepts a full name with accents and normalizes whitespace", () => {
  assert.equal(validateProfessionalName("  Ana   Júlia da Silva "), undefined);
  assert.equal(validateSignupPassword("SenhaForte1!"), undefined);

  const result = validateSignup({
    name: "  Ana   Júlia da Silva ",
    email: "  ANA.JULIA@example.com ",
    password: "SenhaForte1!",
  });

  assert.deepEqual(result, {
    valid: true,
    values: {
      name: "Ana Júlia da Silva",
      email: "ana.julia@example.com",
      password: "SenhaForte1!",
    },
  });
});

test("rejects incomplete or nonsensical signup names", () => {
  for (const name of ["", "Ana", "jdjshdajdkajhsjk", "123 João", "Ana _ Silva"]) {
    assert.ok(validateProfessionalName(name));
  }
});

test("requires uppercase, lowercase, a number, eight characters, and a special character", () => {
  for (const password of [
    "Aa!1234",
    "senha123!",
    "SENHA123!",
    "Senha1234",
    "SenhaForte!",
    `${"á".repeat(37)}A1!`,
  ]) {
    assert.ok(validateSignupPassword(password), password);
  }

  assert.equal(validateSignupPassword("Senha123!"), undefined);
  assert.equal(validateSignupPassword("Árvore567!"), undefined);
});

test("normalizes e-mail and rejects malformed addresses", () => {
  assert.equal(validateEmail("user@example.com"), undefined);

  for (const email of ["", "user@", "@example.com", "user@example", "a b@example.com"]) {
    assert.ok(validateEmail(email), email);
  }
});
