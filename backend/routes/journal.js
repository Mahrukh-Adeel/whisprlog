import express from 'express';
import {
	handleJournalEntry,
	analyzeJournalEntry,
	getUserEntries,
	streamUserEntries,
	deleteJournalEntry
} from '../controllers/journalController.js';
import { getUserTrends } from '../controllers/trendsController.js';

const router = express.Router();

router.post('/analyze', analyzeJournalEntry);

router.get('/stream/:userId', streamUserEntries);

router.get('/:userId', getUserEntries);

router.delete('/:id', deleteJournalEntry);

router.get('/trends/:userId', getUserTrends);

router.post('/', handleJournalEntry);

export default router;