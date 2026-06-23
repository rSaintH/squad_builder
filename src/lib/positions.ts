// Posições disponíveis em PT-BR
export const POSITIONS = [
  "GOL",
  "LD",
  "ZAG",
  "LE",
  "VOL",
  "MC",
  "MEI",
  "MD",
  "ME",
  "PD",
  "PE",
  "ATA",
] as const;

export type Position = (typeof POSITIONS)[number];

export const POSITION_LABELS: Record<Position, string> = {
  GOL: "Goleiro",
  LD: "Lateral Direito",
  ZAG: "Zagueiro",
  LE: "Lateral Esquerdo",
  VOL: "Volante",
  MC: "Meio-Campo",
  MEI: "Meia Atacante",
  MD: "Meia Direita",
  ME: "Meia Esquerda",
  PD: "Ponta Direita",
  PE: "Ponta Esquerda",
  ATA: "Atacante",
};
