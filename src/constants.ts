export const INTERNAL_STATUSES = [
    "assigned",
    "reopened",
    "WIP-Pending analysis",
    "WIP-Blocked",
    "Pending Resolution Today",
] as const;

export type internalStatus = (typeof INTERNAL_STATUSES)[number];