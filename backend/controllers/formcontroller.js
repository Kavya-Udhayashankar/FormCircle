const db = require('../config/db');
const redis = require('../config/redis');
const { v4: uuidv4 } = require('uuid');

// Helper to convert ISO string to MySQL DATETIME format (always store as UTC)
function toMySQLDatetime(isoString) {
  if (!isoString) return null;
  // If already in 'YYYY-MM-DDTHH:mm:ss' format, just replace 'T' with ' '
  if (isoString.length === 19 && isoString[10] === 'T') {
    return isoString.replace('T', ' ');
  }
  // Otherwise, fallback to previous logic
  const date = new Date(isoString);
  return date.getUTCFullYear() + '-' +
    String(date.getUTCMonth() + 1).padStart(2, '0') + '-' +
    String(date.getUTCDate()).padStart(2, '0') + ' ' +
    String(date.getUTCHours()).padStart(2, '0') + ':' +
    String(date.getUTCMinutes()).padStart(2, '0') + ':' +
    String(date.getUTCSeconds()).padStart(2, '0');
}

const createForm = async (req, res) => {
  const { form_name, fields, open_time, close_time } = req.body;
  const created_by = req.user.id;
  const form_code = uuidv4();

  try {
    const [result] = await db.query(
      'INSERT INTO forms (form_name, form_code, created_by, open_time, close_time) VALUES (?, ?, ?, ?, ?)',
      [form_name, form_code, created_by, toMySQLDatetime(open_time) || null, toMySQLDatetime(close_time) || null]
    );
    const form_id = result.insertId;

    for (let field of fields) {
      const { field_name, label, type, options, validations } = field;
      await db.query(
        'INSERT INTO fields (form_id, field_name, label, type, options, validations) VALUES (?, ?, ?, ?, ?, ?)',
        [form_id, field_name, label, type, options ? JSON.stringify(options) : null, validations ? JSON.stringify(validations) : null]
      );
    }

    res.status(201).json({ message: 'Form created', form_code });
  } catch (err) {
    res.status(500).json({ message: 'Form creation error', error: err });
  }
};

const getForm = async (req, res) => {
  const { code } = req.params;
  console.log("🔍 Getting form with code:", code);

  try {
    const [forms] = await db.query('SELECT * FROM forms WHERE form_code = ?', [code]);
    console.log("🔍 Form result:", forms);

    if (forms.length === 0) return res.status(404).json({ message: 'Form not found' });

    const form = forms[0];

    const [fields] = await db.query('SELECT * FROM fields WHERE form_id = ?', [form.id]);
    console.log("📋 Fields result:", fields);

    res.json({
      form_name: form.form_name,
      form_code: form.form_code,
      is_active: form.is_active,
      open_time: form.open_time,
      close_time: form.close_time,
      fields: fields.map(f => ({
        field_name: f.field_name,
        label: f.label,
        type: f.type,
        options: (() => {
          try {
            if (!f.options) return null;
            if (typeof f.options === 'object') return f.options;
            if (typeof f.options === 'string') return JSON.parse(f.options);
            return null;
          } catch (e) {
            console.warn(`⚠️ Invalid JSON in field "${f.label}":`, f.options);
            return null;
          }
        })(),
        validations: (() => {
          try {
            if (!f.validations) return {};
            if (typeof f.validations === 'object') return f.validations;
            if (typeof f.validations === 'string') return JSON.parse(f.validations);
            return {};
          } catch (e) {
            return {};
          }
        })()
      }))
    });
  } catch (err) {
    console.error("❌ Error in getForm:", err); // Add this to see the full error
    res.status(500).json({ message: 'Failed to get form', error: err });
  }
};
const toggleFormStatus = async (req, res) => {
  const { code } = req.params;

  try {
    const [rows] = await db.query("SELECT is_active FROM forms WHERE form_code = ?", [code]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Form not found" });
    }

    const currentStatus = rows[0].is_active;
    const newStatus = currentStatus === 1 ? 0 : 1;

    await db.query("UPDATE forms SET is_active = ? WHERE form_code = ?", [newStatus, code]);

    res.json({ message: "Form status toggled", newStatus });
  } catch (err) {
    console.error("Error toggling form:", err);
    res.status(500).json({ message: "Failed to toggle form" });
  }
};


