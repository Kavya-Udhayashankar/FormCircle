import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";  // ✅ Use a proper decoder
import io from "socket.io-client";
import { format, toZonedTime } from 'date-fns-tz';

const socket = io("http://localhost:3000");

// Helper to parse UTC date from backend (handles both 'YYYY-MM-DD HH:mm:ss' and ISO)
function parseUTCDate(str) {
  if (!str) return null;
  if (str.includes('T')) return new Date(str);
  return new Date(str.replace(' ', 'T') + 'Z');
}

const JoinForm = () => {
  const { code: formCode } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
let userId = null;

try {
  if (token) {
    const decoded = jwtDecode(token);  // ✅ Use named import correctly
    userId = decoded.id;              // Assuming `id` is present in your JWT
  }
} catch (err) {
  console.error("❌ Failed to decode token", err);
}

  const [formName, setFormName] = useState("");
  const [fields, setFields] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [openTime, setOpenTime] = useState(null);
  const [closeTime, setCloseTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [editingAllowed, setEditingAllowed] = useState(true);
  const [consensusPrompt, setConsensusPrompt] = useState(false);
  const [consensusTimeout, setConsensusTimeout] = useState(30);
  const [consensusAnswer, setConsensusAnswer] = useState(null);
  const [consensusReason, setConsensusReason] = useState("");
  const [consensusResult, setConsensusResult] = useState(null);
  const consensusTimerRef = React.useRef();
  const [typingIndicators, setTypingIndicators] = useState({});
  const [history, setHistory] = useState([]);

  // 🟢 Fetch form metadata
  useEffect(() => {
    const fetchForm = async () => {
      if (!token) {
        console.error("No token found");
        setFormName("❌ Unauthorized access");
        return;
      }

      try {
        const res = await fetch(`http://localhost:3000/forms/${formCode}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Form fetch failed");

        if (!data.is_active) {
          setFormName("❌ This form is currently closed.");
          setFields([]);
          return;
        }

        setFormName(data.form_name || "Form");
        setFields(Array.isArray(data.fields) ? data.fields : []);
        setOpenTime(data.open_time ? parseUTCDate(data.open_time) : null);
        setCloseTime(data.close_time ? parseUTCDate(data.close_time) : null);
        socket.emit("joinForm", { formCode, userId });
      } catch (err) {
        console.error("❌ Error fetching form:", err.message);
        setFormName("❌ Error loading form.");
        setFields([]);
      }
    };

    fetchForm();
  }, [formCode, token]);

  // Robustly join form on mount and on socket reconnect
  useEffect(() => {
    if (formCode && userId) {
      socket.emit("joinForm", { formCode, userId });
    }
    const handleReconnect = () => {
      if (formCode && userId) {
        socket.emit("joinForm", { formCode, userId });
      }
    };
    socket.on("connect", handleReconnect);
    return () => {
      socket.off("connect", handleReconnect);
    };
  }, [formCode, userId]);

  // 🟢 Socket event handlers
  useEffect(() => {
    socket.on("formState", setFieldValues);
    socket.on("formUpdate", ({ fieldName, value }) => {
      setFieldValues(prev => ({ ...prev, [fieldName]: value }));
    });
    // Typing indicator events
    socket.on("typing", ({ fieldName, userName }) => {
      setTypingIndicators(prev => ({ ...prev, [fieldName]: userName }));
    });
    socket.on("stopTyping", ({ fieldName }) => {
      setTypingIndicators(prev => {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      });
    });
    // Consensus save events
    socket.on("savePrompt", ({ formCode, timeout }) => {
      setConsensusPrompt(true);
      setConsensusTimeout(timeout);
      setConsensusAnswer(null);
      setConsensusReason("");
      setConsensusResult(null);
      if (consensusTimerRef.current) clearInterval(consensusTimerRef.current);
      let t = timeout;
      consensusTimerRef.current = setInterval(() => {
        t -= 1;
        setConsensusTimeout(t);
        if (t <= 0) {
          clearInterval(consensusTimerRef.current);
          if (consensusAnswer === null) handleConsensusSubmit("yes");
        }
      }, 1000);
    });
    socket.on("saveConsensusResult", (result) => {
      setConsensusPrompt(false);
      setConsensusResult(result);
      if (consensusTimerRef.current) clearInterval(consensusTimerRef.current);
      setTimeout(() => setConsensusResult(null), 8000);
    });
    return () => {
      socket.off("formState");
      socket.off("formUpdate");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("savePrompt");
      socket.off("saveConsensusResult");
      if (consensusTimerRef.current) clearInterval(consensusTimerRef.current);
    };
  }, [consensusAnswer]);

  // 🟢 Field change + history trigger
  const handleChange = (fieldName, value) => {
    setFieldValues(prev => ({ ...prev, [fieldName]: value }));
    console.log("Emitting editField with:", { formCode, fieldName, value, userId });
    socket.emit("editField", { formCode, fieldName, value, userId });
  };

  // 🟢 Save response to backend (consensus-based)
  const handleSave = () => {
    socket.emit("saveRequest", { formCode, userId });
  };
  const handleConsensusSubmit = (answer) => {
    setConsensusAnswer(answer);
    console.log('Emitting saveResponse:', { formCode, userId, answer, reason: answer === "no" ? consensusReason : undefined });
    socket.emit("saveResponse", { formCode, userId, answer, reason: answer === "no" ? consensusReason : undefined });
    setConsensusPrompt(false);
  };

  // Countdown timer logic
  useEffect(() => {
    if (!closeTime) return;
    const updateTimer = () => {
      const now = toZonedTime(new Date(), 'Asia/Kolkata');
      const diff = closeTime - now;
      if (diff > 0) {
        setTimeLeft(Math.floor(diff / 1000));
        setEditingAllowed(true);
      } else {
        setTimeLeft(0);
        setEditingAllowed(false);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [closeTime]);

  // Typing indicator handlers
  const handleFieldFocus = (fieldName) => {
    socket.emit("typing", { formCode, fieldName, userId });
  };
  const handleFieldBlur = (fieldName) => {
    socket.emit("stopTyping", { formCode, fieldName, userId });
  };

  // Fetch recent history for this form
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://localhost:3000/forms/${formCode}/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setHistory(data.history ? data.history.slice(0, 10) : []);
      } catch (err) {
        setHistory([]);
      }
    };
    if (formCode && token) fetchHistory();
  }, [formCode, token]);

  // 🖼 UI
  return (
    <div className="fc-join-form">
      <h2>📝 {formName}</h2>

      {fields.length === 0 ? (
        <p>⚠️ No fields available or form not found.</p>
      ) : (
        <>
          {closeTime && (
            <>
              <div className="fc-time-note">
                Note: All times are in IST (Indian Standard Time).<br/>
                {editingAllowed
                  ? `⏳ Time left to edit: ${Math.floor(timeLeft / 60)}:${('0' + (timeLeft % 60)).slice(-2)}`
                  : '⏰ Time is up! Editing is disabled.'}
              </div>
              <div className="fc-time-info">
                Form opens at: {openTime ? format(toZonedTime(openTime, 'Asia/Kolkata'), 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Kolkata' }) : ''} IST<br/>
                Form closes at: {closeTime ? format(toZonedTime(closeTime, 'Asia/Kolkata'), 'yyyy-MM-dd HH:mm:ss', { timeZone: 'Asia/Kolkata' }) : ''} IST
              </div>
            </>
          )}
          {fields.map(({ field_name, label, type, options }) => {
            const value = fieldValues[field_name] || "";

            return (
              <div key={field_name} className="fc-field-container">
                <label>{label}</label><br />
                {type === "dropdown" && Array.isArray(options) ? (
                  <select
                    id={field_name}
                    value={value}
                    disabled={!editingAllowed}
                    onFocus={() => handleFieldFocus(field_name)}
                    onBlur={() => handleFieldBlur(field_name)}
                    onChange={(e) => handleChange(field_name, e.target.value)}
                    className="fc-select"
                  >
                    <option value="">Select an option</option>
                    {options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={type}
                    id={field_name}
                    value={value}
                    placeholder={label}
                    disabled={!editingAllowed}
                    onFocus={() => handleFieldFocus(field_name)}
                    onBlur={() => handleFieldBlur(field_name)}
                    onChange={(e) => handleChange(field_name, e.target.value)}
                    className="fc-input"
                  />
                )}
                {/* Typing indicator */}
                {typingIndicators[field_name] && (
                  <span className="fc-typing-indicator">
                    ✏️ Typing: {typingIndicators[field_name]}
                  </span>
                )}
              </div>
            );
          })}
        </>
      )}

      <button onClick={handleSave} className="fc-save-button" disabled={!editingAllowed}>
        💾 Save Response to Database
      </button>
      <button
        onClick={() => navigate(`/form/${formCode}/history`)}
        className="fc-view-history-button"
      >
        📜 View Form History
      </button>

      {consensusPrompt && (
        <div className="fc-consensus-prompt">
          <div className="fc-consensus-content">
            <h3>Consensus Required</h3>
            <p>Do you agree to submit the response?</p>
            <p>Time left: {consensusTimeout}s</p>
            <button onClick={() => handleConsensusSubmit("yes")}>Yes</button>
            <button onClick={() => consensusAnswer !== "no" && setConsensusAnswer("no")}>No</button>
            {consensusAnswer === "no" && (
              <div>
                <input
                  placeholder="Enter reason (required)"
                  value={consensusReason}
                  onChange={e => setConsensusReason(e.target.value)}
                  required
                />
                <button
                  onClick={() => consensusReason.trim() && handleConsensusSubmit("no")}
                  disabled={!consensusReason.trim()}
                  className="fc-submit-no-button"
                >
                  Submit No
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {consensusResult && (
        <div className="fc-consensus-result">
          {consensusResult.success
            ? '✅ Response saved to DB successfully!'
            : `❌ Save rejected by ${consensusResult.userName || 'a user'}: ${consensusResult.reason}`}
        </div>
      )}
    </div>
  );
};

export default JoinForm;
