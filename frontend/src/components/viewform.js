import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";

const ViewForms = () => {
  const [forms, setForms] = useState([]);
  const [selectedFields, setSelectedFields] = useState(null);
  const [activeFormCode, setActiveFormCode] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editFields, setEditFields] = useState([]);
  const [editOpenTime, setEditOpenTime] = useState("");
  const [editCloseTime, setEditCloseTime] = useState("");

  const fetchForms = async () => {
    try {
      const res = await API.get("/forms/admin");
      setForms(res.data || []);
    } catch (err) {
      console.error("Failed to fetch forms:", err);
      alert("Could not load forms");
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleViewFields = async (formCode) => {
    try {
      const res = await API.get(`/forms/${formCode}`);
      setSelectedFields(res.data.fields);
      setActiveFormCode(formCode);
    } catch (err) {
      console.error("Failed to fetch fields:", err);
      alert("Could not load fields");
    }
  };

  const handleToggle = async (formCode) => {
    try {
      const token = localStorage.getItem("token");
      await API.put(`/forms/${formCode}/toggle`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert("Form status toggled!");
      fetchForms();
    } catch (err) {
      alert("Failed to toggle form status");
      console.error(err);
    }
  };

  const handleDelete = async (formCode) => {
    if (!window.confirm("Are you sure you want to delete this form?")) return;
    try {
      await API.delete(`/forms/${formCode}`);
      alert("Form deleted");
      fetchForms();
    } catch (err) {
      alert("Failed to delete form");
      console.error(err);
    }
  };

  const handleEdit = async (formCode) => {
    try {
      const res = await API.get(`/forms/${formCode}`);
      setEditForm({ ...res.data, form_code: formCode });
      setEditFields(res.data.fields.map(f => ({ ...f, validations: f.validations || {} })));
      setEditOpenTime(res.data.open_time ? res.data.open_time.slice(0, 16) : "");
      setEditCloseTime(res.data.close_time ? res.data.close_time.slice(0, 16) : "");
      setEditMode(true);
    } catch (err) {
      alert("Failed to load form for editing");
      console.error(err);
    }
  };

  const handleEditFieldChange = (index, key, value) => {
    const updated = [...editFields];
    updated[index][key] = value;
    setEditFields(updated);
  };
  const handleEditFieldValidationChange = (index, key, value) => {
    const updated = [...editFields];
    updated[index].validations = { ...updated[index].validations, [key]: value };
    setEditFields(updated);
  };
  const handleEditSave = async () => {
    try {
      await API.put(`/forms/${editForm.form_code}/fields`, { fields: editFields });
      await API.put(`/forms/${editForm.form_code}/settings`, {
        form_name: editForm.form_name,
        open_time: editOpenTime ? editOpenTime + ':00Z' : null,
        close_time: editCloseTime ? editCloseTime + ':00Z' : null
      });
      alert("Form updated");
      setEditMode(false);
      fetchForms();
    } catch (err) {
      alert("Failed to update form");
      console.error(err);
    }
  };
  const handleEditCancel = () => {
    setEditMode(false);
    setEditForm(null);
    setEditFields([]);
  };

  return (
    <div>
      <h2>📄 All Created Forms</h2>
      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", marginTop: "10px" }}>
        <thead>
          <tr>
            <th>Form Name</th>
            <th>Form Code</th>
            <th>Fields Count</th>
            <th>Status</th>
            <th>Toggle</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {forms.map((form) => (
            <tr key={form.form_code}>
              <td>{form.form_name}</td>
              <td>{form.form_code}</td>
              <td>{form.fields_count}</td>
              <td>{form.is_active ? "Open" : "Closed"}</td>
              <td>
                <button onClick={() => handleToggle(form.form_code)}>
                  {form.is_active ? "Close" : "Reopen"}
                </button>
              </td>
              <td>{form.created_at ? new Date(form.created_at).toLocaleString() : "N/A"}</td>
              <td>
                <button onClick={() => handleViewFields(form.form_code)} style={{ marginRight: "8px" }}>
                  View Fields
                </button>
                <button onClick={() => handleEdit(form.form_code)} style={{ marginRight: "8px" }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(form.form_code)} style={{ marginRight: "8px", color: "red" }}>
                  Delete
                </button>
                <Link to={`/form/${form.form_code}/history`}>
                  <button style={{ marginRight: "8px" }}>
                    View History
                  </button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedFields && (
        <div style={{ marginTop: "20px" }}>
          <h3>🧾 Fields for Form Code: {activeFormCode}</h3>
          <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Field Name</th>
                <th>Label</th>
                <th>Type</th>
                <th>Options</th>
              </tr>
            </thead>
            <tbody>
              {selectedFields.map((field, idx) => (
                <tr key={idx}>
                  <td>{field.field_name}</td>
                  <td>{field.label}</td>
                  <td>{field.type}</td>
                  <td>{Array.isArray(field.options) ? field.options.join(", ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editMode && (
        <div style={{ background: "#f9f9f9", border: "1px solid #ccc", padding: 20, marginTop: 20 }}>
          <h3>Edit Form: {editForm.form_name}</h3>
          <div style={{ margin: '10px 0', color: 'red', fontWeight: 'bold' }}>
            Note: All times are in IST (Indian Standard Time).
          </div>
          <input
            type="text"
            value={editForm.form_name}
            onChange={e => setEditForm({ ...editForm, form_name: e.target.value })}
            placeholder="Form Name"
          />
          <input
            type="datetime-local"
            value={editOpenTime}
            onChange={e => setEditOpenTime(e.target.value)}
            placeholder="Open Time"
          />
          <input
            type="datetime-local"
            value={editCloseTime}
            onChange={e => setEditCloseTime(e.target.value)}
            placeholder="Close Time"
          />
          {editFields.map((f, i) => (
            <div key={i} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
              <input
                placeholder="Field Name"
                value={f.field_name}
                onChange={e => handleEditFieldChange(i, "field_name", e.target.value)}
              />
              <input
                placeholder="Label"
                value={f.label}
                onChange={e => handleEditFieldChange(i, "label", e.target.value)}
              />
              <select
                value={f.type}
                onChange={e => handleEditFieldChange(i, "type", e.target.value)}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="dropdown">Dropdown</option>
                <option value="date">Date</option>
                <option value="time">Time</option>
              </select>
              {f.type === "dropdown" && (
                <input
                  placeholder="Options (comma-separated)"
                  value={Array.isArray(f.options) ? f.options.join(",") : f.options || ""}
                  onChange={e => handleEditFieldChange(i, "options", e.target.value.split(",").map(o => o.trim()))}
                />
              )}
              <div style={{ marginTop: "5px" }}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!f.validations?.required}
                    onChange={e => handleEditFieldValidationChange(i, "required", e.target.checked)}
                  /> Required
                </label>
                <input
                  type="text"
                  placeholder="Min"
                  value={f.validations?.min || ""}
                  onChange={e => handleEditFieldValidationChange(i, "min", e.target.value)}
                  style={{ width: 60, marginLeft: 8 }}
                />
                <input
                  type="text"
                  placeholder="Max"
                  value={f.validations?.max || ""}
                  onChange={e => handleEditFieldValidationChange(i, "max", e.target.value)}
                  style={{ width: 60, marginLeft: 8 }}
                />
              </div>
            </div>
          ))}
          <button onClick={handleEditSave} style={{ marginRight: 10 }}>Save</button>
          <button onClick={handleEditCancel}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default ViewForms;
