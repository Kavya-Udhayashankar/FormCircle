const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifytoken');
const checkRole = require('../middleware/checkrole');
const formController = require('../controllers/formcontroller');
const { saveResponseToDB } = require("../controllers/formcontroller");
// 🔐 Protected route to get all forms created by admin
router.get('/admin', verifyToken, checkRole('admin'), formController.getAllFormsForAdmin);

// Create a new form
router.post('/', verifyToken, checkRole('admin'), formController.createForm);

// Get form details by code
router.get('/:code', verifyToken, formController.getForm);

// Get live form response from Redis
router.get('/:code/history', verifyToken, formController.getFormHistory);
router.get('/:code/response', verifyToken, checkRole(['admin', 'user']), formController.getLiveResponse);
router.put('/:code/response', verifyToken, checkRole(['admin', 'user']), formController.saveResponseToDB);
router.put('/:code/toggle', verifyToken, checkRole('admin'), formController.toggleFormStatus);

// Edit form fields
router.put('/:code/fields', verifyToken, checkRole('admin'), formController.editFormFields);

// Delete form
router.delete('/:code', verifyToken, checkRole('admin'), formController.deleteForm);

// Update form settings (open/close time, name)
router.put('/:code/settings', verifyToken, checkRole('admin'), formController.updateFormSettings);

module.exports = router;