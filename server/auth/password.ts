import argon2 from "argon2";

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return argon2.verify(passwordHash, password);
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 64 * 1024,
    timeCost: 3,
    parallelism: 1,
  });
}
