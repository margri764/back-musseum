import { Router } from 'express';

const router =  Router();

import { requireToken } from '../middlewares/requireToken.js';
import { createFamilyHistory, deleteFamilyHistory, getAllFamilyHistories } from '../controllers/family-history.controller.js';


router.post('/createFamilyHistory',[
    requireToken
], createFamilyHistory);  

router.get('/getAllFamilyHistories', getAllFamilyHistories);

router.delete('/deleteFamilyHistory/:id', [
    requireToken,
], deleteFamilyHistory);


export default router;