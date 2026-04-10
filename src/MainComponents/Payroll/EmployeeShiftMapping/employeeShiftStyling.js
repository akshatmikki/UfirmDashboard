export const esmCss = `
.esm-wrap{padding:20px 12px 18px 20px;background:#edf1f5;min-height:calc(100vh - 58px);}
.esm-head{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
.esm-head-icon-wrap{width:40px;height:40px;border-radius:8px;background:linear-gradient(135deg, #245789 0%, #1e4a6f 100%);display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;box-shadow:0 2px 4px rgba(36,87,137,0.2);flex-shrink:0;}
.esm-head-text-wrap{display:flex;flex-direction:column;}
.esm-head-title{font-size:18px;font-weight:700;color:#1f2628;line-height:1.2;}
.esm-head-sub{font-size:11px;color:#9ba5ae;font-weight:400;}
.esm-error-banner{display:flex;align-items:center;gap:12px;background:#fff5f5;border:1px solid #f1cccc;border-left:4px solid #cb3a3a;color:#de5d5d;font-size:12px;font-weight:700;border-radius:5px;padding:10px 12px;margin-bottom:10px;}
.esm-grid{display:grid;grid-template-columns:minmax(0,1fr) 390px;gap:10px;align-items:start;}
.esm-card{background:#fff;border:1px solid #d7dde4;border-radius:9px;overflow:hidden;}
.esm-filters-bar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px;background:#fafbfc;border-bottom:1px solid #e8edf2;}
.esm-search-wrap{position:relative;}
.esm-search-icon{position:absolute;left:8px;top:50%;transform:translateY(-50%);color:#9ba5ae;font-size:11px;pointer-events:none;}
.esm-search-input{width:224px;height:34px;padding-left:26px;padding-right:10px;font-size:12px;border:1px solid #d8dee6;border-radius:4px;background:#fff;color:#3f4750;outline:none;}
.esm-search-input:focus{border-color:#245789;box-shadow:0 0 0 2px rgba(36,87,137,0.1);}
.esm-filter-select{height:34px;padding:0 10px 0 8px;font-size:12px;border:1px solid #d8dee6;border-radius:4px;background:#fff;color:#58626d;outline:none;cursor:pointer;appearance:none;padding-right:24px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%2358626d' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;}
.esm-filter-select:focus{border-color:#245789;}
.esm-btn-clear{height:34px;padding:0 10px;font-size:12px;border:1px solid #d8dee6;border-radius:4px;background:#fff;color:#8f99a2;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-weight:700;transition:all 0.2s;}
.esm-btn-clear:hover{color:#c93535;border-color:#f1cccc;background:#fff5f5;}
.esm-btn-assign{margin-left:auto;height:34px;padding:0 14px;background:#245789;color:#fff;font-size:12px;font-weight:700;border:0;border-radius:4px;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 4px rgba(36,87,137,0.2);cursor:pointer;transition:all 0.2s;}
.esm-btn-assign:hover{background:#1e4a6f;box-shadow:0 4px 8px rgba(36,87,137,0.3);}
.esm-btn-assign:active{background:#173859;}
.esm-btn-assign-plus{width:18px;height:18px;background:#1e4a6f;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;}
.esm-table-wrap{padding:8px;max-height:540px;overflow:auto;}
.esm-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #d8dee6;border-radius:8px;overflow:hidden;}
.esm-thead{position:sticky;top:0;z-index:10;}
.esm-th{background:#edf1f4;border-bottom:1px solid #d8dee6;color:#55606c;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;padding:10px 11px;text-align:left;white-space:nowrap;}
.esm-tr{cursor:pointer;transition:background 0.15s;}
.esm-tr:hover td{background:#f5f9fd;}
.esm-tr.active td{background:#c9dcf1;}
.esm-td{border-bottom:1px solid #eceff3;color:#434a52;font-size:13px;padding:9px 11px;}
.esm-td:last-child{border-bottom:0;}
.esm-emp-cell{display:flex;align-items:center;gap:8px;}
.esm-emp-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg, #d9ebfa 0%, #c9ddf5 100%);color:#2a5a86;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
.esm-emp-name{font-weight:700;color:#1f2628;font-size:13px;}
.esm-shift-badge{display:inline-flex;align-items:center;gap:6px;background:#d9ead9;border:1px solid #a6d2a6;color:#137917;font-size:11px;font-weight:700;padding:4px 8px;border-radius:999px;white-space:nowrap;}
.esm-shift-badge-dot{width:6px;height:6px;border-radius:50%;background:#52b552;flex-shrink:0;}
.esm-date-cell{display:flex;align-items:center;gap:6px;color:#8f99a2;font-size:12px;}
.esm-date-cell-icon{color:#d8dee6;font-size:11px;}
.esm-row-actions{display:flex;gap:6px;align-items:center;opacity:0;transition:opacity 0.15s;}
.esm-tr:hover .esm-row-actions{opacity:1;}
.esm-act-edit{width:28px;height:28px;border-radius:4px;background:#d9ebfa;color:#245789;border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;transition:all 0.2s;}
.esm-act-edit:hover{background:#b0d4f1;color:#1e4a6f;}
.esm-act-delete{width:28px;height:28px;border-radius:4px;background:#fadada;color:#c93535;border:0;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;transition:all 0.2s;}
.esm-act-delete:hover{background:#f0bfbf;color:#9d2828;}
.esm-state-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center;}
.esm-state-icon{font-size:36px;color:#d8dee6;margin-bottom:10px;}
.esm-state-title{font-size:14px;font-weight:700;color:#9ba5ae;margin-bottom:5px;}
.esm-state-sub{font-size:12px;color:#d8dee6;}
.esm-loading-state{display:flex;align-items:center;justify-content:center;padding:100px 20px;text-align:center;color:#9ba5ae;}
.esm-side{background:#fff;border:1px solid #d7dde4;border-radius:9px;overflow:hidden;display:flex;flex-direction:column;align-self:start;}
.esm-side-head{display:flex;align-items:center;gap:8px;padding:10px;background:linear-gradient(to right, #1f3a5f 0%, #245789 100%);color:#fff;font-weight:700;font-size:12px;}
.esm-side-head-icon{width:28px;height:28px;border-radius:6px;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;flex-shrink:0;}
.esm-side-head-title{color:#fff;font-weight:700;font-size:12px;flex:1;}
.esm-side-head-sub{color:#acc5e1;font-size:10px;font-weight:400;}
.esm-side-close{width:28px;height:28px;background:rgba(255,255,255,0.1);border:0;color:rgba(255,255,255,0.5);border-radius:5px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;transition:all 0.2s;flex-shrink:0;}
.esm-side-close:hover{background:rgba(255,255,255,0.2);color:#fff;}
.esm-side-body{padding:10px;flex:1;overflow:auto;max-height:420px;}
.esm-side-footer{padding:10px;border-top:1px solid #e7ecf1;display:flex;gap:8px;justify-content:flex-end;}
.esm-kv-row{display:flex;flex-direction:column;gap:3px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e7ecf1;}
.esm-kv-row:last-child{border:0;margin-bottom:0;padding-bottom:0;}
.esm-kv-key{font-size:10px;font-weight:700;color:#9ba5ae;text-transform:uppercase;letter-spacing:0.5px;}
.esm-kv-val{font-size:12px;font-weight:700;color:#1f2628;}
.esm-kv-val-muted{font-size:12px;color:#9ba5ae;font-weight:400;}
.esm-field-wrap{margin-bottom:10px;}
.esm-label{display:block;font-size:10px;font-weight:700;color:#55606c;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.3px;}
.esm-req{color:#c93535;margin-left:2px;}
.esm-optional{color:#d8dee6;font-weight:400;font-size:9px;margin-left:4px;}
.esm-input{width:100%;height:32px;border:1px solid #d8dee6;border-radius:4px;padding:0 10px;font-size:12px;font-weight:500;background:#f4f7fa;color:#3f4750;outline:none;transition:all 0.2s;}
.esm-input:focus{border-color:#245789;background:#fff;box-shadow:0 0 0 2px rgba(36,87,137,0.1);}
.esm-input::placeholder{color:#9ba5ae;}
.esm-select{width:100%;height:32px;border:1px solid #d8dee6;border-radius:4px;padding:0 10px;font-size:12px;font-weight:500;background:#f4f7fa;color:#3f4750;outline:none;cursor:pointer;appearance:none;padding-right:24px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%233f4750' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;transition:all 0.2s;}
.esm-select:focus{border-color:#245789;background-color:#fff;}
.esm-info-box{background:#d9e8f8;border:1px solid #d6e5f6;border-radius:5px;padding:8px;margin-bottom:10px;}
.esm-info-box-title{font-size:11px;font-weight:700;color:#244565;display:flex;align-items:center;gap:6px;margin-bottom:6px;}
.esm-info-mapping-item{display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid #d6e5f6;border-radius:4px;padding:8px;margin-bottom:6px;font-size:12px;}
.esm-info-mapping-item:last-child{margin-bottom:0;}
.esm-info-mapping-name{font-size:11px;font-weight:700;color:#1f2628;}
.esm-info-mapping-dates{font-size:10px;color:#9ba5ae;}
.esm-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:30px;min-width:60px;padding:0 12px;border:0;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.2s;outline:none;}
.esm-btn.primary{background:#245789;color:#fff;box-shadow:0 2px 4px rgba(36,87,137,0.2);}
.esm-btn.primary:hover{background:#1e4a6f;box-shadow:0 4px 8px rgba(36,87,137,0.3);}
.esm-btn.primary:active{background:#173859;}
.esm-btn.ghost{background:#fff;border:1px solid #d8dee6;color:#58626d;}
.esm-btn.ghost:hover{background:#f4f7fa;border-color:#9ba5ae;}
.esm-btn.ghost:active{background:#e8ecf1;}
.esm-btn.danger{background:#c93535;color:#fff;box-shadow:0 2px 4px rgba(201,53,53,0.2);}
.esm-btn.danger:hover{background:#a82d2d;}
.esm-btn.danger:active{background:#8b2525;}
.esm-overlay{position:fixed;inset:0;background:rgba(31,38,46,0.45);backdrop-filter:blur(1px);display:flex;align-items:center;justify-content:center;z-index:1300;padding:16px;}
.esm-modal{background:#fff;border-radius:9px;overflow:hidden;width:100%;max-width:512px;box-shadow:0 12px 32px rgba(0,0,0,0.15);}
.esm-modal.small{max-width:384px;}
.esm-modal-head{display:flex;align-items:center;gap:10px;padding:12px;border-bottom:1px solid #e7ecf1;}
.esm-modal-head-icon{width:26px;height:26px;border-radius:50%;background:#d9ebfa;color:#245789;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;}
.esm-modal-head-icon.warn{background:#fadada;color:#c93535;}
.esm-modal-head-title{font-weight:700;color:#1f2628;font-size:13px;flex:1;}
.esm-modal-head-close{border:0;background:transparent;color:#8e98a2;font-size:16px;cursor:pointer;padding:0;width:24px;height:24px;display:flex;align-items:center;justify-content:center;transition:color 0.2s;}
.esm-modal-head-close:hover{color:#3f4750;}
.esm-modal-body{padding:12px;}
.esm-modal-footer{padding:10px;border-top:1px solid #e7ecf1;display:flex;gap:8px;justify-content:flex-end;}
.esm-warn-box{border:1px solid #f1cccc;background:#fff5f5;border-radius:5px;padding:8px;color:#de5d5d;font-size:12px;font-weight:700;margin-bottom:8px;text-align:center;}
`;

