import express from 'express';
import {
  getEmotionalPatterns,
  generatePrompt,
  getSuggestions,
  getInsights,
  analyzeReflection,
  getCheckins
} from '../controllers/weeklyCheckinController.js';

const router = express.Router();

router.get('/emotional-patterns', getEmotionalPatterns);

router.post('/generate-prompt', generatePrompt);

router.post('/suggestions', getSuggestions);

router.post('/insights', getInsights);

router.post('/analyze-reflection', analyzeReflection);

router.get('/checkins', getCheckins);

export default router;