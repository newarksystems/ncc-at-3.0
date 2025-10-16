import React, { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { ChevronDown, MoreHorizontal, Users, Filter, Download, RefreshCw, Calendar, X } from "lucide-react"
import { DateRangePicker } from "./ui/date-range-picker"

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface FilterState {
  dateRange: DateRange;
  extension: string;
  status: string;
  department: string;
}

interface AgentStatsLayoutDashProps {
  children: React.ReactNode;
  title: string;
  onFiltersChange?: (filters: FilterState) => void;
  onExport?: () => void;
  onRefresh?: () => void;
}

export const AgentStatsLayoutDash: React.FC<AgentStatsLayoutDashProps> = ({ 
  children, 
  title, 
  onFiltersChange,
  onExport,
  onRefresh
}) => {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      to: new Date()
    },
    extension: "All",
    status: "All",
    department: "All"
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [showUserActions, setShowUserActions] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  const filtersRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const savedFiltersRef = useRef<HTMLDivElement>(null);
  const userActionsRef = useRef<HTMLDivElement>(null);
  const moreActionsRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (savedFiltersRef.current && !savedFiltersRef.current.contains(event.target as Node)) {
        setShowSavedFilters(false);
      }
      if (userActionsRef.current && !userActionsRef.current.contains(event.target as Node)) {
        setShowUserActions(false);
      }
      if (moreActionsRef.current && !moreActionsRef.current.contains(event.target as Node)) {
        setShowMoreActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const savedFilters = [
    "Today's Performance",
    "Weekly Summary", 
    "Monthly Report",
    "Active Agents Only"
  ];

  const handleFilterChange = useCallback((key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [filters, onFiltersChange]);

  const handleDateRangeChange = useCallback((dateRange: DateRange) => {
    handleFilterChange('dateRange', dateRange);
  }, [handleFilterChange]);

  const removeFilter = useCallback((key: keyof FilterState) => {
    const defaultValues = {
      dateRange: {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date()
      },
      extension: "All",
      status: "All", 
      department: "All"
    };
    handleFilterChange(key, defaultValues[key]);
  }, [handleFilterChange]);

  const formatDateRange = (dateRange: DateRange) => {
    if (!dateRange.from || !dateRange.to) return "Select dates";
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = dateRange.from.toDateString() === today.toDateString() && 
                   dateRange.to.toDateString() === today.toDateString();
    const isYesterday = dateRange.from.toDateString() === yesterday.toDateString() && 
                       dateRange.to.toDateString() === yesterday.toDateString();
    
    const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    if (daysDiff === 7 && dateRange.to.toDateString() === today.toDateString()) return "Last 7 Days";
    if (daysDiff === 30 && dateRange.to.toDateString() === today.toDateString()) return "Last 30 Days";
    
    return `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`;
  };

  const activeFilters = Object.entries(filters).filter(([key, value]) => {
    if (key === 'dateRange') return false;
    return value !== "All";
  });

  return (
    <div className="min-h-screen text-white">
      <div className="bg-slate-800 border-b border-slate-700 mb-4 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-slate-300">
              <span>Agents</span>
              <span>{">"}</span>
              <span>Overview</span>
              <span>{">"}</span>
              <span className="text-white whitespace-nowrap truncate max-w-[80px] sm:max-w-[150px] md:max-w-[200px]">{title}</span>
            </div>
            
            <div className="relative flex items-center space-x-2 text-xs text-slate-400" ref={savedFiltersRef}>
              <span>-- SAVED FILTERS --</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={() => setShowSavedFilters(!showSavedFilters)}
              >
                -- Select -- <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
              
              {showSavedFilters && (
                <div className="absolute top-8 left-0 bg-slate-700 border border-slate-600 rounded-md shadow-lg z-50 min-w-48">
                  {savedFilters.map((filter) => (
                    <button
                      key={filter}
                      className="block w-full text-left px-3 py-2 text-xs hover:bg-slate-600 text-slate-200"
                      onClick={() => setShowSavedFilters(false)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span>FILTERS</span>
            </div>
            
            <div className="relative" ref={datePickerRef}>
              <Badge 
                variant="secondary" 
                className="bg-red-600 text-white text-xs cursor-pointer"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <Calendar className="w-3 h-3 mr-1" />
                {formatDateRange(filters.dateRange)}
              </Badge>
              
              {showDatePicker && (
                <DateRangePicker
                  value={filters.dateRange}
                  onChange={handleDateRangeChange}
                  onClose={() => setShowDatePicker(false)}
                />
              )}
            </div>
            
            <div className="relative" ref={filtersRef}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-3 h-3 mr-1" />
                More Filters
              </Button>
              
              {showFilters && (
                <div className="absolute top-8 right-0 bg-slate-700 border border-slate-600 rounded-md shadow-lg z-50 min-w-64 p-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Extension</label>
                      <input 
                        type="text"
                        value={filters.extension}
                        onChange={(e) => handleFilterChange('extension', e.target.value)}
                        className="w-full bg-slate-600 text-white text-xs p-2 rounded"
                        placeholder="Enter extension"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Status</label>
                      <select 
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full bg-slate-600 text-white text-xs p-2 rounded"
                      >
                        <option value="All">All</option>
                        <option value="Online">Online</option>
                        <option value="Offline">Offline</option>
                        <option value="Busy">Busy</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Department</label>
                      <select 
                        value={filters.department}
                        onChange={(e) => handleFilterChange('department', e.target.value)}
                        className="w-full bg-slate-600 text-white text-xs p-2 rounded"
                      >
                        <option value="All">All</option>
                        <option value="Sales">Sales</option>
                        <option value="Support">Support</option>
                        <option value="Technical">Technical</option>
                      </select>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setShowFilters(false)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => setShowFilters(false)}
                        className="text-xs"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative" ref={userActionsRef}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={() => setShowUserActions(!showUserActions)}
                title="User Management"
              >
                <Users className="w-3 h-3 mr-1" />
              </Button>
              
              {showUserActions && (
                <div className="absolute top-8 right-0 bg-slate-700 border border-slate-600 rounded-md shadow-lg z-50 min-w-48">
                  <button className="block w-full text-left px-3 py-2 text-xs hover:bg-slate-600 text-slate-200">
                    View All Agents
                  </button>
                  <button className="block w-full text-left px-3 py-2 text-xs hover:bg-slate-600 text-slate-200">
                    Agent Performance
                  </button>
                  <button className="block w-full text-left px-3 py-2 text-xs hover:bg-slate-600 text-slate-200">
                    Manage Permissions
                  </button>
                </div>
              )}
            </div>
            
            <div className="relative" ref={moreActionsRef}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2"
                onClick={() => setShowMoreActions(!showMoreActions)}
                title="More Actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
              
              {showMoreActions && (
                <div className="absolute top-8 right-0 bg-slate-700 border border-slate-600 rounded-md shadow-lg z-50 min-w-48">
                  <button 
                    className="flex items-center w-full text-left px-3 py-2 text-xs hover:bg-slate-600 text-slate-200"
                    onClick={onExport}
                  >
                    <Download className="w-3 h-3 mr-2" />
                    Export Data
                  </button>
                  <button 
                    className="flex items-center w-full text-left px-3 py-2 text-xs hover:bg-slate-600 text-slate-200"
                    onClick={onRefresh}
                  >
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Refresh Data
                  </button>
                  <button className="flex items-center w-full text-left px-3 py-2 text-xs hover:bg-slate-600 text-slate-200">
                    <Filter className="w-3 h-3 mr-2" />
                    Save Current Filter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {activeFilters.length > 0 && (
          <div className="flex items-center space-x-4 mt-2 text-xs text-slate-400">
            <span>Applied Filters:</span>
            {activeFilters.map(([key, value]) => (
              <span key={key} className="flex items-center space-x-1">
                <span>{key}: {value}</span>
                <button 
                  onClick={() => removeFilter(key as keyof FilterState)}
                  className="text-slate-300 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}