export const esm = {
  wrap: 'esm-wrap',
  head: 'esm-head',
  headIconWrap: 'esm-head-icon-wrap',
  headTextWrap: 'esm-head-text-wrap',
  headTitle: 'esm-head-title',
  headSub: 'esm-head-sub',
  errorBanner: 'esm-error-banner',
  grid: 'esm-grid',
  card: 'esm-card',
  filtersBar: 'esm-filters-bar',
  searchWrap: 'esm-search-wrap',
  searchIcon: 'esm-search-icon',
  searchInput: 'esm-search-input',
  filterSelect: 'esm-filter-select',
  btnClear: 'esm-btn-clear',
  btnAssign: 'esm-btn-assign',
  btnAssignPlus: 'esm-btn-assign-plus',
  tableWrap: 'esm-table-wrap',
  table: 'esm-table',
  thead: 'esm-thead',
  th: 'esm-th',
  tr: 'esm-tr',
  trActive: 'esm-tr active',
  td: 'esm-td',
  tdLast: 'esm-td',
  empCell: 'esm-emp-cell',
  empAvatar: 'esm-emp-avatar',
  empName: 'esm-emp-name',
  shiftBadge: 'esm-shift-badge',
  shiftBadgeDot: 'esm-shift-badge-dot',
  dateCell: 'esm-date-cell',
  dateCellIcon: 'esm-date-cell-icon',
  rowActions: 'esm-row-actions',
  actEdit: 'esm-act-edit',
  actDelete: 'esm-act-delete',
  stateWrap: 'esm-state-wrap',
  stateIcon: 'esm-state-icon',
  stateTitle: 'esm-state-title',
  stateSub: 'esm-state-sub',
  loadingState: 'esm-loading-state',
  side: 'esm-side',
  sideHead: 'esm-side-head',
  sideHeadIcon: 'esm-side-head-icon',
  sideHeadTitle: 'esm-side-head-title',
  sideHeadSub: 'esm-side-head-sub',
  sideClose: 'esm-side-close',
  sideBody: 'esm-side-body',
  sideFoot: 'esm-side-footer',
  kvRow: 'esm-kv-row',
  kvKey: 'esm-kv-key',
  kvVal: 'esm-kv-val',
  kvValMuted: 'esm-kv-val-muted',
  fieldWrap: 'esm-field-wrap',
  label: 'esm-label',
  req: 'esm-req',
  optional: 'esm-optional',
  input: 'esm-input',
  select: 'esm-select',
  selectInput: 'esm-select',
  infoBox: 'esm-info-box',
  infoBoxTitle: 'esm-info-box-title',
  infoMappingItem: 'esm-info-mapping-item',
  infoMappingName: 'esm-info-mapping-name',
  infoMappingDates: 'esm-info-mapping-dates',
  btnPrimary: 'esm-btn primary',
  btnGhost: 'esm-btn ghost',
  btnDanger: 'esm-btn danger',
  btnDelete: 'esm-btn danger',
  overlay: 'esm-overlay',
  modal: 'esm-modal',
  modalSm: 'esm-modal small',
  modalHead: 'esm-modal-head',
  modalHeadIcon: 'esm-modal-head-icon',
  modalHeadTitle: 'esm-modal-head-title',
  modalHeadClose: 'esm-modal-head-close',
  modalBody: 'esm-modal-body',
  modalFoot: 'esm-modal-footer',
  warnBox: 'esm-warn-box',
  modalIco: 'esm-modal-head-icon',
  modalIcoWarn: 'warn',
};