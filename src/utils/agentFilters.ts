import { Agent } from '@/services/api';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface FilterState {
  dateRange: DateRange;
  extension: string;
  status: string;
  department: string;
}

export const applyAgentFilters = (agents: Agent[], filters: FilterState): Agent[] => {
  return agents.filter(agent => {
    // Extension filter
    if (filters.extension && filters.extension !== 'All') {
      if (!agent.extension?.includes(filters.extension)) {
        return false;
      }
    }

    // Status filter (assuming we have status in agent data)
    if (filters.status && filters.status !== 'All') {
      // This would need to be implemented based on actual agent status field
      // For now, we'll assume all agents match
    }

    // Department filter
    if (filters.department && filters.department !== 'All') {
      if (agent.designation !== filters.department) {
        return false;
      }
    }

    // Date range filter would typically be applied to call data, not agent data
    // This is a placeholder for when we have timestamped data
    if (filters.dateRange.from && filters.dateRange.to) {
      // In a real implementation, you'd filter based on call timestamps
      // For now, we'll just return true as we don't have timestamp data on agents
    }

    return true;
  });
};

export const exportAgentData = (agents: Agent[], filename: string = 'agent-data.csv') => {
  const csvData = agents.map(agent => ({
    name: `${agent.first_name} ${agent.last_name}`,
    extension: agent.extension,
    designation: agent.designation,
    totalCalls: agent.total_calls,
    answeredCalls: agent.answered_calls,
    missedCalls: agent.missed_calls,
    avgTalkTime: agent.average_talk_time_formatted
  }));
  
  const headers = Object.keys(csvData[0]).join(',');
  const rows = csvData.map(row => Object.values(row).join(','));
  const csv = [headers, ...rows].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
