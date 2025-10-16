import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  onClose: () => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  onClose
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingFrom, setSelectingFrom] = useState(true);

  const quickRanges = [
    { label: 'Today', days: 0 },
    { label: 'Yesterday', days: 1 },
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'This Month', days: 'thisMonth' },
    { label: 'Last Month', days: 'lastMonth' }
  ];

  const getQuickRange = (days: number | string): DateRange => {
    const today = new Date();
    const from = new Date();
    
    if (days === 'thisMonth') {
      from.setDate(1);
      return { from, to: today };
    } else if (days === 'lastMonth') {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: lastMonth, to: lastDayOfLastMonth };
    } else if (days === 0) {
      return { from: today, to: today };
    } else if (days === 1) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: yesterday, to: yesterday };
    } else {
      from.setDate(today.getDate() - (days as number) + 1);
      return { from, to: today };
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    if (selectingFrom || !value.from) {
      onChange({ from: selectedDate, to: null });
      setSelectingFrom(false);
    } else {
      if (selectedDate < value.from) {
        onChange({ from: selectedDate, to: value.from });
      } else {
        onChange({ from: value.from, to: selectedDate });
      }
    }
  };

  const isDateInRange = (day: number) => {
    if (!value.from || !value.to) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date >= value.from && date <= value.to;
  };

  const isDateSelected = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return (value.from && date.getTime() === value.from.getTime()) ||
           (value.to && date.getTime() === value.to.getTime());
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = isDateSelected(day);
      const isInRange = isDateInRange(day);
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`w-8 h-8 text-xs rounded hover:bg-slate-600 ${
            isSelected ? 'bg-blue-600 text-white' : 
            isInRange ? 'bg-blue-200 text-slate-800' : 
            'text-slate-300'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const formatDate = (date: Date | null) => {
    return date ? date.toLocaleDateString() : 'Select date';
  };

  return (
    <div className="absolute top-8 right-0 bg-slate-700 border border-slate-600 rounded-md shadow-lg z-50 p-4 w-80">
      <div className="flex space-x-4 mb-4">
        {/* Quick Range Buttons */}
        <div className="flex-1">
          <h4 className="text-xs text-slate-300 mb-2">Quick Ranges</h4>
          <div className="space-y-1">
            {quickRanges.map((range) => (
              <button
                key={range.label}
                onClick={() => onChange(getQuickRange(range.days))}
                className="block w-full text-left px-2 py-1 text-xs hover:bg-slate-600 text-slate-200 rounded"
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="text-slate-300 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-300">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="text-slate-300 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="w-8 h-6 text-xs text-slate-400 text-center">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendar()}
          </div>
        </div>
      </div>

      {/* Selected range display */}
      <div className="border-t border-slate-600 pt-3 mb-3">
        <div className="text-xs text-slate-300 mb-2">Selected Range:</div>
        <div className="text-xs text-white">
          From: {formatDate(value.from)}
        </div>
        <div className="text-xs text-white">
          To: {formatDate(value.to)}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-2">
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onClose}
          className="text-xs"
        >
          Cancel
        </Button>
        <Button 
          size="sm" 
          onClick={onClose}
          className="text-xs"
          disabled={!value.from || !value.to}
        >
          Apply
        </Button>
      </div>
    </div>
  );
};
