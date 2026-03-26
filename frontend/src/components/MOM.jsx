import { useState, useRef } from 'react';
import { momService } from '../services/mom.service';
import './MOM.css';

export default function MOM() {
  const [step, setStep] = useState('upload'); // upload | processing | result
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [manualText, setManualText] = useState('');
  const [mode, setMode] = useState('scan'); // scan | text
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const process = async () => {
    setStep('processing');
    setError('');
    try {
      let res;
      if (mode === 'scan') {
        res = await momService.scanAndGenerateMOM(file);
      } else {
        res = await momService.generateFromText(manualText);
      }
      if (!res.success) throw new Error(res.message);
      setResult(res.data);
      setStep('result');
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setStep('upload');
    }
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    setManualText('');
  };

  return (
    <div className="mom-page">
      <div className="mom-header">
        <div className="mom-header-icon">📋</div>
        <div>
          <h1>Minutes of Meeting</h1>
          <p>Scan handwritten notes or paste text to generate a professional MOM PDF</p>
        </div>
      </div>

      {step === 'upload' && (
        <div className="mom-container">
          {/* Mode toggle */}
          <div className="mom-mode-toggle">
            <button
              className={`mode-btn ${mode === 'scan' ? 'active' : ''}`}
              onClick={() => setMode('scan')}>
              📷 Scan Notes
            </button>
            <button
              className={`mode-btn ${mode === 'text' ? 'active' : ''}`}
              onClick={() => setMode('text')}>
              ✏️ Type / Paste Text
            </button>
          </div>

          {mode === 'scan' ? (
            <>
              <div
                className={`mom-dropzone ${dragOver ? 'dragover' : ''} ${preview ? 'has-preview' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current.click()}>
                {preview ? (
                  <img src={preview} alt="preview" className="mom-preview-img" />
                ) : (
                  <>
                    <div className="dropzone-icon">📄</div>
                    <p className="dropzone-title">Drop your meeting notes here</p>
                    <p className="dropzone-sub">or click to browse — JPG, PNG supported</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
              {preview && (
                <div className="mom-actions">
                  <button className="btn-secondary" onClick={() => { setPreview(null); setFile(null); }}>
                    🔄 Change Image
                  </button>
                  <button className="btn-primary" onClick={process}>
                    ✨ Generate MOM
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <textarea
                className="mom-textarea"
                placeholder="Paste or type your meeting notes here...&#10;&#10;Example:&#10;Meeting: Q1 Review&#10;Date: 10 March 2026&#10;Attendees: Rahul, Priya, Amit&#10;Discussed: Sales targets, new leads&#10;Action: Rahul to follow up with 5 leads by Friday"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                rows={12}
              />
              <div className="mom-actions">
                <button
                  className="btn-primary"
                  onClick={process}
                  disabled={!manualText.trim()}>
                  ✨ Generate MOM
                </button>
              </div>
            </>
          )}

          {error && <div className="mom-error">⚠️ {error}</div>}
        </div>
      )}

      {step === 'processing' && (
        <div className="mom-processing">
          <div className="processing-card">
            <div className="processing-spinner" />
            <h2>Generating Minutes of Meeting</h2>
            <div className="processing-steps">
              <div className="proc-step active">
                <span className="proc-dot" />
                {mode === 'scan' ? 'Reading handwriting with OCR' : 'Processing text'}
              </div>
              <div className="proc-step">
                <span className="proc-dot" />
                Structuring with AI
              </div>
              <div className="proc-step">
                <span className="proc-dot" />
                Generating PDF
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'result' && result && (
        <div className="mom-result">
          <div className="result-success">
            <span className="success-icon">✅</span>
            <div>
              <h2>MOM Generated Successfully!</h2>
              <p>{result.wordCount || 0} words processed</p>
            </div>
            <a href={result.momUrl} target="_blank" rel="noreferrer" className="btn-download">
              ⬇️ Download PDF
            </a>
          </div>

          {/* MOM Preview */}
          <div className="mom-preview-grid">

            <div className="preview-card">
              <h3>📋 Meeting Details</h3>
              <table className="info-table">
                <tbody>
                  <tr><td>Title</td><td>{result.mom.meetingTitle}</td></tr>
                  <tr><td>Date</td><td>{result.mom.meetingDate}</td></tr>
                  <tr><td>Time</td><td>{result.mom.meetingTime}</td></tr>
                  <tr><td>Venue</td><td>{result.mom.venue}</td></tr>
                  <tr><td>Chair</td><td>{result.mom.chairperson}</td></tr>
                  <tr><td>Next Meeting</td><td>{result.mom.nextMeetingDate}</td></tr>
                </tbody>
              </table>
            </div>

            {result.mom.attendees?.length > 0 && (
              <div className="preview-card">
                <h3>👥 Attendees</h3>
                <div className="attendees-grid">
                  {result.mom.attendees.map((a, i) => (
                    <div key={i} className="attendee-chip">{a}</div>
                  ))}
                </div>
              </div>
            )}

            {result.mom.agenda?.length > 0 && (
              <div className="preview-card full-width">
                <h3>📌 Agenda</h3>
                <ol className="agenda-list">
                  {result.mom.agenda.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </div>
            )}

            {result.mom.actionItems?.length > 0 && (
              <div className="preview-card full-width">
                <h3>⚡ Action Items</h3>
                <table className="action-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Owner</th>
                      <th>Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.mom.actionItems.map((item, i) => (
                      <tr key={i}>
                        <td>{item.action}</td>
                        <td>{item.owner}</td>
                        <td>{item.deadline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {result.mom.decisions?.length > 0 && (
              <div className="preview-card full-width">
                <h3>✅ Decisions Made</h3>
                <ul className="decisions-list">
                  {result.mom.decisions.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

          </div>

          <div className="result-actions">
            <a href={result.momUrl} target="_blank" rel="noreferrer" className="btn-primary">
              ⬇️ Download MOM PDF
            </a>
            <button className="btn-secondary" onClick={reset}>
              🔄 Generate Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}