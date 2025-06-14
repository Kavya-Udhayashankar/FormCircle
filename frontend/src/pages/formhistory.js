// src/pages/FormHistory.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const FormHistory = () => {
  const { code } = useParams();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://localhost:3000/forms/${code}/history`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });
        const data = await res.json();
        setHistory(data.history || []);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      }
    };

    fetchHistory();
  }, [code]);

  return (
    <div className="fc-form-history">
      <h2>📜 Form History Log</h2>
      {history.length === 0 ? (
        <p>No changes yet.</p>
      ) : (
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Field</th>
              <th>Old Value</th>
              <th>New Value</th>
              <th>Updated By</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, idx) => (
              <tr key={idx}>
                <td>{h.field_name}</td>
                <td>{h.old_value}</td>
                <td>{h.new_value}</td>
                <td>{h.updated_by}</td>
                <td>{new Date(h.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FormHistory;
