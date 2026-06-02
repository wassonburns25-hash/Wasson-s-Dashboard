// Bodyweight + calorie targets. These are starting estimates — tune to taste.
export const CURRENT_WEIGHT_LB = 230;
export const GOAL_WEIGHT_LB = 210;

// Rough maintenance estimate for an active athlete (~15 cal/lb of bodyweight).
// Without height/age this is an approximation; adjust the multiplier if needed.
const CAL_PER_LB = 15;

/** Estimated daily maintenance calories at current bodyweight. */
export const MAINTENANCE_CALORIES = Math.round(CURRENT_WEIGHT_LB * CAL_PER_LB);

// A ~750 kcal/day deficit ≈ ~1.5 lb/week — on pace to drop ~20 lb over a summer.
export const DAILY_DEFICIT = 750;

/** Suggested daily calorie target while cutting toward the goal weight. */
export const CALORIE_TARGET = MAINTENANCE_CALORIES - DAILY_DEFICIT;