const getLiveResponse = async (req, res) => {
  const { code } = req.params;
  const key = `form:${code}:response`;

  try {
    const value = await redis.get(key);
    if (value) {
      return res.json({ source: "redis", response: JSON.parse(value) });
    }

    // fallback to SQL
    const [rows] = await db.query(
      `SELECT response_data FROM responses WHERE form_id = (SELECT id FROM forms WHERE form_code = ?)`,
      [code]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No saved response found.' });
    }

    return res.json({ source: "sql", response: JSON.parse(rows[0].response_data) });

  } catch (err) {
    res.status(500).json({ message: 'Error fetching response', error: err });
  }
};
const getFormHistory = async (req, res) => {
  const { code } = req.params;

  try {
    const [history] = await db.query(
      `SELECT field_name, old_value, new_value, updated_by, timestamp 
       FROM form_history WHERE form_code = ? ORDER BY timestamp DESC`,
      [code]
    );

    res.json({ history });
  } catch (err) {
    console.error("❌ Failed to fetch form history:", err);
    res.status(500).json({ message: "Failed to fetch history" });
  }
};
const saveResponseToDB = async (req, res) => {
  const { code } = req.params;

  try {
    const [forms] = await db.query("SELECT id, is_active FROM forms WHERE form_code = ?", [code]);
    if (forms.length === 0) return res.status(404).json({ message: "Form not found" });
    const form = forms[0];
    console.log("📦 Form status:", form.is_active);
    if (form.is_active !== 1) {
  return res.status(403).json({ message: "Form is closed and cannot accept responses." });
}

    const formId = forms[0].id;

    const redisKey = `form:${code}:response`;
    const redisValue = await redis.get(redisKey);

    if (!redisValue) return res.status(400).json({ message: "No response in Redis" });

    // Check if a response already exists
    const [existing] = await db.query("SELECT * FROM responses WHERE form_id = ?", [formId]);

    if (existing.length > 0) {
      await db.query("UPDATE responses SET response_data = ? WHERE form_id = ?", [redisValue, formId]);
    } else {
      await db.query("INSERT INTO responses (form_id, response_data) VALUES (?, ?)", [formId, redisValue]);
    }

    res.json({ message: "✅ Response saved to DB successfully" });
  } catch (err) {
    console.error("❌ Error saving response to DB:", err);
    res.status(500).json({ message: "Failed to save response", error: err });
  }
};
const getAllFormsForAdmin = async (req, res) => {
  try {
    const [forms] = await db.query(
  `SELECT f.form_name, f.form_code, f.created_at, f.id,
          f.is_active,
          (SELECT COUNT(*) FROM fields WHERE form_id = f.id) as fields_count
   FROM forms f
   WHERE f.created_by = ?`,
  [req.user.id]
);

    res.json(forms); // ✅ Clean array response
  } catch (err) {
    console.error("❌ Failed to fetch admin forms", err);
    res.status(500).json({ message: "Failed to fetch forms" });
  }
};

// Edit form fields (add, update, remove fields, update validations)
const editFormFields = async (req, res) => {
  const { code } = req.params;
  const { fields } = req.body;
  try {
    const [forms] = await db.query('SELECT id FROM forms WHERE form_code = ?', [code]);
    if (forms.length === 0) return res.status(404).json({ message: 'Form not found' });
    const form_id = forms[0].id;
    // Remove all existing fields for this form
    await db.query('DELETE FROM fields WHERE form_id = ?', [form_id]);
    // Add new/updated fields
    for (let field of fields) {
      const { field_name, label, type, options, validations } = field;
      await db.query(
        'INSERT INTO fields (form_id, field_name, label, type, options, validations) VALUES (?, ?, ?, ?, ?, ?)',
        [form_id, field_name, label, type, options ? JSON.stringify(options) : null, validations ? JSON.stringify(validations) : null]
      );
    }
    res.json({ message: 'Form fields updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update form fields', error: err });
  }
};

// Delete form and all related data
const deleteForm = async (req, res) => {
  const { code } = req.params;
  try {
    // Find form id
    const [forms] = await db.query('SELECT id FROM forms WHERE form_code = ?', [code]);
    if (forms.length === 0) return res.status(404).json({ message: 'Form not found' });
    const form_id = forms[0].id;
    // Delete related data (fields, responses, history)
    await db.query('DELETE FROM form_history WHERE form_code = ?', [code]);
    await db.query('DELETE FROM responses WHERE form_id = ?', [form_id]);
    await db.query('DELETE FROM fields WHERE form_id = ?', [form_id]);
    await db.query('DELETE FROM forms WHERE id = ?', [form_id]);
    res.json({ message: 'Form deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete form', error: err });
  }
};

// Update form settings (open/close time, name, etc.)
const updateFormSettings = async (req, res) => {
  const { code } = req.params;
  const { form_name, open_time, close_time } = req.body;
  try {
    const [forms] = await db.query('SELECT id FROM forms WHERE form_code = ?', [code]);
    if (forms.length === 0) return res.status(404).json({ message: 'Form not found' });
    await db.query('UPDATE forms SET form_name = ?, open_time = ?, close_time = ? WHERE form_code = ?', [form_name, toMySQLDatetime(open_time) || null, toMySQLDatetime(close_time) || null, code]);
    res.json({ message: 'Form settings updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update form settings', error: err });
  }
};

// Enforce open/close window in saveResponseToDB
const originalSaveResponseToDB = saveResponseToDB;
const saveResponseToDBWithWindow = async (req, res) => {
  const { code } = req.params;
  try {
    const [forms] = await db.query("SELECT id, is_active, open_time, close_time FROM forms WHERE form_code = ?", [code]);
    if (forms.length === 0) return res.status(404).json({ message: "Form not found" });
    const form = forms[0];
    const now = new Date();
    if (form.open_time && new Date(form.open_time) > now) {
      return res.status(403).json({ message: "Form is not open yet." });
    }
    if (form.close_time && new Date(form.close_time) < now) {
      return res.status(403).json({ message: "Form is closed." });
    }
    // Call original logic
    return await originalSaveResponseToDB(req, res);
  } catch (err) {
    res.status(500).json({ message: "Failed to save response (window check)", error: err });
  }
};

module.exports = {
  createForm,
  getAllFormsForAdmin,
  getForm,
  getFormHistory,
  getLiveResponse,
  saveResponseToDB: saveResponseToDBWithWindow,
  toggleFormStatus,
  editFormFields,
  deleteForm,
  updateFormSettings
};
