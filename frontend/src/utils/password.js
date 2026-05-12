// Strict password policy shared by Signup UI.
// Backend enforces the same rules — keep them in sync.

const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "12345678", "123456789", "1234567890",
  "qwertyuiop", "iloveyou", "letmein123", "welcome123", "admin1234",
  "passw0rd", "p@ssw0rd", "abcd1234", "trustno1", "monkey123",
]);

export const PASSWORD_MIN_LENGTH = 12;

export const passwordRules = (pwd, { username = "", email = "" } = {}) => {
  const lower = pwd.toLowerCase();
  const local = (email || "").split("@")[0].toLowerCase();
  return [
    { id: "len",     label: `At least ${PASSWORD_MIN_LENGTH} characters`, ok: pwd.length >= PASSWORD_MIN_LENGTH },
    { id: "upper",   label: "An uppercase letter (A–Z)",                  ok: /[A-Z]/.test(pwd) },
    { id: "lower",   label: "A lowercase letter (a–z)",                   ok: /[a-z]/.test(pwd) },
    { id: "digit",   label: "A number (0–9)",                              ok: /\d/.test(pwd) },
    { id: "symbol",  label: "A symbol (e.g. ! @ # $ %)",                   ok: /[^A-Za-z0-9]/.test(pwd) },
    { id: "norep",   label: "No 3+ repeated characters in a row",          ok: !/(.)\1\1/.test(pwd) },
    { id: "noseq",   label: "No obvious sequences (1234, abcd, qwerty)",   ok: !hasSequence(lower) },
    { id: "nouser",  label: "Doesn't contain your username or email",      ok: !!pwd && (!username || !lower.includes(username.toLowerCase())) && (!local || !lower.includes(local)) },
    { id: "nocommon",label: "Not a commonly used password",                ok: !!pwd && !COMMON_PASSWORDS.has(lower) },
  ];
};

const SEQS = ["abcdefghijklmnopqrstuvwxyz", "0123456789", "qwertyuiopasdfghjklzxcvbnm"];
function hasSequence(s) {
  if (!s || s.length < 4) return false;
  for (const seq of SEQS) {
    for (let i = 0; i <= seq.length - 4; i++) {
      const part = seq.slice(i, i + 4);
      if (s.includes(part) || s.includes(part.split("").reverse().join(""))) return true;
    }
  }
  return false;
}

export const passwordScore = (rules) => {
  const passed = rules.filter((r) => r.ok).length;
  // 0..4 buckets: very weak → strong
  if (passed <= 3) return 0;
  if (passed <= 5) return 1;
  if (passed <= 7) return 2;
  if (passed === 8) return 3;
  return 4;
};

export const STRENGTH = [
  { label: "Very weak", color: "#dc2626" },
  { label: "Weak",      color: "#f97316" },
  { label: "Fair",      color: "#eab308" },
  { label: "Strong",    color: "#16a34a" },
  { label: "Excellent", color: "#0d9488" },
];

// Generates a strong sample password to show the user (cryptographically random).
export const sampleStrongPassword = () => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*?-_+=";
  const all = upper + lower + digits + symbols;
  const rnd = (n) => {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  };
  const pick = (s) => s[rnd(s.length)];
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  while (chars.length < 14) chars.push(all[rnd(all.length)]);
  // Fisher–Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
};
