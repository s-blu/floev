// Dev-only overrides — only active when running via `vite dev`.
// Flip USE_FIXED_PLANTS to true to use predetermined plants instead of random ones.

export const USE_FIXED_PLANTS = false;

export const DEV_PHASE_DURATION_MS: Record<number, number> = {
  1: 10_000,  // 10 sec
  2: 15_000,  // 15 sec
  3: 20_000,  // 20 sec
}

export const DEV_STARTING_COINS = 200;
