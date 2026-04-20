import React, { useCallback, useEffect, useRef, useState } from "react";

const taskPageCss = `
.task-page-shell{position:fixed;inset:0;z-index:1050;background:rgba(244,246,249,.95);padding:40px 0 0;overflow:hidden;display:flex;align-items:flex-start;justify-content:center;zoom: 0.9;}
.task-page-shell--one-third{justify-content:flex-end;}
.task-page-shell--one-third .task-page-content{width:min(560px,33vw);min-width:460px;}
.task-page-content{width:min(1260px,96vw);height:min(720px,92vh);margin-top:0;}
.task-page-shell .row{margin:0;height:100%;}
.task-page-shell .col-12{padding:0;height:100%;}
.task-modal-card{width:100%;height:100%;display:flex;flex-direction:column;margin:0;border-radius:0;overflow:hidden;box-shadow:none;}
.task-modal-card .card-header{padding:0;border-bottom:0;}
.task-modal-header{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:#fff;border-bottom:1px solid #dfe5ee;border-radius:0;}
.task-modal-title{font-size:22px;font-weight:600;color:#234a73;letter-spacing:0;margin:0;}
.task-modal-close i{color:#aabbd0;font-size:20px;}
.task-modal-body{flex:1;overflow-y:auto;overflow-x:hidden;padding:0;background:#fff;}
.task-modal-footer{background:#fff;border-top:1px solid #e9ecef;padding:12px 18px;display:flex;justify-content:flex-end;gap:10px;}
.task-section{border:0;border-top:1px solid #e5e7eb;border-radius:0;background:#fff;box-shadow:none;margin-bottom:0;}
.task-section-title{padding:5px 12px;font-weight:600;border-bottom:1px solid #e9ecef;border-radius:0;width:100%;min-width:0;text-align:center;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;background:#fff;color:#25518b;font-size:15px;}
.task-section-title--blue{background:#fff;border-bottom-color:#e9ecef;padding:5px 10px;font-size:15px;min-height:34px;}
.task-section-title--green{background:#fff;border-bottom-color:#e9ecef;}
.task-section-title--yellow{background:#fff;border-bottom-color:#e9ecef;}
.task-section-title--red{background:#fff;border-bottom-color:#e9ecef;}
.task-section-toggle{border:0;}
.task-section-icon{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:4px;background:#e8f4ff;border:1px solid #bddcf8;color:#2f6f96;}
.task-section-content{padding:8px 16px 10px;}
.task-inline-section{border-top:1px solid #e5e7eb;background:#fff;}
.task-inline-section-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px;color:#25518b;}
.task-inline-section-title{margin:0;font-size:18px;font-weight:600;line-height:1.2;color:#25518b;}
.task-inline-section-action{display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:#25518b;font-size:16px;font-weight:500;padding:0;}
.task-inline-section-body{padding:0 16px 14px;}
.task-procedure-row{display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:10px;padding:4px 0;}
.task-procedure-index{color:#5c6674;font-size:14px;line-height:1;font-weight:500;text-align:right;}
.task-procedure-input{height:34px !important;border-radius:8px !important;font-size:14px !important;padding:6px 12px !important;}
.task-procedure-actions{display:flex;align-items:center;gap:8px;}
.task-procedure-icon-btn{border:0;background:transparent;color:#9fb3c6;font-size:18px;line-height:1;padding:0;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;}
.task-procedure-icon-spacer{display:inline-block;width:28px;height:28px;}
.task-asset-title-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.task-asset-title-row h4{margin:0;font-size:18px;font-weight:600;color:#25518b;}
.task-asset-add-btn{border:0;background:transparent;color:#25518b;font-size:16px;font-weight:500;display:inline-flex;align-items:center;gap:6px;padding:0;}
.add-task-form label{font-weight:600;margin-bottom:6px;display:block;color:#1f3d5a;font-size:14px;line-height:18px;}
.task-details-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px 12px;align-items:start;}
@media (max-width:1199.98px){.task-details-grid{grid-template-columns:repeat(3,minmax(0,1fr));}}
@media (max-width:991.98px){.task-details-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media (max-width:575.98px){.task-details-grid{grid-template-columns:1fr;}}
.task-field{min-width:0;display:flex;flex-direction:column;gap:5px;box-sizing:border-box;}
.task-field--wide{grid-column:span 2;}
.task-field--full{grid-column:1 / -1;}
.task-field--switch .switch{margin-top:6px;}
.task-field--all-day{display:flex;flex-direction:column;justify-content:flex-end;}
.task-all-day-checkbox{display:inline-flex;align-items:center;gap:8px;margin-top:8px;font-weight:500;color:#334155;}
.task-all-day-checkbox input{width:20px;height:20px;accent-color:#1f4f6d;}
.add-task-form .form-control,.add-task-form .react-datepicker__input-container input{height:38px;padding:8px 12px;font-size:14px;border-radius:8px;border:1px solid #d1d7df;box-shadow:none;color:#1f2d3d;width:100%;}
.add-task-form .react-datepicker-wrapper,
.add-task-form .react-datepicker__input-container{display:block;width:100%;}
.task-picker-input{width:100%;display:block;}
.task-description-box{min-height:38px;height:38px;resize:none;}
.task-input-error{border-color:#e37f7f !important;box-shadow:0 0 0 1px rgba(227,127,127,.18);}
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
.react-datepicker{border:1px solid #d8e2ed;border-radius:10px;box-shadow:0 10px 28px rgba(26,52,83,.16);font-size:13px;padding:6px 8px 10px;}
.react-datepicker__triangle{display:none;}
.react-datepicker__header{background:#fff;border-bottom:0;padding-top:10px;}
.react-datepicker__current-month{color:#2d5f8f;font-weight:700;font-size:14px;}
.react-datepicker__day-name{color:#7f8ea0;font-weight:600;font-size:11px;width:2rem;line-height:2rem;margin:.15rem;}
.react-datepicker__day{width:2rem;line-height:2rem;margin:.15rem;color:#344e69;border-radius:6px;}
.react-datepicker__day:hover{background:#e8f1fb;}
.react-datepicker__day--selected,.react-datepicker__day--keyboard-selected{background:#2d6d9f !important;color:#fff !important;}
.react-datepicker__navigation{top:10px;}
.react-datepicker__navigation-icon::before{border-color:#2d6d9f;border-width:2px 2px 0 0;}
.react-datepicker__time-container{border-left:1px solid #e6edf4;}
.react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item{height:30px;line-height:30px;}
.react-datepicker-popper{z-index:1400;}
.task-inline-error-pop{position:fixed;left:50%;top:98px;transform:translateX(-50%);z-index:1300;background:#3f4349;color:#fff;border-radius:6px;padding:10px 14px;font-size:14px;font-weight:600;box-shadow:0 12px 22px rgba(0,0,0,.28);display:inline-flex;align-items:center;}
.task-inline-error-pop:after{content:"";position:absolute;left:50%;top:-6px;transform:translateX(-50%) rotate(45deg);width:12px;height:12px;background:#3f4349;}
.task-feedback-overlay{position:fixed;inset:0;background:rgba(11,18,27,.45);z-index:1250;display:flex;align-items:center;justify-content:center;padding:16px;}
.task-feedback-modal{width:min(460px,94vw);background:#fff;border:1px solid #dbe4ed;border-radius:8px;box-shadow:0 14px 36px rgba(17,31,47,.24);}
.task-feedback-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #e6edf4;}
.task-feedback-head--success{background:#f7fbff;}
.task-feedback-title-wrap{display:flex;align-items:center;gap:10px;}
.task-feedback-title-wrap h4{margin:0;color:#293949;font-size:18px;font-weight:700;}
.task-feedback-icon{width:24px;height:24px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:#d8ecff;color:#407db7;}
.task-feedback-close{border:0;background:transparent;color:#7c8a99;font-size:16px;}
.task-feedback-body{padding:14px 16px;color:#5f6d7c;font-size:15px;}
.task-feedback-body p{margin:0;}
.task-feedback-foot{display:flex;justify-content:flex-end;padding:0 16px 14px;}
.task-feedback-foot .btn{min-width:90px;}
@media (max-width:991.98px){
  .task-page-shell--one-third{justify-content:center;}
  .task-page-shell--one-third .task-page-content{width:min(96vw,900px);min-width:0;}
  .task-section-title{width:100%;min-width:0;}
  .task-page-content{height:min(760px,94vh);}
}

/* Schedule section */
.task-schedule-wrap{padding:6px 0 0;}
.task-schedule-topbar{display:flex;align-items:center;justify-content:space-between;margin:0 0 10px;}
.task-schedule-title{font-weight:700;color:#25518b;font-size:18px;}
.task-schedule-remove{border:0;background:transparent;color:#25518b;font-weight:600;display:inline-flex;align-items:center;gap:8px;padding:0;}
.task-schedule-remove i{font-size:14px;opacity:.85;}
.task-schedule-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;}
@media (max-width:991.98px){.task-schedule-grid{grid-template-columns:1fr;}}
.task-schedule-card{border:1px solid #d2dae6;border-radius:8px;background:#f7fafc;padding:14px;min-height:176px;}
.task-schedule-card-title{font-weight:700;color:#1f3d5a;margin:0 0 10px;}
.task-schedule-radio{display:flex;gap:10px;align-items:flex-start;margin:0 0 8px;cursor:pointer;}
.task-schedule-radio input{margin-top:4px;}
.task-schedule-radio-text{display:flex;flex-direction:column;gap:2px;}
.task-schedule-radio-head{font-weight:700;color:#1f3d5a;font-size:14px;}
.task-schedule-radio-sub{font-size:12px;color:#64748b;}
.task-shift-pill-row{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 6px;}
.task-shift-pill{border:1px solid #cdd7e3;background:#fff;border-radius:999px;padding:6px 12px;font-weight:700;color:#334155;font-size:13px;}
.task-shift-pill.is-selected{background:#e6f2ff;border-color:#b8d6f3;color:#25518b;}
.task-schedule-muted{font-size:12px;color:#8aa0b5;padding-left:2px;}
.task-custom-time-row{display:flex;align-items:center;gap:10px;margin-top:8px;}
.task-time-input{position:relative;flex:1;min-width:0;}
.task-time-input input{width:100%;height:38px;border:1px solid #cdd7e3;border-radius:8px;padding:8px 34px 8px 12px;background:#fff;}
.task-time-input i{position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#9fb3c6;}
.task-time-dash{color:#64748b;font-weight:700;}
.task-schedule-field-label{font-weight:700;color:#1f3d5a;font-size:13px;}
.task-schedule-field-sub{font-size:12px;color:#64748b;margin-bottom:6px;}
.task-schedule-interval-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.task-schedule-preview{font-size:12px;color:#475569;line-height:1.4;}
.task-schedule-preview-empty{color:#64748b;}
.task-schedule-preview-list{margin:0;padding-left:18px;}
.task-schedule-error{margin-top:12px;padding:10px 12px;border-radius:8px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;font-weight:600;}
.task-schedule-actions{display:flex;justify-content:flex-end;margin-top:12px;}
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
        style={{ cursor: String(title || "").toLowerCase().trim() === "task details" ? "default" : "pointer" }}
        onClick={() => {
          if (String(title || "").toLowerCase().trim() !== "task details") {
            onToggle?.();
          }
        }}
      >
        <span>{title}</span>
        {String(title || "").toLowerCase().trim() !== "task details" && (
          <span className="task-section-icon">
            <i className={`fas ${isOpen ? "fa-minus" : "fa-plus"}`} />
          </span>
        )}
      </button>
      {isOpen ? <div className="task-section-content">{children}</div> : null}
    </section>
  );
}

export function TaskInlineSection({ title, actionLabel, onAction, children }) {
  return (
    <section className="task-inline-section">
      <div className="task-inline-section-header">
        <h4 className="task-inline-section-title">{title}</h4>
        {onAction ? (
          <button type="button" className="task-inline-section-action" onClick={onAction}>
            <i className="fa fa-plus" />
            <span>{actionLabel || "Add"}</span>
          </button>
        ) : null}
      </div>
      <div className="task-inline-section-body">{children}</div>
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
