const fs = require('fs');
const path = require('path');
const file = path.resolve('src/MainComponents/Calendar/Tasks/taskPage/TaskPageLayout.js');
let content = fs.readFileSync(file, 'utf8');

const targetStr = `            <div className="card-header">
              <div className="task-modal-header">
                <h3 className="task-modal-title">{title}</h3>
                <button className="btn btn-tool task-modal-close" onClick={onClose} type="button">
                  <i className="fas fa-times" />
                </button>
              </div>
            </div>`;

const replaceStr = `            <div className="card-header">
              <div className="task-modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h3 className="task-modal-title">{title}</h3>
                  {priority && (
                    <span className={\`task-priority-badge \${String(priority).toLowerCase()}\`}>
                      {priority} {String(priority).toLowerCase().includes("priority") ? "" : "Priority"}
                    </span>
                  )}
                  {status && (
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
            </div>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(file, content);
  console.log("Success: Replaced header markup");
} else {
  console.log("Error: Target string not found in file. It might have different line endings or spacing.");
  // try regex
  const regex = /<div className="card-header">[\s\S]*?<div className="task-modal-header">[\s\S]*?<h3 className="task-modal-title">\{title\}<\/h3>[\s\S]*?<button className="btn btn-tool task-modal-close" onClick=\{onClose\} type="button">[\s\S]*?<i className="fas fa-times" \/>[\s\S]*?<\/button>[\s\S]*?<\/div>[\s\S]*?<\/div>/;
  if(regex.test(content)) {
     content = content.replace(regex, replaceStr);
     fs.writeFileSync(file, content);
     console.log("Success: Replaced using regex");
  } else {
     console.log("Error: Target could not be matched even with Regex!");
  }
}
