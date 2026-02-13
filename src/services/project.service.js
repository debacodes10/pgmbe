import { StatusCodes } from 'http-status-codes';
import { PROJECT_STATUS, ALLOWED_STATUS_TRANSITIONS } from '../constants/project-status.js';
import { ACTIVITY_ACTION } from '../constants/activity.js';
import {
  createProjectDoc,
  deleteProjectDoc,
  getProjectDoc,
  listProjectsDocs,
  updateProjectDoc
} from './firestore.service.js';
import { ApiError } from '../utils/api-error.js';
import { toIsoString } from '../utils/timestamp.js';
import { fetchLatestGitHubCommit } from './github.service.js';
import { logActivity } from './activity-log.service.js';

function serializeProjectDoc(doc) {
  const data = doc.data();
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    repoUrl: data.repoUrl,
    repoProvider: data.repoProvider,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
    lastCommitAt: toIsoString(data.lastCommitAt),
    status: data.status,
    forcedDecisionAt: toIsoString(data.forcedDecisionAt)
  };
}

async function requireProject(userId, projectId) {
  const snapshot = await getProjectDoc(userId, projectId);

  if (!snapshot.exists) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found', {
      code: 'PROJECT_NOT_FOUND'
    });
  }

  return snapshot;
}

function assertTransition(currentStatus, targetStatus) {
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(targetStatus)) {
    throw new ApiError(StatusCodes.CONFLICT, `Cannot transition project from ${currentStatus} to ${targetStatus}`, {
      code: 'INVALID_STATUS_TRANSITION'
    });
  }
}

export async function createProject(userId, payload) {
  const now = new Date();
  const project = {
    name: payload.name,
    description: payload.description ?? '',
    repoUrl: payload.repoUrl,
    repoProvider: 'github',
    createdAt: now,
    updatedAt: now,
    lastCommitAt: null,
    status: PROJECT_STATUS.ACTIVE,
    forcedDecisionAt: null
  };

  const ref = await createProjectDoc(userId, project);
  const snapshot = await ref.get();

  await logActivity(userId, {
    action: ACTIVITY_ACTION.PROJECT_CREATED,
    projectId: ref.id,
    message: `Project created: ${project.name}`
  });

  return serializeProjectDoc(snapshot);
}

export async function listProjects(userId) {
  const snapshot = await listProjectsDocs(userId);
  return snapshot.docs.map((doc) => serializeProjectDoc(doc));
}

export async function getProjectById(userId, projectId) {
  const snapshot = await requireProject(userId, projectId);
  return serializeProjectDoc(snapshot);
}

export async function updateProject(userId, projectId, payload) {
  const snapshot = await requireProject(userId, projectId);
  const current = snapshot.data();

  const updates = {
    updatedAt: new Date()
  };

  if (payload.name !== undefined) {
    updates.name = payload.name;
  }

  if (payload.description !== undefined) {
    updates.description = payload.description;
  }

  if (payload.repoUrl !== undefined) {
    updates.repoUrl = payload.repoUrl;
    updates.lastCommitAt = null;
    updates.forcedDecisionAt = null;
    if (current.status === PROJECT_STATUS.STAGNANT) {
      updates.status = PROJECT_STATUS.ACTIVE;
    }
  }

  await updateProjectDoc(userId, projectId, updates);

  await logActivity(userId, {
    action: ACTIVITY_ACTION.PROJECT_UPDATED,
    projectId,
    message: `Project updated: ${current.name}`
  });

  const updatedSnapshot = await getProjectDoc(userId, projectId);
  return serializeProjectDoc(updatedSnapshot);
}

export async function deleteProject(userId, projectId) {
  const snapshot = await requireProject(userId, projectId);
  const project = snapshot.data();

  await deleteProjectDoc(userId, projectId);

  await logActivity(userId, {
    action: ACTIVITY_ACTION.PROJECT_DELETED,
    projectId,
    message: `Project deleted: ${project.name}`
  });
}

export async function syncProjectFromGitHub(userId, projectId) {
  const snapshot = await requireProject(userId, projectId);
  const project = snapshot.data();

  const latestCommit = await fetchLatestGitHubCommit(project.repoUrl);

  const updates = {
    lastCommitAt: latestCommit.lastCommitAt,
    updatedAt: new Date(),
    forcedDecisionAt: null
  };

  if (project.status === PROJECT_STATUS.STAGNANT) {
    updates.status = PROJECT_STATUS.ACTIVE;
  }

  await updateProjectDoc(userId, projectId, updates);

  await logActivity(userId, {
    action: ACTIVITY_ACTION.PROJECT_SYNCED,
    projectId,
    message: `Synced latest commit ${latestCommit.sha.slice(0, 7)} from GitHub`,
    metadata: {
      owner: latestCommit.owner,
      repo: latestCommit.repo,
      sha: latestCommit.sha,
      commitUrl: latestCommit.htmlUrl
    }
  });

  const updatedSnapshot = await getProjectDoc(userId, projectId);
  return serializeProjectDoc(updatedSnapshot);
}

export async function archiveProject(userId, projectId) {
  const snapshot = await requireProject(userId, projectId);
  const project = snapshot.data();

  if (project.status === PROJECT_STATUS.ARCHIVED) {
    throw new ApiError(StatusCodes.CONFLICT, 'Project is already archived', {
      code: 'ALREADY_ARCHIVED'
    });
  }

  assertTransition(project.status, PROJECT_STATUS.ARCHIVED);

  await updateProjectDoc(userId, projectId, {
    status: PROJECT_STATUS.ARCHIVED,
    updatedAt: new Date()
  });

  await logActivity(userId, {
    action: ACTIVITY_ACTION.PROJECT_ARCHIVED,
    projectId,
    message: `Project archived: ${project.name}`
  });

  const updatedSnapshot = await getProjectDoc(userId, projectId);
  return serializeProjectDoc(updatedSnapshot);
}

export async function resumeProject(userId, projectId) {
  const snapshot = await requireProject(userId, projectId);
  const project = snapshot.data();

  if (project.status !== PROJECT_STATUS.STAGNANT) {
    throw new ApiError(StatusCodes.CONFLICT, 'Only stagnant projects can be resumed', {
      code: 'RESUME_NON_STAGNANT'
    });
  }

  assertTransition(project.status, PROJECT_STATUS.ACTIVE);

  await updateProjectDoc(userId, projectId, {
    status: PROJECT_STATUS.ACTIVE,
    forcedDecisionAt: null,
    updatedAt: new Date()
  });

  await logActivity(userId, {
    action: ACTIVITY_ACTION.PROJECT_RESUMED,
    projectId,
    message: `Project resumed: ${project.name}`
  });

  const updatedSnapshot = await getProjectDoc(userId, projectId);
  return serializeProjectDoc(updatedSnapshot);
}

export async function shipProjectMvp(userId, projectId) {
  const snapshot = await requireProject(userId, projectId);
  const project = snapshot.data();

  assertTransition(project.status, PROJECT_STATUS.MVP_SHIPPED);

  await updateProjectDoc(userId, projectId, {
    status: PROJECT_STATUS.MVP_SHIPPED,
    forcedDecisionAt: null,
    updatedAt: new Date()
  });

  await logActivity(userId, {
    action: ACTIVITY_ACTION.PROJECT_SHIPPED,
    projectId,
    message: `MVP shipped: ${project.name}`
  });

  const updatedSnapshot = await getProjectDoc(userId, projectId);
  return serializeProjectDoc(updatedSnapshot);
}
