const fs = require('fs');
let file = fs.readFileSync('pages/Admin/AdminUserManagement.tsx', 'utf8');

const s1 = '<Ban size={18} /></button>';
const s2 = '</Card>';

const i1 = file.indexOf(s1);
const i2 = file.indexOf(s2, i1);

const part1 = file.substring(0, i1 + s1.length);
const part2 = file.substring(i2 + s2.length);

const middle = `
                           <button onClick={() => setEditUser(u)} disabled={u.role === UserRole.SUPERADMIN && !isSuperAdminViewer} title="Edit User" className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-20"><Edit2 size={18} /></button>
                           
                           {isSuperAdminViewer && (
                             <button onClick={() => setPwdUser(u)} disabled={u.role === UserRole.SUPERADMIN && !isSuperAdminViewer} title="Change Password" className="p-2 text-slate-300 dark:text-slate-600 hover:text-orange-500 dark:hover:text-orange-400 transition-colors disabled:opacity-20"><Key size={18} /></button>
                           )}
                           
                           <button onClick={() => setDeleteUserId(u.id)} disabled={u.role === UserRole.SUPERADMIN || u.email === admin?.email} title="Delete User" className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-0 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Mobile View */}
        <div className="lg:hidden space-y-4 pb-20">
           {filteredUsers.map((u) => {
              const count = userRankMap[u.id] || 0;
              const rank = getRankData(count);
              return (
                <Card key={u.id} className="p-3 sm:p-4 rounded-[2rem] border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 transition-colors">
                   <div className="flex items-start gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className={clsx(
                        "w-12 h-12 flex-none rounded-xl overflow-hidden shadow-sm flex items-center justify-center relative transition-all",
                        rank ? \`ring-2 \${rank.color.replace('text-', 'ring-')} ring-offset-2 dark:ring-offset-slate-900\` : "bg-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-800"
                      )}>
                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon size={24} className="text-slate-300 dark:text-slate-600" />}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                         <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-black text-slate-900 dark:text-white text-base truncate transition-colors">{u.name}</p>
                            {(() => {
                              const badgeClr = getBadgeColor(u);
                              return badgeClr && <BadgeCheck className={clsx(badgeClr, "flex-shrink-0")} size={16} />;
                            })()}
                         </div>
                         <div className="flex items-center gap-1.5 mt-0.5">
                            <Mail size={12} className="text-slate-400 flex-shrink-0" />
                            <p className="text-[11px] text-slate-500 font-bold truncate transition-colors">{u.email}</p>
                         </div>
                         <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1"><Fingerprint size={10} className="text-slate-400"/>{u.idNumber || 'N/A'}</span>
                            {rank && <Badge className={clsx("text-[8px] py-0 px-1 font-black", rank.bg, rank.color)}>{rank.name}</Badge>}
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-[#1a2335] rounded-xl border border-slate-800 shadow-inner">
                      <div className="flex items-center gap-2">
                         <ShieldCheck size={14} className="text-red-500" />
                         <span className="text-[11px] font-bold text-slate-100 truncate">{u.bloodGroup || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <MapPin size={14} className="text-blue-500" />
                         <span className="text-[11px] font-bold text-slate-100 truncate">{u.location}</span>
                      </div>
                   </div>

                   {/* Footer Action Section */}
                   <div className="flex flex-row items-stretch gap-2 mt-2 pt-2 border-t border-slate-800/50">
                      {/* Role Selection Box */}
                      <div className="flex-1 bg-[#161e31] px-2 py-1.5 rounded-lg border border-slate-800 flex flex-col justify-center gap-0.5">
                         <div className="flex items-center gap-1.5 mb-1">
                           <ShieldCheck size={10} className="text-slate-500" />
                           <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest leading-none">Account Role</span>
                         </div>
                         <div className="relative">
                           <select 
                             value={u.role} 
                             onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)} 
                             disabled={(u.role === UserRole.SUPERADMIN && !isSuperAdminViewer) || (u.email === ADMIN_EMAIL)}
                             className={clsx(
                               "w-full bg-transparent border rounded px-2 py-1 font-black text-[9px] uppercase tracking-[0.1em] outline-none cursor-pointer disabled:opacity-50 appearance-none pr-6",
                               u.role === UserRole.SUPERADMIN ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800" :
                               u.role === UserRole.ADMIN ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" :
                               u.role === UserRole.EDITOR ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800" :
                               "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                             )}
                           >
                            {Object.values(UserRole).filter(r => r !== UserRole.SUPERADMIN || isSuperAdminViewer).map(r => (
                              <option key={r} value={r} className="bg-slate-900 text-white">{r}</option>
                            ))}
                          </select>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <MoreVertical size={12} />
                          </div>
                        </div>
                     </div>
                     
                     {/* Action Grid */}
                     <div className="grid grid-cols-4 gap-1.5 self-center flex-none w-[140px]">
                        {isSuperAdminViewer && (
                          <button 
                            onClick={() => navigate('/role-permissions', { state: { selectedUserId: u.id } })}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-green-500 hover:bg-green-500/10 transition-all active:scale-90"
                          >
                            <Settings size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => navigate(\`/admin/verify/\${u.idNumber || u.phone}\`, { state: { fromAdminUsers: true } })}
                          title="Verify Identity"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-indigo-500 hover:bg-indigo-500/10 transition-all active:scale-90"
                        >
                          <BadgeCheck size={14} />
                        </button>
                        <button 
                          onClick={() => setSuspendUserId({id: u.id, current: !!u.isSuspended})} 
                          disabled={u.role === UserRole.SUPERADMIN}
                          className={clsx(
                            "w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 transition-all active:scale-90",
                            u.isSuspended ? "text-green-500 hover:bg-green-500/10" : "text-red-500 hover:bg-red-500/10"
                          )}
                        >
                          <Ban size={14} />
                        </button>
                        {admin?.role === UserRole.SUPERADMIN && (
                          <button 
                            onClick={() => { impersonateUser(u); showToast(\`Logged in as \${u.name}\`); navigate('/'); }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-indigo-500 hover:bg-indigo-500/10 transition-all active:scale-90"
                          >
                            <LogIn size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => setEditUser(u)} 
                          disabled={u.role === UserRole.SUPERADMIN && !isSuperAdminViewer}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-blue-500 hover:bg-blue-500/10 transition-all active:scale-90"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => setPwdUser(u)} 
                          disabled={!isSuperAdminViewer || (u.role === UserRole.SUPERADMIN && !isSuperAdminViewer)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-orange-500 hover:bg-orange-500/10 transition-all active:scale-90"
                        >
                          <Key size={14} />
                        </button>
                        <button 
                          onClick={() => setDeleteUserId(u.id)} 
                          disabled={u.role === UserRole.SUPERADMIN || u.email === admin?.email}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                        >
                          <Trash2 size={14} />
                        </button>
                     </div>
                  </div>
                </Card>
`;

fs.writeFileSync('pages/Admin/AdminUserManagement.tsx', part1 + middle + part2);
console.log('Restored fully!');
