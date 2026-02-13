import cron from 'node-cron';
import { firestore } from '../config/firebase.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { PROJECT_STATUS } from '../constants/project-status.js';
import { ACTIVITY_ACTION } from '../constants/activity.js';
import { logActivity } from '../services/activity-log.service.js';

function isOlderThanThreshold(lastCommitAt, thresholdDate) {
  if (!lastCommitAt) {
    return false;
  }

  const date = typeof lastCommitAt?.toDate === 'function' ? lastCommitAt.toDate() : new Date(lastCommitAt);
  return date.getTime() < thresholdDate.getTime();
}

export async function runStagnationScan() {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - env.STAGNATION_DAYS_THRESHOLD);

  logger.info(
    {
      thresholdDays: env.STAGNATION_DAYS_THRESHOLD,
      thresholdDate: thresholdDate.toISOString()
    },
    'Running stagnation scan'
  );

  try {
    const snapshot = await firestore.collectionGroup('projects').where('status', '==', PROJECT_STATUS.ACTIVE).get();
    let stagnantCount = 0;

    for (const projectDoc of snapshot.docs) {
      try {
        const project = projectDoc.data();

        if (!isOlderThanThreshold(project.lastCommitAt, thresholdDate)) {
          continue;
        }

        const userDoc = projectDoc.ref.parent.parent;
        if (!userDoc) {
          continue;
        }

        const userId = userDoc.id;
        const now = new Date();

        await projectDoc.ref.update({
          status: PROJECT_STATUS.STAGNANT,
          forcedDecisionAt: now,
          updatedAt: now
        });

        await logActivity(userId, {
          action: ACTIVITY_ACTION.PROJECT_MARKED_STAGNANT,
          projectId: project.id,
          message: `Project marked stagnant after ${env.STAGNATION_DAYS_THRESHOLD} days without commits`
        });

        stagnantCount += 1;
      } catch (error) {
        logger.error({ error, projectId: projectDoc.id }, 'Failed to process project during stagnation scan');
      }
    }

    logger.info(
      {
        scannedProjects: snapshot.size,
        markedStagnant: stagnantCount
      },
      'Stagnation scan completed'
    );
  } catch (error) {
    // The job must never crash the process.
    logger.error({ error }, 'Stagnation scan failed');
  }
}

export function scheduleStagnationJob() {
  const task = cron.schedule(
    env.STAGNATION_CRON,
    async () => {
      await runStagnationScan();
    },
    {
      timezone: 'UTC'
    }
  );

  logger.info({ cron: env.STAGNATION_CRON }, 'Scheduled stagnation job');
  return task;
}
