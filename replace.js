const fs = require('fs');
const file = 'pages/Admin/AdminRolePermissions.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/key\.replace\(\/\(\[A\-Z\]\)\/g, ' \$1'\)\.trim\(\)/g, "(key === 'myNotice' ? 'Notifications' : key.replace(/([A-Z])/g, ' $1').trim())");
fs.writeFileSync(file, content);
