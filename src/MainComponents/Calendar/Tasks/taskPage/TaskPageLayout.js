import React, { useCallback, useEffect, useRef, useState } from "react";

const taskPageCss = `
.task-page-shell{position:fixed;inset:0;z-index:1050;background:rgba(244,246,249,.95);padding:40px 0 0;overflow:hidden;display:flex;align-items:flex-start;justify-content:center;zoom:0.9;}
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
.task-page-shell--fm{padding:24px 0 0;zoom:0.85;}
.task-page-shell--fm .task-page-content{width:min(1120px,96vw);height:min(700px,92vh);}
.task-page-shell--fm .task-modal-card{border-radius:12px;box-shadow:0 18px 45px rgba(15,23,42,.18);}
.task-page-shell--fm .task-modal-header{padding:10px 14px;border-bottom:1px solid #d1d9e6;}
.task-page-shell--fm .task-modal-title{font-size:16px;font-weight:600;color:#0f172a;}
.task-page-shell--fm .task-modal-body{display:flex;flex-direction:column;min-height:0;overflow:hidden;}
.task-page-shell--fm .task-modal-footer{display:none;}
.task-page-shell--fm .task-modal-close i{color:#64748b;font-size:22px;}
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

/* Custom View Grid */
.task-view-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px 12px; align-items: start; padding-top: 5px; }
@media (max-width:1199.98px){.task-view-grid{grid-template-columns:repeat(3,minmax(0,1fr));}}
@media (max-width:991.98px){.task-view-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media (max-width:575.98px){.task-view-grid{grid-template-columns:1fr;}}
.task-view-field { display: flex; flex-direction: column; gap: 4px; }
.task-view-field--wide { grid-column: span 2; }
.task-view-field--full { grid-column: 1 / -1; }
.task-view-label { font-size: 13px; color: #64748b; font-weight: 500; margin: 0; }
.task-view-value { font-size: 14px; color: #1e293b; margin: 0; word-break: break-word; }
.task-priority-badge { font-size: 14px; font-weight: 600; }
.task-priority-badge.high { color: #dc2626; }
.task-priority-badge.medium { color: #d97706; }
.task-priority-badge.low { color: #059669; }
.task-status-badge { font-size: 13px; font-weight: 500; background-color: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; }

/* FM Remarks split layout */
.fm-remarks-split{display:grid;grid-template-columns:320px minmax(0,1fr);gap:0;border:1px solid #d9e3ef;border-radius:12px;overflow:hidden;background:#fff;min-height:460px;margin-top:8px;}
.task-page-shell--fm .fm-remarks-split{margin-top:0;border:0;border-radius:0;min-height:0;flex:1;}
.task-page-shell--fm .fm-questions-head{display:none;}
.task-page-shell--fm .fm-questions{background:#fff;}
.task-page-shell--fm .fm-questions-list{padding-top:6px;}
.task-page-shell--fm .fm-q-item:first-child{margin-top:4px;}
.task-page-shell--fm .fm-questions-list{scroll-padding-top:12px;}
.task-page-shell--fm .fm-q-item{padding:12px 14px;}
.task-page-shell--fm .fm-q-index{width:22px;height:22px;border-radius:999px;background:#0ea5e9;color:#fff;}
.task-page-shell--fm .fm-q-badge{background:#1e3a8a;color:#fff;}
.task-page-shell--fm .fm-q-badge.is-actionable{background:#1e3a8a;color:#fff;}
.task-page-shell--fm .fm-q-dot{display:none;}
.task-page-shell--fm .fm-remarks-compact{flex:1;min-height:0;}
.fm-questions{background:#f8fafc;border-right:1px solid #d9e3ef;display:flex;flex-direction:column;min-width:0;}
.fm-questions-head{padding:10px 12px;font-weight:700;color:#1f3d5a;font-size:13px;border-bottom:1px solid #e2e8f0;background:#f1f5f9;}
.fm-questions-list{flex:1;overflow:auto;}
.fm-q-item{width:100%;border:0;background:transparent;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;text-align:left;border-bottom:1px solid #eef2f7;color:#334155;position:relative;}
.fm-q-item:hover{background:#eef6ff;}
.fm-q-item.is-active{background:#dbeafe;}
.fm-q-item.is-active::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:#2563eb;}
.fm-q-name{display:flex;align-items:flex-start;gap:10px;min-width:0;}
.fm-q-index{width:22px;height:22px;border-radius:6px;background:#e2e8f0;color:#1f3d5a;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;}
.fm-q-text{font-weight:600;font-size:13px;line-height:1.25;white-space:normal;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
.fm-q-meta{display:flex;align-items:center;gap:8px;flex:0 0 auto;}
.fm-q-dot{width:10px;height:10px;border-radius:999px;background:#1d4ed8;box-shadow:0 0 0 3px rgba(29,78,216,.12);}
.fm-q-badge{height:22px;border-radius:999px;padding:0 10px;background:#e2e8f0;color:#334155;font-weight:800;font-size:12px;display:inline-flex;align-items:center;justify-content:center;}
.fm-q-badge.is-actionable{background:#dcfce7;color:#166534;}
.fm-q-empty{padding:12px;color:#64748b;font-weight:600;font-size:13px;}
.fm-chat{background:#f1f5f9;display:flex;flex-direction:column;min-width:0;position:relative;}
.task-page-shell--fm .fm-chat{background:#9fb4bf;}
.fm-chat-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;background:#fff;border-bottom:1px solid #d9e3ef;}
.fm-chat-title{display:flex;align-items:center;gap:10px;min-width:0;}
.fm-chat-pill{background:rgba(37,99,235,.16);color:#1e3a8a;border-radius:999px;padding:3px 10px;font-weight:800;font-size:12px;flex:0 0 auto;}
.fm-chat-question{color:#0f172a;font-weight:800;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.fm-chat-actions .btn{border-radius:8px;}
.fm-chat-box{flex:1;min-height:0;padding:10px;display:flex;}
.fm-chat-box .alert{flex:1;min-height:0;margin:0;border-color:#d9e3ef;background:#fff;}
.fm-chat-box .alert .btn{border-radius:10px;}
.fm-chat-empty{flex:1;display:flex;align-items:center;justify-content:center;color:#64748b;font-weight:700;}
.task-page-shell--fm .fm-chat-box{padding:12px;}
.task-page-shell--fm .fm-chat-box .container{margin-top:0 !important;padding:0 !important;max-width:none !important;}
.task-page-shell--fm .fm-chat-box .alert{border-radius:10px;border:0;background:transparent;padding:0;}
.task-page-shell--fm .fm-chat-box .alert-info{display:none;}
.task-page-shell--fm .fm-chat-box .alert-secondary{border:0;background:transparent;}
.task-page-shell--fm .fm-chat-box textarea.form-control{border-radius:10px;}
@media (max-width:991.98px){.fm-remarks-split{grid-template-columns:1fr;}.fm-questions{border-right:0;border-bottom:1px solid #d9e3ef;}}
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

export function TaskShell({ visible, title, priority, status, rightActions, onClose, footer, children, oneThird = false, variant }) {
  const modalBodyRef = useRef(null);
  const wasVisibleRef = useRef(false);
  const shellRef = useRef(null);
  const prevWindowScrollRef = useRef(0);

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

    prevWindowScrollRef.current = window.scrollY || window.pageYOffset || 0;

    const frame = window.requestAnimationFrame(() => {
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTop = 0;
      }
      // Prevent the underlying page from jumping when focus moves into the modal.
      try {
        shellRef.current?.focus?.({ preventScroll: true });
      } catch {
        shellRef.current?.focus?.();
      }
      if (typeof window.scrollTo === "function") {
        window.scrollTo(0, prevWindowScrollRef.current);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={shellRef}
      tabIndex={-1}
      className={`task-page-shell ${oneThird ? "task-page-shell--one-third" : ""} ${
        variant ? `task-page-shell--${variant}` : ""
      }`.trim()}
    >
      <style>{taskPageCss}</style>
      <div className="task-page-content">
        <div className="row">
          <div className="col-12">
          <div className="card card-primary task-modal-card">
                        <div className="card-header">
              <div className="task-modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h3 className="task-modal-title">{title}</h3>
                  {variant !== "fm" && priority && (
                    <span className={`task-priority-badge ${String(priority).toLowerCase()}`}>
                      {priority} {String(priority).toLowerCase().includes("priority") ? "" : "Priority"}
                    </span>
                  )}
                  {variant !== "fm" && status && (
                    <span className="task-status-badge">
                      {status}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {rightActions}
                  <button className="btn btn-tool task-modal-close" onClick={onClose} type="button" style={{ padding: "0" }}>
                    <i className="fas fa-times" style={{ fontSize: "20px" }} />
                  </button>
                </div>
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
