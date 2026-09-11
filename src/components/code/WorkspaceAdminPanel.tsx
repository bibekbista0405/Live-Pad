import React, { useState, useEffect } from 'react';
import { Shield, Users, Lock, Check, X, UserCheck } from 'lucide-react';
import { granularPermissionService } from '../../services/granularPermissionService';
import { GranularRole, PermissionMatrix, AuditLogEntry } from '../../types/phase4';

export function WorkspaceAdminPanel() {
  const [currentRole, setCurrentRole] = useState<GranularRole>('owner');
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const role = granularPermissionService.getCurrentRole();
    setCurrentRole(role);
    setMatrix(granularPermissionService.getPermissionsForRole(role));
    setAuditLogs(granularPermissionService.getAuditLogs());
  };

  const handleRoleChange = (role: GranularRole) => {
    granularPermissionService.setRole(role);
    setCurrentRole(role);
    setMatrix(granularPermissionService.getPermissionsForRole(role));
    setAuditLogs([...granularPermissionService.getAuditLogs()]);
  };

  if (!matrix) return null;

  const roles: GranularRole[] = ['owner', 'admin', 'maintainer', 'developer', 'reviewer', 'commenter', 'viewer', 'guest'];

  return (
    <div className="flex-1 h-full bg-[#1e1e1e] text-slate-300 flex flex-col font-sans select-none overflow-hidden border-r border-[#252526]">
      {/* Header */}
      <div className="p-3 bg-[#252526] border-b border-[#2d2d2d] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-xs uppercase tracking-wide text-white">Security & Granular Permissions</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Role Switcher */}
        <div className="bg-[#252526] p-3 rounded-lg border border-[#333333] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-purple-400" /> Current Active Role
            </span>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 font-mono px-2 py-0.5 rounded uppercase font-bold">
              {currentRole}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`py-1 px-2 rounded text-[11px] font-semibold text-center border transition-all cursor-pointer capitalize ${
                  currentRole === role
                    ? 'bg-purple-600 text-white border-purple-500'
                    : 'bg-[#1e1e1e] border-[#333333] text-[#858585] hover:text-white hover:border-[#444444]'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="bg-[#252526] p-3 rounded-lg border border-[#333333] space-y-2">
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#007acc]" /> Permission Matrix for <span className="capitalize text-purple-300">{currentRole}</span>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div className="p-2 bg-[#1e1e1e] rounded border border-[#2d2d2d] flex items-center justify-between">
              <span>Edit Workspace Settings</span>
              {matrix.workspace.edit ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
            </div>
            <div className="p-2 bg-[#1e1e1e] rounded border border-[#2d2d2d] flex items-center justify-between">
              <span>Create / Edit Code Files</span>
              {matrix.files.edit ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
            </div>
            <div className="p-2 bg-[#1e1e1e] rounded border border-[#2d2d2d] flex items-center justify-between">
              <span>Git Commit & Push Privileges</span>
              {matrix.git.push ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
            </div>
            <div className="p-2 bg-[#1e1e1e] rounded border border-[#2d2d2d] flex items-center justify-between">
              <span>Execute Terminal Commands</span>
              {matrix.terminal.executeCommands ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
            </div>
            <div className="p-2 bg-[#1e1e1e] rounded border border-[#2d2d2d] flex items-center justify-between">
              <span>AI Code Generation & High-Cost Models</span>
              {matrix.ai.highCostModels ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
            </div>
            <div className="p-2 bg-[#1e1e1e] rounded border border-[#2d2d2d] flex items-center justify-between">
              <span>Manage Workspace Members & Billing</span>
              {matrix.admin.manageMembers ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-red-400" />}
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-[#252526] p-3 rounded-lg border border-[#333333] space-y-2">
          <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" /> Security Audit Log
          </div>

          <div className="space-y-2 pt-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-2 bg-[#1e1e1e] rounded border border-[#2d2d2d] space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-white">{log.action}</span>
                  <span className="text-[9px] bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded font-mono uppercase">{log.category}</span>
                </div>
                <div className="text-[10px] text-[#858585]">{log.details}</div>
                <div className="text-[9px] text-[#666666] flex items-center justify-between font-mono pt-0.5">
                  <span>{log.actor}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
