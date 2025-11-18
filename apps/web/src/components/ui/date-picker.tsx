'use client'

import React from 'react'
import { format } from 'date-fns'

interface DatePickerProps {
  selectedDate: Date | null
  onChange: (date: Date | null) => void
  minDate?: Date | null
  maxDate?: Date | null
  label?: string
}

export function DatePicker({
  selectedDate,
  onChange,
  minDate,
  maxDate,
  label,
}: DatePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onChange(new Date(e.target.value))
    } else {
      onChange(null)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return format(date, 'yyyy-MM-dd')
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-teal-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        type="date"
        value={formatDate(selectedDate)}
        onChange={handleChange}
        min={minDate ? formatDate(minDate) : undefined}
        max={maxDate ? formatDate(maxDate) : undefined}
        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 hover:border-teal-400 transition-colors"
      />
    </div>
  )
}

interface DateRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onStartDateChange: (date: Date | null) => void
  onEndDateChange: (date: Date | null) => void
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {
  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <DatePicker
          selectedDate={startDate}
          onChange={onStartDateChange}
          maxDate={endDate}
          label="From"
        />
      </div>
      <div className="flex-1">
        <DatePicker
          selectedDate={endDate}
          onChange={onEndDateChange}
          minDate={startDate}
          label="To"
        />
      </div>
    </div>
  )
}
