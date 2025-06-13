import { Router } from 'express';
import {check, query} from 'express-validator';

import { requireToken } from '../middlewares/requireToken.js';
import { checkFields } from '../middlewares/check-fields.js';
import { superAdminRole, noWebmasterRole, userRole } from '../middlewares/check-role.js';

router.post('/createUser',[
    requireToken,
    superAdminRole
    // validateUserMiddleware
], createUser);


router.get('/getAllUsers',[
    requireToken,
], getAllUsers);


router.put('/updateUser/:id',[
    requireToken,
    superAdminRole,
], editUserById);


// router.get('/searchUser',[
//     requireToken,
//     query('querySearch').trim().escape().notEmpty() .withMessage('query to search is required'),
//     checkFields 
// ], searchUser);





export default router;
