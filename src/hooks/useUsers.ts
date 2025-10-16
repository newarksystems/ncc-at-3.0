import { useState, useEffect } from 'react';
import { apiService, User, CreateUserRequest, UpdateUserRequest, PaginatedUsers } from '@/services/api';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (page: number = 1, size: number = 100) => {
    try {
      setLoading(true);
      const data = await apiService.getUsers(page, size);
      setUsers(data.users);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: CreateUserRequest) => {
    try {
      setLoading(true);
      const newUser = await apiService.createUser(userData);
      setUsers([...users, newUser]);
      setError(null);
      return newUser;
    } catch (err) {
      setError('Failed to create user');
      console.error('Error creating user:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, userData: UpdateUserRequest) => {
    try {
      setLoading(true);
      const updatedUser = await apiService.updateUser(userId, userData);
      setUsers(users.map(user => user.id === userId ? updatedUser : user));
      setError(null);
      return updatedUser;
    } catch (err) {
      setError('Failed to update user');
      console.error('Error updating user:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setLoading(true);
      await apiService.deleteUser(userId);
      setUsers(users.filter(user => user.id !== userId));
      setError(null);
    } catch (err) {
      setError('Failed to delete user');
      console.error('Error deleting user:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, refresh: fetchUsers, createUser, updateUser, deleteUser };
};