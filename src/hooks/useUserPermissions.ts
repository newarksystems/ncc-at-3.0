import { useState, useEffect } from 'react';
import { User, UserRole, AdminDesignation } from '@/services/api';

// Mock current user data for demonstration
// In a real application, this would come from authentication context
const MOCK_CURRENT_USER: User = {
  id: "current-user-id",
  first_name: "John",
  last_name: "Admin",
  email: "admin@example.com",
  phone_number: "+1234567890",
  role: "admin",
  designation: "call-center-admin",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_login: new Date().toISOString(),
  is_active: true,
  full_name: "John Admin"
} as User;

export const useUserPermissions = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching current user data
    setTimeout(() => {
      setCurrentUser(MOCK_CURRENT_USER);
      setLoading(false);
    }, 500);
  }, []);

  const isSuperAdmin = () => {
    return currentUser?.role === 'super-admin';
  };

  const isCallCenterAdmin = () => {
    return currentUser?.role === 'admin' && (currentUser as any).designation === 'call-center-admin';
  };

  const isMarketingAdmin = () => {
    return currentUser?.role === 'admin' && (currentUser as any).designation === 'marketing-admin';
  };

  const isComplianceAdmin = () => {
    return currentUser?.role === 'admin' && (currentUser as any).designation === 'compliance-admin';
  };

  const canManageUsers = () => {
    return isSuperAdmin() || isCallCenterAdmin() || isMarketingAdmin() || isComplianceAdmin();
  };

  const canManageRecoveryAgents = () => {
    return isSuperAdmin() || isCallCenterAdmin();
  };

  const canManageMarketingAgents = () => {
    return isSuperAdmin() || isMarketingAdmin();
  };

  const canManageComplianceAgents = () => {
    return isSuperAdmin() || isComplianceAdmin();
  };

  const canViewUser = (user: User) => {
    if (isSuperAdmin()) return true;
    
    if (isCallCenterAdmin()) {
      // Call center admin can view recovery agents and call center admins
      return user.role === 'agent' && (user as any).agent_type === 'recovery-agent' || 
             (user.role === 'admin' && (user as any).designation === 'call-center-admin');
    }
    
    if (isMarketingAdmin()) {
      // Marketing admin can view marketing agents and marketing admins
      return user.role === 'agent' && (user as any).agent_type === 'marketing-agent' || 
             (user.role === 'admin' && (user as any).designation === 'marketing-admin');
    }
    
    if (isComplianceAdmin()) {
      // Compliance admin can view compliance agents and compliance admins
      return user.role === 'agent' && (user as any).agent_type === 'compliance-agent' || 
             (user.role === 'admin' && (user as any).designation === 'compliance-admin');
    }
    
    return false;
  };

  return {
    currentUser,
    loading,
    isSuperAdmin,
    isCallCenterAdmin,
    isMarketingAdmin,
    isComplianceAdmin,
    canManageUsers,
    canManageRecoveryAgents,
    canManageMarketingAgents,
    canManageComplianceAgents,
    canViewUser
  };
};