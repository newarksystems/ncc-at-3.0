import { useState, useEffect } from 'react';
import { User, UserRole, AgentType } from '@/services/api';
import { useUsers } from '@/hooks/useUsers';
import { useUserPermissions } from '@/hooks/useUserPermissions';

export const useFilteredUsers = () => {
  const { users: allUsers, loading, error, refresh } = useUsers();
  const { currentUser, canViewUser } = useUserPermissions();
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  useEffect(() => {
    if (allUsers.length > 0 && currentUser) {
      const filtered = allUsers.filter(user => canViewUser(user));
      setFilteredUsers(filtered);
    }
  }, [allUsers, currentUser]);

  return { users: filteredUsers, loading, error, refresh };
};