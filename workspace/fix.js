const fs = require('fs');
let file = fs.readFileSync('./pages/Admin/AdminUserManagement.tsx', 'utf8');
const loginButtonRegex = /[ \t]*\{admin\?\.role === UserRole\.SUPERADMIN && \([\s\S]*?<LogIn size=\{14\} \/>[\s\S]*?<\/button>\n[ \t]*\)\}\n/;
const matched = file.match(loginButtonRegex);
if (matched) {
    file = file.replace(loginButtonRegex, '');
    file = file.replace(/([ \t]*<button[ \t\n]*onClick=\{\(\) => setEditUser\(u\)\})/, matched[0] + "$1");
    fs.writeFileSync('./pages/Admin/AdminUserManagement.tsx', file);
    console.log("Success");
} else {
    console.log("Not found");
}
