"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/dashboardlayout";
import { RefreshCcw } from "lucide-react";
import { FaUsers } from "react-icons/fa";
import { apiService, UserRole, AdminDesignation, AgentType, RecoveryAgentGroup, Region, Agent } from "@/services/api";
import { useAgents } from "@/hooks/useAgents";
import { useToastNotifications } from "@/hooks/useToastNotifications";

const formatPhoneNumber = (phone: string): string => {
  const cleanNumber = phone.replace(/\s/g, "");
  if (cleanNumber.startsWith("+254") && cleanNumber.length >= 13) {
    return cleanNumber.replace(/(\+254)(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4").trim();
  } else if ((cleanNumber.startsWith("01") || cleanNumber.startsWith("07")) && cleanNumber.length >= 10) {
    return cleanNumber.replace(/(0[17])(\d{2})(\d{3})(\d{3})/, "$1$2 $3 $4").trim();
  } else if ((cleanNumber.startsWith("1") || cleanNumber.startsWith("7")) && cleanNumber.length >= 9) {
    return cleanNumber.replace(/([17])(\d{4})(\d{4})/, "$1 $2 $3").trim();
  }
  return phone;
};

export default function UserManagementPage() {
  const { agents, total, loading, error, refresh, currentUser } = useAgents({ page: 1, size: 15 });
  const { showSuccess, showError, showWarning } = useToastNotifications();
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    personal_phone: "",
    role: "agent" as UserRole,
    designation: "call-center-admin" as AdminDesignation,
    agent_type: "recovery-agent" as AgentType,
    group: "CC1" as RecoveryAgentGroup,
    region: "A" as Region,
    extension: "",
    sip_username: "",
    sip_password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  const validateExtension = async (extension: string): Promise<boolean> => {
    if (!extension) {
      const msg = "Extension is required for agents";
      setFormError(msg);
      showWarning('Validation Error', msg);
      return false;
    }
    try {
      const agents = await apiService.getAgents();
      if (agents.some((agent) => agent.extension === extension)) {
        const msg = "Extension already exists";
        setFormError(msg);
        showError('Duplicate Extension', msg);
        return false;
      }
      return true;
    } catch (err) {
      const msg = "Failed to validate extension";
      setFormError(msg);
      showError('Validation Failed', msg);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (formData.role === "agent" && !(await validateExtension(formData.extension))) {
        return;
      }

      let userData: any;
      let agentData: any | null = null;
      if (currentUser?.role === "super-admin") {
        userData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password || "defaultPassword123!",
          personal_phone: formData.personal_phone || null,
          role: formData.role,
          // VoIP credentials
          sip_username: formData.sip_username || null,
          sip_password: formData.sip_password || null,
          extension: formData.extension || null,
          ...(formData.role === "admin" && { designation: formData.designation }),
        };
        if (formData.role === "agent") {
          agentData = {
            personal_phone: formData.personal_phone || null,
            agent_type: formData.agent_type,
            ...(formData.agent_type === "recovery-agent" && { group: formData.group }),
            ...(formData.agent_type === "marketing-agent" && { region: formData.region }),
            status: "offline",
            is_logged_in: false,
            max_concurrent_calls: 1,
            auto_answer: false,
            call_recording_enabled: true,
          };
        }
      } else {
        let agentType: AgentType;
        switch (currentUser?.designation) {
          case "call-center-admin":
            agentType = "recovery-agent";
            break;
          case "marketing-admin":
            agentType = "marketing-agent";
            break;
          case "compliance-admin":
            agentType = "compliance-agent";
            break;
          default:
            throw new Error("Invalid admin designation");
        }
        userData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password || "defaultPassword123!",
          personal_phone: formData.personal_phone || null,
          role: "agent",
          // VoIP credentials
          sip_username: formData.sip_username || null,
          sip_password: formData.sip_password || null,
          extension: formData.extension || null,
        };
        agentData = {
          personal_phone: formData.personal_phone || null,
          agent_type: agentType,
          ...(agentType === "recovery-agent" && { group: formData.group }),
          ...(agentType === "marketing-agent" && { region: formData.region }),
          status: "offline",
          is_logged_in: false,
          max_concurrent_calls: 1,
          auto_answer: false,
          call_recording_enabled: true,
        };
      }

      console.log("Sending payload:", JSON.stringify({ user_data: userData, agent_data: agentData }, null, 2));
      const response = await apiService.createUser({ user_data: userData, agent_data: agentData });
      if (userData.role === "agent" && !response.agent_profile) {
        const msg = "Agent profile was not created";
        setFormError(msg);
        showError('Creation Failed', msg);
        return;
      }
      
      showSuccess('User Created', `Successfully created ${userData.role}: ${userData.first_name} ${userData.last_name}`);
      setShowAddUserForm(false);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        personal_phone: "",
        role: "agent",
        designation: "call-center-admin",
        agent_type: "recovery-agent",
        group: "CC1",
        region: "A",
        extension: "",
        sip_username: "",
        sip_password: "",
      });
      refresh();
    } catch (err: any) {
      console.error("Error creating user:", err);
      const errorMsg = err.message || "Failed to create user";
      setFormError(errorMsg);
      showError('Creation Failed', errorMsg);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "super-admin":
        return <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-purple-500 border border-purple-600">Super Admin</span>;
      case "admin":
        return <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-blue-500 border border-blue-600">Admin</span>;
      case "agent":
        return <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-green-500 border border-green-600">Agent</span>;
      default:
        return <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-gray-500 border border-gray-600">Viewer</span>;
    }
  };

  const getAgentTypeBadge = (agent: Agent) => {
    const agentType = agent.agent_type as AgentType | undefined;
    switch (agentType) {
      case "recovery-agent":
        return <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-orange-500 border border-orange-600">Recovery</span>;
      case "marketing-agent":
        return <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-teal-500 border border-teal-600">Marketing</span>;
      case "compliance-agent":
        return <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-yellow-500 border border-yellow-600">Compliance</span>;
      default:
        return <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-gray-500 border border-gray-600">Unknown</span>;
    }
  };

  return (
    <DashboardLayout title="Agent Management">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-sky-400">Agent Management</h2>
          <button
            className="px-4 py-2 text-sm text-white bg-sky-600 hover:bg-sky-700 border border-sky-700"
            onClick={() => setShowAddUserForm(!showAddUserForm)}
          >
            {showAddUserForm ? "Cancel" : "Add Agent"}
          </button>
        </div>

        {showAddUserForm && (
          <div className="bg-slate-800 border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-sky-400 mb-4">Add New Agent</h3>
            {formError && (
              <div className="mb-4 text-red-400 text-sm">{formError}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="personal_phone"
                  value={formData.personal_phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white"
                />
              </div>

              {currentUser?.role === "super-admin" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white"
                  >
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                    <option value="super-admin">Super Admin</option>
                  </select>
                </div>
              )}

              {currentUser?.role === "super-admin" && formData.role === "admin" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Designation</label>
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white"
                  >
                    <option value="call-center-admin">Call Center Admin</option>
                    <option value="marketing-admin">Marketing Admin</option>
                    <option value="compliance-admin">Compliance Admin</option>
                  </select>
                </div>
              )}

              {formData.role === "agent" && currentUser?.role === "super-admin" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Agent Type</label>
                  <select
                    name="agent_type"
                    value={formData.agent_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white"
                  >
                    <option value="recovery-agent">Recovery Agent</option>
                    <option value="marketing-agent">Marketing Agent</option>
                    <option value="compliance-agent">Compliance Agent</option>
                  </select>
                </div>
              )}

              {(formData.role === "agent" && currentUser?.role === "super-admin" && formData.agent_type === "recovery-agent") ||
              (currentUser?.designation === "call-center-admin" && formData.agent_type === "recovery-agent") ? (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Group</label>
                  <select
                    name="group"
                    value={formData.group}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white"
                  >
                    <option value="CC1">CC1</option>
                    <option value="CC2">CC2</option>
                    <option value="Field">Field</option>
                    <option value="IDC">IDC</option>
                  </select>
                </div>
              ) : null}

              {(formData.role === "agent" && currentUser?.role === "super-admin" && formData.agent_type === "marketing-agent") ||
              (currentUser?.designation === "marketing-admin" && formData.agent_type === "marketing-agent") ? (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Region</label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white"
                  >
                    <option value="A">Region A</option>
                    <option value="B">Region B</option>
                    <option value="C">Region C</option>
                    <option value="D">Region D</option>
                    <option value="E">Region E</option>
                  </select>
                </div>
              ) : null}

              {formData.role === "agent" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Extension</label>
                    <input
                      type="text"
                      name="extension"
                      value={formData.extension}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white"
                      required
                      placeholder="e.g., 1001"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">SIP Username</label>
                    <input
                      type="text"
                      name="sip_username"
                      value={formData.sip_username}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white"
                      placeholder="e.g., 69gZATkwyw"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">SIP Password</label>
                    <input
                      type="password"
                      name="sip_password"
                      value={formData.sip_password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white"
                      placeholder="VoIP password"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm text-white bg-slate-700 border border-slate-600 hover:bg-slate-600"
                  onClick={() => setShowAddUserForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-sky-600 hover:bg-sky-700 border border-sky-700"
                >
                  Add Agent
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-slate-800 border border-slate-700">
          <div className="flex justify-between px-4 py-3 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-sky-400">Agents</h3>
            <button
              className="px-2 py-1 text-xs text-white hover:text-slate-600"
              onClick={refresh}
            >
              <RefreshCcw className="w-3 h-3 mr-1 inline" />
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-400">Loading agents...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-400">
              Error: {error}
              {error.includes("Unauthorized") && (
                <div className="mt-2">
                  <button
                    className="px-4 py-2 text-sm text-white bg-sky-600 hover:bg-sky-700 border border-sky-700"
                    onClick={() => window.location.href = "/login"}
                  >
                    Log In Again
                  </button>
                </div>
              )}
            </div>
          ) : !agents || agents.length === 0 ? (
            <div className="p-6 text-center text-slate-400">No agents available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-slate-200 bg-slate-700">
                    <th className="border border-slate-600 px-4 py-2 text-sky-300">Name</th>
                    <th className="border border-slate-600 px-4 py-2 text-sky-300">Email</th>
                    <th className="border border-slate-600 px-4 py-2 text-sky-300">Phone</th>
                    <th className="border border-slate-600 px-4 py-2 text-sky-300">Role</th>
                    <th className="border border-slate-600 px-4 py-2 text-sky-300">Details</th>
                    <th className="border border-slate-600 px-4 py-2 text-sky-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id} className="text-white hover:bg-slate-700">
                      <td className="p-2 border border-slate-600">
                        {agent.first_name} {agent.last_name}
                      </td>
                      <td className="p-2 border border-slate-600">{agent.email}</td>
                      <td className="p-2 border border-slate-600">{agent.personal_phone ? formatPhoneNumber(agent.personal_phone) : "N/A"}</td>
                      <td className="p-2 border border-slate-600">{getRoleBadge("agent")}</td>
                      <td className="p-2 border border-slate-600">
                        <div className="text-xs">
                          {getAgentTypeBadge(agent)}
                          {agent.agent_type === "recovery-agent" && (
                            <div className="mt-1">Group: {agent.group || "N/A"}</div>
                          )}
                          {agent.agent_type === "marketing-agent" && (
                            <div className="mt-1">Region: {agent.region || "N/A"}</div>
                          )}
                          <div className="mt-1">Ext: {agent.extension || "N/A"}</div>
                        </div>
                      </td>
                      <td className="p-2 border border-slate-600">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-semibold text-white ${
                            agent.status === "available" ? "bg-green-500 border border-green-600" : "bg-red-500 border border-red-600"
                          }`}
                        >
                          {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}