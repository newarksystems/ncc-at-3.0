import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

interface Contact {
  id: string;
  name: string;
  number: string;
  role?: string;
  company?: string;
  email?: string;
}

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      // For now, we'll create mock contacts from agent data
      // In a real implementation, this would fetch from a leads/contacts API
      const agents = await apiService.getAgents();
      
      const mockContacts: Contact[] = agents.map((agent, index) => ({
        id: agent.id,
        name: agent.full_name,
        number: agent.phone_number || `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        role: agent.department || 'Agent',
        company: 'Newark Call Center'
      }));
      
      setContacts(mockContacts);
      setError(null);
    } catch (err) {
      setError('Failed to fetch contacts');
      console.error('Error fetching contacts:', err);
      // Fallback to empty array
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return { contacts, loading, error, refresh: fetchContacts };
};
