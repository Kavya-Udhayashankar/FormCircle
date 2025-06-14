import React, { useEffect, useState } from "react";
import API from "../api";

const ViewResponses = () => {
  const [forms, setForms] = useState([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await API.get("/forms/admin");
        setForms(res.data);
      } catch (err) {
        console.error("Error fetching forms", err);
      }
    };
    fetchForms();
  }, []);

  const handleSelect = async (e) => {
    const code = e.target.value;
    setSelectedCode(code);
    setLoading(true);
    try {
      const res = await API.get(`/forms/${code}/response`);
      setResponseData(res.data.response || res.data);
    } catch (err) {
      console.error("Error fetching response", err);
      setResponseData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fc-view-responses">
      <h2>📋 View Form Responses</h2>
      <select onChange={handleSelect} value={selectedCode} className="fc-select">
        <option value="">-- Select a Form --</option>
        {forms.map((form) => (
          <option key={form.form_code} value={form.form_code}>
            {form.form_name} ({form.form_code})
          </option>
        ))}
      </select>

      {loading && <p>Loading response...</p>}

      {responseData && (
        <table className="fc-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(responseData).map(([field, value]) => (
              <tr key={field}>
                <td>{field}</td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ViewResponses;
