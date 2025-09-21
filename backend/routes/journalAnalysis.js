import express from 'express';
import { analyzeJournal } from '../controllers/journalAnalysisController.js';

const router = express.Router();

router.post('/', analyzeJournal);

export default router;