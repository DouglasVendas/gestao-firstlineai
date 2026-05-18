const lowercaseParticles = new Set(["da", "das", "de", "do", "dos", "e"]);
const uppercaseTerms = new Set(["mei", "me", "epp", "sa", "s/a", "ei", "ti", "crm"]);
const titleCaseTerms: Record<string, string> = {
  ltda: "Ltda",
  ss: "SS",
};

function formatNameToken(token: string, index: number) {
  const lower = token.toLocaleLowerCase("pt-BR");
  const normalized = lower.replace(/\.$/, "");

  if (index > 0 && lowercaseParticles.has(lower)) return lower;
  if (uppercaseTerms.has(normalized)) return normalized.toLocaleUpperCase("pt-BR");
  if (titleCaseTerms[normalized]) return token.endsWith(".") ? `${titleCaseTerms[normalized]}.` : titleCaseTerms[normalized];
  if (/^[A-Z]{2,3}$/.test(token)) return token;
  if (/^\d+$/.test(token)) return token;

  return lower
    .split("-")
    .map((part) => part.charAt(0).toLocaleUpperCase("pt-BR") + part.slice(1))
    .join("-");
}

export function formatClientName(name: string | null | undefined) {
  if (!name) return "Cliente sem nome";

  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map(formatNameToken)
    .join(" ");
}
