// Disciplines we list, and the words that identify them. Matching uses word
// boundaries, because a bare "mma" also matches "filmmaking".

export const DISCIPLINES = [
  ["tai-chi", "Tai chi"],
  ["qigong", "Qigong"],
  ["self-defense", "Self-defense"],
  ["boxing", "Boxing"],
  ["muay-thai", "Muay Thai"],
  ["kickboxing", "Kickboxing"],
  ["karate", "Karate"],
  ["judo", "Judo"],
  ["taekwondo", "Taekwondo"],
  ["kung-fu", "Kung fu"],
  ["brazilian-jiu-jitsu", "Brazilian jiu-jitsu"],
  ["mixed-martial-arts", "Mixed martial arts"],
  ["fencing", "Fencing"],
  ["medieval-combat", "Medieval combat"],
  ["wrestling", "Wrestling"],
  ["capoeira", "Capoeira"],
] as const;

export type DisciplineSlug = (typeof DISCIPLINES)[number][0];

// Order matters: the first match wins, so specific styles come before general ones
// ("kickboxing" before "boxing", "tai chi" before generic "martial").
const RULES: ReadonlyArray<readonly [DisciplineSlug, RegExp]> = [
  ["kickboxing", /\bkick[- ]?boxing\b/i],
  ["muay-thai", /\bmuay[- ]?thai\b/i],
  ["boxing", /\bboxing\b/i],
  ["tai-chi", /\btai[- ]?chi\b/i],
  ["qigong", /\b(qi[- ]?gong|chi[- ]?kung)\b/i],
  ["brazilian-jiu-jitsu", /\b(bjj|brazilian jiu[- ]?jitsu|jiu[- ]?jitsu|jujutsu|ju-jitsu)\b/i],
  ["judo", /\bjudo\b/i],
  ["karate", /\bkarate\b/i],
  ["taekwondo", /\b(taekwondo|tae kwon do)\b/i],
  ["kung-fu", /\b(kung[- ]?fu|wushu|wing chun)\b/i],
  ["mixed-martial-arts", /\b(mma|mixed martial arts)\b/i],
  ["fencing", /\bfencing\b/i],
  ["medieval-combat", /\b(medieval combat|gladiator|armored (combat|practice)|hema|longsword)\b/i],
  ["wrestling", /\bwrestling\b/i],
  ["capoeira", /\bcapoeira\b/i],
  ["self-defense", /\b(self[- ]?defen[cs]e|krav maga)\b/i],
];

export function classifyDiscipline(text: string): DisciplineSlug | null {
  for (const [slug, pattern] of RULES) if (pattern.test(text)) return slug;
  return null;
}
