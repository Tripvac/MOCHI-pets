export type Species = "cat" | "rabbit" | "dog" | "hamster" | "pusheen" | "capybara" | "cheems";
export const companionIds: Species[];
export const companions: Record<Species, { name: string; default: string; label: string }>;
