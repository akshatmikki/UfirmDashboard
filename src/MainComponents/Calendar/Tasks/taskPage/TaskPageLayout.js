import React, { useCallback, useEffect, useRef, useState } from "react";

const taskPageCss = `
.task-page-shell{position:fixed;inset:0;z-index:1050;background:#f4f6f9;padding:0;overflow:hidden;}
.task-page-shell--one-third{justify-content:flex-end;}
.task-page-shell--one-third .task-page-content{width:min(560px,33vw);min-width:460px;}
.task-page-content{width:100vw;height:100vh;}
.task-page-shell .row{margin:0;height:100%;}
.task-page-shell .col-12{padding:0;height:100%;}
.task-modal-card{width:100vw;height:100vh;display:flex;flex-direction:column;margin:0;border-radius:0;}
.task-modal-card .card-header{padding:0;border-bottom:0;}
.task-modal-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:linear-gradient(135deg,#1f4f6d,#2f6f96);border-radius:0;}
.task-modal-title{font-size:22px;font-weight:600;color:#fff;letter-spacing:.5px;margin:0;}
.task-modal-close i{color:#fff;font-size:18px;}
.task-modal-body{flex:1;overflow-y:auto;padding:16px 18px;}
.task-modal-footer{background:#fff;border-top:1px solid #e9ecef;padding:12px 18px;display:flex;justify-content:flex-end;gap:10px;}
.task-section{border:1px solid #e9ecef;border-radius:10px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.04);margin-bottom:14px;}
.task-section-title{padding:10px 12px;font-weight:600;border-bottom:1px solid #e9ecef;border-radius:10px 10px 0 0;width:33.333%;min-width:280px;text-align:left;display:flex;align-items:center;justify-content:space-between;cursor:pointer;}
.task-section-title--blue{background:#d9efff;border-bottom-color:#bddcf8;}
.task-section-title--blue{padding:6px 10px;font-size:1rem;min-height:36px;}
.task-section-title--green{background:#e3f6e3;border-bottom-color:#c7e9c7;}
.task-section-title--yellow{background:#fff6cc;border-bottom-color:#f1df95;}
.task-section-title--red{background:#ffe2e2;border-bottom-color:#f3bebe;}
.task-section-toggle{border:0;}
.task-section-icon{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:6px;background:#eef7ff;border:1px solid #bddcf8;color:#2f6f96;}
.task-section-content{padding:12px;}
.add-task-form label{font-weight:500;margin-bottom:6px;display:block;}
.task-details-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 14px;}
@media (max-width:1199.98px){.task-details-grid{grid-template-columns:repeat(3,minmax(0,1fr));}}
@media (max-width:991.98px){.task-details-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media (max-width:575.98px){.task-details-grid{grid-template-columns:1fr;}}
.task-field{min-width:0;}
.task-field--switch .switch{margin-top:6px;}
.add-task-form .form-control,.add-task-form .react-datepicker-wrapper,.add-task-form .react-datepicker__input-container input{height:38px;padding:6px 12px;font-size:14px;}
.add-task-form .react-datepicker-wrapper{width:100%;}
.add-task-form .form-control:disabled,
.add-task-form .form-control[readonly],
.add-task-form .react-datepicker__input-container input:disabled,
.add-task-form .react-datepicker__input-container input[readonly]{
  background-color:#f5f8fc !important;
  border-color:#d8e2ec !important;
  color:#2f3b4a !important;
  opacity:1;
}
.placeholder-select{color:#9aa0a6 !important;}
.placeholder-select option{color:#000;}
.btn-icon{height:38px;width:38px;display:flex;align-items:center;justify-content:center;padding:0;}
@media (max-width:991.98px){
  .task-page-shell--one-third{justify-content:center;}
  .task-page-shell--one-third .task-page-content{width:min(96vw,900px);min-width:0;}
  .task-section-title{width:100%;min-width:0;}
}
`;

export function useSingleOpenSection(defaultKey = "details") {
  const [openSection, setOpenSection] = useState(defaultKey);
  const toggleSection = useCallback((key) => setOpenSection((prev) => (prev === key ? null : key)), []);
  return { openSection, toggleSection };
}

export function useMultiOpenSections(defaultKeys = []) {
  const keysSignature = (defaultKeys || []).join("|");
  const [openSections, setOpenSections] = useState(() => {
    const next = {};
    (defaultKeys || []).forEach((key) => {
      next[key] = true;
    });
    return next;
  });

  useEffect(() => {
    const next = {};
    (defaultKeys || []).forEach((key) => {
      next[key] = true;
    });
    setOpenSections(next);
  }, [keysSignature]);

  const toggleSection = useCallback((key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const isOpen = useCallback((key) => !!openSections[key], [openSections]);
  return { isOpen, toggleSection };
}

export function TaskShell({ visible, title, onClose, footer, children, oneThird = false }) {
  const modalBodyRef = useRef(null);
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    if (!visible) return undefined;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [visible]);

  useEffect(() => {
    const justOpened = visible && !wasVisibleRef.current;
    wasVisibleRef.current = visible;
    if (!justOpened) return undefined;

    const frame = window.requestAnimationFrame(() => {
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTop = 0;
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={`task-page-shell ${oneThird ? "task-page-shell--one-third" : ""}`}>
      <style>{taskPageCss}</style>
      <div className="task-page-content">
        <div className="row">
          <div className="col-12">
          <div className="card card-primary task-modal-card">
            <div className="card-header">
              <div className="task-modal-header">
                <h3 className="task-modal-title">{title}</h3>
                <button className="btn btn-tool task-modal-close" onClick={onClose} type="button">
                  <i className="fas fa-times" />
                </button>
              </div>
            </div>
            <div className="task-modal-body" ref={modalBodyRef}>{children}</div>
            {footer ? <div className="task-modal-footer">{footer}</div> : null}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TaskSection({ title, isOpen = true, onToggle, children }) {
  const getHeaderToneClass = () => {
    const key = String(title || "").toLowerCase().trim();
    if (key === "task details") return "task-section-title--blue";
    if (key.startsWith("questionnaire")) return "task-section-title--green";
    if (key === "asset") return "task-section-title--yellow";
    if (key === "fm remarks") return "task-section-title--red";
    return "task-section-title--blue";
  };

  return (
    <section className="task-section">
      <button
        className={`task-section-title task-section-toggle ${getHeaderToneClass()}`}
        type="button"
        onClick={() => onToggle?.()}
      >
        <span>{title}</span>
        <span className="task-section-icon">
          <i className={`fas ${isOpen ? "fa-minus" : "fa-plus"}`} />
        </span>
      </button>
      {isOpen ? <div className="task-section-content">{children}</div> : null}
    </section>
  );
}

export function TaskField({ label, children, className }) {
  return (
    <div className={`task-field ${className || ""}`.trim()}>
      <label>{label}</label>
      {children}
    </div>
  );
}
