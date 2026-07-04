import { getDb } from "./db";
import { normalizeEmail } from "./customers";
import { getSettingNumber, getSetting } from "./settings";

export type ReferralProgress = {
  successful: number;
  pending: number;
  threshold: number;
  rewardEligible: boolean;
  rewardLabel: string;
};

export function referralThreshold(): number {
  return getSettingNumber("referral_threshold", 5);
}

export function rewardLabel(): string {
  return getSetting("reward_label") ?? "One free exterior wash";
}

// Count only referrals whose booking has completed (never-cancelled).
export function countSuccessfulReferrals(referrerEmail: string): number {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS n FROM referrals
       WHERE referrer_email = ? AND status = 'completed'`
    )
    .get(normalizeEmail(referrerEmail)) as { n: number };
  return row.n;
}

export function countPendingReferrals(referrerEmail: string): number {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS n FROM referrals
       WHERE referrer_email = ? AND status = 'pending'`
    )
    .get(normalizeEmail(referrerEmail)) as { n: number };
  return row.n;
}

export function getReferralProgress(referrerEmail: string): ReferralProgress {
  const successful = countSuccessfulReferrals(referrerEmail);
  const pending = countPendingReferrals(referrerEmail);
  const threshold = referralThreshold();
  return {
    successful,
    pending,
    threshold,
    rewardEligible: successful >= threshold,
    rewardLabel: rewardLabel(),
  };
}

// Customers who have hit the reward threshold — surfaced to the admin as a
// notification so the owner knows who has earned a free wash.
export function getRewardEligibleCustomers(): Array<{
  email: string;
  successful: number;
}> {
  const threshold = referralThreshold();
  const rows = getDb()
    .prepare(
      `SELECT referrer_email AS email, COUNT(*) AS successful
       FROM referrals
       WHERE status = 'completed'
       GROUP BY referrer_email
       HAVING successful >= ?
       ORDER BY successful DESC`
    )
    .all(threshold) as Array<{ email: string; successful: number }>;
  return rows;
}
