import React, { useState } from "react";
import API from "../api";

const CreateForm = () => {
  const [formName, setFormName] = useState("");
  const [fields, setFields] = useState([]);
  const [formCode, setFormCode] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");

  const handleAddField = () => {
    setFields([
      ...fields,
      { field_name: "", label: "", type: "text", options: "", validations: { required: false, min: "", max: "" } }
    ]);
  };

  const handleFieldChange = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
  };

  const handleFieldValidationChange = (index, key, value) => {
    const updated = [...fields];
    updated[index].validations = { ...updated[index].validations, [key]: value };
    setFields(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const preparedFields = fields.map((f) => ({
        field_name: f.field_name,
        label: f.label,
        type: f.type,
        options:
          f.type === "dropdown"
            ? f.options.split(",").map((o) => o.trim())
            : null,
        validations: f.validations
      }));
      const res = await API.post("/forms", {
        form_name: formName,
        fields: preparedFields,
        open_time: openTime ? openTime + ':00Z' : null,
        close_time: closeTime ? closeTime + ':00Z' : null
      });
      setFormCode(res.data.form_code);
    } catch (err) {
      console.error("Form creation failed:", err);
      alert("Form creation failed");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formCode);
    alert("Copied to clipboard!");
  };

  return (
    <div>
      <h2>Create New Form</h2>
      <input
        type="text"
        placeholder="Form Name"
        value={formName}
        onChange={(e) => setFormName(e.target.value)}
        required
      />
      <button type="button" onClick={handleAddField}>
        ➕ Add Field
      </button>

      {fields.map((f, i) => (
        <div key={i} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
          <input
            placeholder="Field Name"
            value={f.field_name}
            onChange={(e) => handleFieldChange(i, "field_name", e.target.value)}
          />
          <input
            placeholder="Label"
            value={f.label}
            onChange={(e) => handleFieldChange(i, "label", e.target.value)}
          />
          <select
            value={f.type}
            onChange={(e) => handleFieldChange(i, "type", e.target.value)}
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
              value={f.options}
              onChange={(e) => handleFieldChange(i, "options", e.target.value)}
            />
          )}
          <div style={{ marginTop: "5px" }}>
            <label>
              <input
                type="checkbox"
                checked={!!f.validations?.required}
                onChange={e => handleFieldValidationChange(i, "required", e.target.checked)}
              /> Required
            </label>
            <input
              type="text"
              placeholder="Min"
              value={f.validations?.min || ""}
              onChange={e => handleFieldValidationChange(i, "min", e.target.value)}
              style={{ width: 60, marginLeft: 8 }}
            />
            <input
              type="text"
              placeholder="Max"
              value={f.validations?.max || ""}
              onChange={e => handleFieldValidationChange(i, "max", e.target.value)}
              style={{ width: 60, marginLeft: 8 }}
            />
          </div>
        </div>
      ))}

      <div style={{ margin: '10px 0', color: 'red', fontWeight: 'bold' }}>
        Note: All times are in IST (Indian Standard Time).
      </div>
      <input
        type="datetime-local"
        placeholder="Open Time"
        value={openTime}
        onChange={e => setOpenTime(e.target.value)}
      />
      <input
        type="datetime-local"
        placeholder="Close Time"
        value={closeTime}
        onChange={e => setCloseTime(e.target.value)}
      />

      <button onClick={handleSubmit}>📤 Submit Form</button>

      {formCode && (
        <div>
          <p>✅ Form Created! Code: <strong>{formCode}</strong></p>
          <button onClick={handleCopy}>📋 Copy Code</button>
        </div>
      )}
    </div>
  );
};

export default CreateForm;
