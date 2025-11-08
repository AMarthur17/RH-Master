import express from 'express';
import ScheduledReportsController from '../controllers/ScheduledReportsController.js';

const router = express.Router();

router.get('/', (req, res) => ScheduledReportsController.list(req, res));
router.post('/', (req, res) => ScheduledReportsController.create(req, res));
router.delete('/:id', (req, res) => ScheduledReportsController.remove(req, res));
router.post('/:id/run', (req, res) => ScheduledReportsController.runNow(req, res));

export default router;
