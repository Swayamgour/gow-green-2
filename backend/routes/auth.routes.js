const express = require('express');
const router  = express.Router();
const { login, getMe, register, getUsers, toggleUser, seed } = require('../controllers/auth.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.post('/login',              login);
router.post('/seed',               seed);                          // one-time setup
router.get('/me',                  protect, getMe);
router.post('/register',           protect, adminOnly, register);  // admin creates users
router.get('/users',               protect, adminOnly, getUsers);
router.patch('/users/:id/toggle',  protect, adminOnly, toggleUser);

module.exports = router;