export const USERSTATUS = {
  VERIFICATIONPENDING: 1,
  ACTIVE: 2,
  BLOCKED: 3,
  DEACTIVATED: 4,
} as const;

export type UserStatus = (typeof USERSTATUS)[keyof typeof USERSTATUS];
