import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/async-handler.js';
import {
  archiveProject,
  createProject,
  deleteProject,
  getProjectById,
  listProjects,
  resumeProject,
  shipProjectMvp,
  syncProjectFromGitHub,
  updateProject
} from '../services/project.service.js';
import { logger } from '../config/logger.js';

export const createProjectController = asyncHandler(async (req, res) => {
  const project = await createProject(req.user.uid, req.body);
  logger.info({ userId: req.user.uid, projectId: project.id }, 'Project created');
  return res.status(StatusCodes.CREATED).json({ data: project });
});

export const listProjectsController = asyncHandler(async (req, res) => {
  const projects = await listProjects(req.user.uid);
  return res.status(StatusCodes.OK).json({ data: projects });
});

export const getProjectController = asyncHandler(async (req, res) => {
  const project = await getProjectById(req.user.uid, req.params.id);
  return res.status(StatusCodes.OK).json({ data: project });
});

export const updateProjectController = asyncHandler(async (req, res) => {
  const project = await updateProject(req.user.uid, req.params.id, req.body);
  return res.status(StatusCodes.OK).json({ data: project });
});

export const deleteProjectController = asyncHandler(async (req, res) => {
  await deleteProject(req.user.uid, req.params.id);
  return res.status(StatusCodes.NO_CONTENT).send();
});

export const syncProjectController = asyncHandler(async (req, res) => {
  logger.info({ userId: req.user.uid, projectId: req.params.id }, 'Project sync attempt');
  const project = await syncProjectFromGitHub(req.user.uid, req.params.id);
  return res.status(StatusCodes.OK).json({ data: project });
});

export const archiveProjectController = asyncHandler(async (req, res) => {
  const project = await archiveProject(req.user.uid, req.params.id);
  return res.status(StatusCodes.OK).json({ data: project });
});

export const resumeProjectController = asyncHandler(async (req, res) => {
  const project = await resumeProject(req.user.uid, req.params.id);
  return res.status(StatusCodes.OK).json({ data: project });
});

export const shipProjectController = asyncHandler(async (req, res) => {
  const project = await shipProjectMvp(req.user.uid, req.params.id);
  return res.status(StatusCodes.OK).json({ data: project });
});
