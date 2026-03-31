export const masterConfigCss = `
.mc-wrap{padding:20px 12px 18px 20px;background:#edf1f5;min-height:calc(100vh - 58px);}
.mc-head{display:flex;align-items:center;gap:10px;font-size:22px;font-weight:700;color:#30363d;margin:0 0 12px;line-height:1;}
.mc-head-title{font-size:inherit;font-weight:700;}
.mc-grid{display:grid;grid-template-columns:minmax(0,1fr) 390px;gap:10px;align-items:start;}
.mc-card{background:#fff;border:1px solid #d7dde4;border-radius:9px;overflow:hidden;}
.mc-tabs{display:flex;gap:8px;padding:10px 12px;border-bottom:1px solid #e8edf2;}
.mc-tab{border:0;background:transparent;color:#66707a;font-size:14px;font-weight:700;padding:6px 10px;border-radius:4px;}
.mc-tab.active{background:#d9e8f8;color:#244565;}
.mc-tools{display:flex;justify-content:space-between;gap:10px;padding:10px 12px;border-bottom:1px solid #edf1f5;}
.mc-search{position:relative;width:260px;}
.mc-search i{position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:12px;color:#9ba5ae;}
.mc-search input{width:100%;height:34px;border:1px solid #d8dee6;border-radius:4px;padding:0 10px 0 28px;font-size:14px;}
.mc-btn-add{height:34px;border:0;border-radius:4px;background:#245789;color:#fff;font-size:13px;font-weight:700;padding:0 14px;}
.mc-table-wrap{padding:0 8px 10px;max-height:560px;overflow:auto;}
.mc-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #d8dee6;border-radius:8px;overflow:hidden;}
.mc-table th{background:#edf1f4;border-bottom:1px solid #d8dee6;color:#404952;font-size:15px;font-weight:700;padding:10px 11px;}
.mc-table td{border-bottom:1px solid #eceff3;color:#434a52;font-size:14px;padding:9px 11px;}
.mc-table tbody tr:hover td{background:#f5f9fd;}
.mc-table tr:last-child td{border-bottom:0;}
.mc-row-active td{background:#c9dcf1;}
.mc-empty{text-align:center;color:#8f99a2;padding:16px 0!important;}
.mc-badge{display:inline-flex;align-items:center;justify-content:center;height:22px;min-width:30px;padding:0 8px;border-radius:999px;background:#d9e8f7;color:#365676;font-weight:700;font-size:13px;}
.mc-actions{display:flex;gap:10px;align-items:center;}
.mc-act{border:0;background:transparent;padding:0;color:#9eb0bf;font-size:14px;}
.mc-side{background:#fff;border:1px solid #d7dde4;border-radius:9px;display:flex;flex-direction:column;align-self:start;min-height:0;max-height:none;}
.mc-side-head{display:flex;align-items:center;gap:8px;padding:10px 10px;border-bottom:1px solid #e7ecf1;font-weight:700;color:#333c45;}
.mc-side-head .mc-ico{width:26px;height:26px;border-radius:50%;background:#d9ebfa;color:#2a5a86;display:flex;align-items:center;justify-content:center;}
.mc-side-body{padding:10px;flex:0 1 auto;max-height:420px;overflow:auto;}
.mc-field-label{font-size:12px;color:#55606c;font-weight:700;margin:0 0 3px;}
.mc-field-val{font-size:13px;color:#4a5158;margin:0 0 8px;}
.mc-kv{display:grid;grid-template-columns:120px minmax(0,1fr);gap:10px;align-items:start;margin:0 0 8px;}
.mc-kv-key{font-size:12px;color:#55606c;font-weight:700;}
.mc-kv-val{font-size:13px;color:#4a5158;text-align:left;word-break:break-word;}
.mc-input,.mc-textarea,.mc-select{width:100%;border:1px solid #d8dee6;border-radius:5px;background:#f4f7fa;color:#3f4750;padding:0 10px;font-size:13px;}
.mc-input,.mc-select{height:32px;}
.mc-textarea{height:62px;padding:8px 10px;resize:vertical;}
.mc-sub-add{display:grid;grid-template-columns:1fr 70px;gap:6px;margin-bottom:6px;}
.mc-sub-item{min-height:34px;border:1px solid #d8dee6;border-radius:5px;background:#f4f7fa;color:#3f4750;display:flex;align-items:center;justify-content:space-between;padding:4px 8px;margin-bottom:6px;font-size:13px;line-height:1.25;}
.mc-sub-item--readonly{justify-content:flex-start;word-break:break-word;}
.mc-sub-item button{border:0;background:transparent;color:#ef6d6d;padding:0;}
.mc-side-footer{padding:10px;border-top:1px solid #e7ecf1;display:flex;gap:8px;}
.mc-btn{border:0;border-radius:4px;height:30px;min-width:88px;font-size:12px;font-weight:700;}
.mc-btn.primary{background:#245789;color:#fff;}
.mc-btn.ghost{background:#fff;border:1px solid #d8dee6;color:#58626d;}
.mc-overlay{position:fixed;inset:0;background:rgba(31,38,46,.45);display:flex;align-items:center;justify-content:center;z-index:1200;}
.mc-modal{width:min(620px,92vw);background:#fff;border:1px solid #d7dde4;border-radius:9px;overflow:hidden;}
.mc-modal.small{width:min(470px,92vw);}
.mc-modal-head{display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid #e7ecf1;font-weight:700;color:#333b45;}
.mc-modal-head .mc-ico{width:26px;height:26px;border-radius:50%;background:#d9ebfa;color:#2a5a86;display:inline-flex;align-items:center;justify-content:center;margin-right:8px;}
.mc-modal-head .warn{background:#f9dddd;color:#cb3a3a;}
.mc-modal-head button{border:0;background:transparent;color:#8e98a2;font-size:16px;}
.mc-modal-body{padding:10px;}
.mc-warn-box{border:1px solid #f1cccc;background:#fff5f5;border-radius:5px;padding:8px;color:#de5d5d;font-size:12px;font-weight:700;margin-top:8px;text-align:center;}
.mc-info-box{border:1px solid #d6e5f6;background:#d9e8f8;border-radius:5px;padding:8px;font-size:12px;color:#37414c;line-height:1.7;}
.mc-modal-foot{padding:10px;border-top:1px solid #e7ecf1;display:flex;gap:8px;justify-content:flex-end;}
.mc-btn.delete{background:#c93535;color:#fff;}
@media (max-width:1200px){.mc-head{font-size:40px;}}
@media (max-width:1100px){.mc-grid{grid-template-columns:1fr;}.mc-side{min-height:auto;max-height:none;}}
`;
