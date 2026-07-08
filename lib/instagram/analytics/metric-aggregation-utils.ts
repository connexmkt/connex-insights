export function sumLatestSnapshotValues(
  snapshots: Array<{ entityId: string; value: number | null }>,
): number | null {
  const latestByEntity = new Map<string, number>();

  for (const snapshot of snapshots) {
    if (latestByEntity.has(snapshot.entityId)) {
      continue;
    }
    if (snapshot.value === null || snapshot.value === undefined) {
      continue;
    }
    latestByEntity.set(snapshot.entityId, snapshot.value);
  }

  if (latestByEntity.size === 0) {
    return null;
  }

  return [...latestByEntity.values()].reduce((total, value) => total + value, 0);
}
