import type { ProfitSnapshot } from "@/lib/profit/types";

export type ProfitSnapshotGroup = {
  key: string;
  latest: ProfitSnapshot;
  snapshots: ProfitSnapshot[];
};

function getSnapshotTime(snapshot: ProfitSnapshot) {
  const time = new Date(snapshot.created_at).getTime();

  return Number.isFinite(time) ? time : 0;
}

export function groupProfitSnapshots(
  snapshots: ProfitSnapshot[],
): ProfitSnapshotGroup[] {
  const groups = new Map<string, ProfitSnapshot[]>();
  const sortedSnapshots = [...snapshots].sort(
    (left, right) => getSnapshotTime(right) - getSnapshotTime(left),
  );

  sortedSnapshots.forEach((snapshot) => {
    const key = `${snapshot.product_id}:${snapshot.marketplace}`;
    const group = groups.get(key) ?? [];

    group.push(snapshot);
    groups.set(key, group);
  });

  return Array.from(groups.entries()).map(([key, group]) => ({
    key,
    latest: group[0],
    snapshots: group,
  }));
}

export function toSnapshotNumber(
  value: number | string | null | undefined,
) {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}
