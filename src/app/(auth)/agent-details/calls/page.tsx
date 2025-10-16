"use client"

import React, { useState } from 'react'
import { AgentCallDetails } from '@/components/agents/agentcalldetails'
import { AgentStatsLayoutDash } from '@/components/agentstatslayoutdash'
import { FilterState } from '@/utils/agentFilters'

export default function AgentCallDetailsPage() {
    const [filters, setFilters] = useState<FilterState>({
        dateRange: {
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            to: new Date()
        },
        extension: "All",
        status: "All",
        department: "All"
    });

    const handleFiltersChange = (newFilters: FilterState) => {
        setFilters(newFilters);
        console.log('Call details filters changed:', newFilters);
    };

    const handleExport = () => {
        console.log('Exporting call details data...');
        // Export logic would go here
    };

    const handleRefresh = () => {
        console.log('Refreshing call details...');
        // Refresh logic would go here
    };

    return (
        <AgentStatsLayoutDash 
            title='Agent-Call Details'
            onFiltersChange={handleFiltersChange}
            onExport={handleExport}
            onRefresh={handleRefresh}
        >
         <AgentCallDetails />
        </AgentStatsLayoutDash>
    )
}