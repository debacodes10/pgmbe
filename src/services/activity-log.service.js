import { getUserActivityLogsCollection } from './firestore.service.js';

export async function logActivity(userId, activity) {
  const now = new Date();
  await getUserActivityLogsCollection(userId).add({
    ...activity,
    createdAt: now,
    updatedAt: now
  });
}
