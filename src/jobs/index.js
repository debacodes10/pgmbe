import { scheduleStagnationJob } from './stagnation.job.js';

export function startJobs() {
  scheduleStagnationJob();
}
