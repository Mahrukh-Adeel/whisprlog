import express from 'express';
import { getUserGoals, saveUserGoals, addUserGoal, updateGoalProgress, deleteUserGoal, syncGoalsWithEntries } from '../controllers/goalsController.js';

const router = express.Router();

router.get('/', getUserGoals);

router.post('/', saveUserGoals);

router.post('/add', addUserGoal);

router.put('/:goalId/progress', updateGoalProgress);

router.delete('/:goalId', deleteUserGoal);

// Sync goals with journal entries
router.post('/sync', syncGoalsWithEntries);

export default router;