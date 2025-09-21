import express from 'express';
import { getUserEntries } from '../controllers/trendsController.js';

const router = express.Router();

router.get('/', getUserEntries);

export default router;
