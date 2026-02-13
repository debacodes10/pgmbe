import { Router } from 'express';
import {
  archiveProjectController,
  createProjectController,
  deleteProjectController,
  getProjectController,
  listProjectsController,
  resumeProjectController,
  shipProjectController,
  syncProjectController,
  updateProjectController
} from '../controllers/project.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createProjectSchema,
  projectIdParamSchema,
  updateProjectSchema
} from '../validators/project.validator.js';

const router = Router();

router.post('/', validate(createProjectSchema), createProjectController);
router.get('/', listProjectsController);
router.get('/:id', validate(projectIdParamSchema, 'params'), getProjectController);
router.patch('/:id', validate(projectIdParamSchema, 'params'), validate(updateProjectSchema), updateProjectController);
router.delete('/:id', validate(projectIdParamSchema, 'params'), deleteProjectController);

router.post('/:id/sync', validate(projectIdParamSchema, 'params'), syncProjectController);
router.post('/:id/archive', validate(projectIdParamSchema, 'params'), archiveProjectController);
router.post('/:id/resume', validate(projectIdParamSchema, 'params'), resumeProjectController);
router.post('/:id/ship', validate(projectIdParamSchema, 'params'), shipProjectController);

export default router;
