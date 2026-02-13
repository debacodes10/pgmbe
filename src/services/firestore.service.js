import { firestore } from '../config/firebase.js';

const usersCollection = firestore.collection('users');

export function getUserProjectsCollection(userId) {
  return usersCollection.doc(userId).collection('projects');
}

export function getUserActivityLogsCollection(userId) {
  return usersCollection.doc(userId).collection('activityLogs');
}

export async function createProjectDoc(userId, payload) {
  const ref = getUserProjectsCollection(userId).doc();
  await ref.set({
    ...payload,
    id: ref.id
  });

  return ref;
}

export async function getProjectDoc(userId, projectId) {
  return getUserProjectsCollection(userId).doc(projectId).get();
}

export async function updateProjectDoc(userId, projectId, payload) {
  await getUserProjectsCollection(userId).doc(projectId).update(payload);
}

export async function deleteProjectDoc(userId, projectId) {
  await getUserProjectsCollection(userId).doc(projectId).delete();
}

export async function listProjectsDocs(userId) {
  return getUserProjectsCollection(userId).orderBy('updatedAt', 'desc').get();
}
