// Enhanced Date Validation Component for Leave Applications
// Prevents past date selection and provides intelligent date suggestions

import { useState, useEffect } from "react";
import { Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface DateValidationProps {
  fromDate: string;
  toDate: string;
  onDateChange: (dates: { fromDate: string; toDate: string }) => void;
  disabled?: boolean;
}

export function EnhancedDateValidation({ 
  fromDate, 
  toDate, 
  onDateChange, 
  disabled = false 
}: DateValidationProps) {
  const { toast } = useToast();
  const [dateErrors, setDateErrors] = useState<string[]>([]);
  const [dateWarnings, setDateWarnings] = useState<string[]>([]);
  const [leaveDuration, setLeaveDuration] = useState<number>(0);

  // Get current date in YYYY-MM-DD format
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  
  // Get minimum selectable date (today)
  const minDate = todayString;

  useEffect(() => {
    validateDates();
  }, [fromDate, toDate]);

  const validateDates = () => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!fromDate || !toDate) {
      setDateErrors(errors);
      setDateWarnings(warnings);
      setLeaveDuration(0);
      return;
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // Check if dates are in the past
    if (from < todayDate) {
      errors.push("Start date cannot be in the past");
    }

    if (to < todayDate) {
      errors.push("End date cannot be in the past");
    }

    // Check date range validity
    if (to < from) {
      errors.push("End date must be after or equal to start date");
    }

    // Calculate leave duration
    if (from && to && to >= from) {
      const timeDiff = to.getTime() - from.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;
      setLeaveDuration(daysDiff);

      // Add warnings for various scenarios
      if (daysDiff > 30) {
        warnings.push("Leave duration exceeds 30 days - requires special approval");
      } else if (daysDiff > 7) {
        warnings.push("Long duration leave - requires HOD approval");
      }

      // Check if leave starts tomorrow (less preparation time)
      const tomorrow = new Date(todayDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (from.getTime() === tomorrow.getTime()) {
        warnings.push("Leave starts tomorrow - ensure proper handover");
      }

      // Check if leave includes weekends
      const includesWeekend = checkIncludesWeekend(from, to);
      if (includesWeekend) {
        warnings.push("Leave period includes weekends");
      }
    }

    setDateErrors(errors);
    setDateWarnings(warnings);
  };

  const checkIncludesWeekend = (startDate: Date, endDate: Date): boolean => {
    const current = new Date(startDate);
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        return true;
      }
      current.setDate(current.getDate() + 1);
    }
    return false;
  };

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const selectedDateObj = new Date(selectedDate);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // Prevent past date selection
    if (selectedDateObj < todayDate) {
      toast({
        title: "Invalid Date Selection",
        description: "Cannot select past dates for leave application. Please choose today or a future date.",
        variant: "destructive",
      });
      return;
    }

    // Auto-adjust end date if it's before the new start date
    let newToDate = toDate;
    if (toDate && new Date(toDate) < selectedDateObj) {
      newToDate = selectedDate;
      toast({
        title: "End Date Adjusted",
        description: "End date has been automatically adjusted to match the start date.",
      });
    }

    onDateChange({ fromDate: selectedDate, toDate: newToDate });
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const selectedDateObj = new Date(selectedDate);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    // Prevent past date selection
    if (selectedDateObj < todayDate) {
      toast({
        title: "Invalid Date Selection",
        description: "End date cannot be in the past. Please choose today or a future date.",
        variant: "destructive",
      });
      return;
    }

    // Ensure end date is not before start date
    if (fromDate && selectedDateObj < new Date(fromDate)) {
      toast({
        title: "Invalid Date Range",
        description: "End date must be after or equal to start date.",
        variant: "destructive",
      });
      return;
    }

    onDateChange({ fromDate, toDate: selectedDate });
  };

  const suggestCommonDurations = () => {
    const today = new Date();
    const suggestions = [
      { label: "Half Day", days: 0.5 },
      { label: "1 Day", days: 1 },
      { label: "2 Days", days: 2 },
      { label: "3 Days", days: 3 },
      { label: "1 Week", days: 7 },
    ];

    return suggestions.map((suggestion) => {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() + 1); // Start tomorrow
      
      const endDate = new Date(startDate);
      if (suggestion.days === 0.5) {
        // Half day - same day
        endDate.setTime(startDate.getTime());
      } else {
        endDate.setDate(endDate.getDate() + suggestion.days - 1);
      }

      return {
        ...suggestion,
        fromDate: startDate.toISOString().split('T')[0],
        toDate: endDate.toISOString().split('T')[0],
      };
    });
  };

  const applyDateSuggestion = (suggestion: any) => {
    onDateChange({
      fromDate: suggestion.fromDate,
      toDate: suggestion.toDate,
    });
    
    toast({
      title: "Date Range Applied",
      description: `Applied ${suggestion.label} leave duration`,
    });
  };

  const getWorkingDaysCount = (): number => {
    if (!fromDate || !toDate) return 0;
    
    const start = new Date(fromDate);
    const end = new Date(toDate);
    let workingDays = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return workingDays;
  };

  return (
    <div className="space-y-4">
      {/* Date Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fromDate" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Start Date
          </Label>
          <Input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={handleFromDateChange}
            min={minDate}
            disabled={disabled}
            className={`${dateErrors.length > 0 ? 'border-red-500' : ''}`}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="toDate" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            End Date
          </Label>
          <Input
            id="toDate"
            type="date"
            value={toDate}
            onChange={handleToDateChange}
            min={fromDate || minDate}
            disabled={disabled}
            className={`${dateErrors.length > 0 ? 'border-red-500' : ''}`}
          />
        </div>
      </div>

      {/* Quick Duration Suggestions */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Quick Duration Selection:</Label>
        <div className="flex flex-wrap gap-2">
          {suggestCommonDurations().map((suggestion) => (
            <Button
              key={suggestion.label}
              variant="outline"
              size="sm"
              onClick={() => applyDateSuggestion(suggestion)}
              disabled={disabled}
              className="text-xs"
            >
              {suggestion.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Duration Display */}
      {leaveDuration > 0 && (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Leave Duration:</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {leaveDuration} {leaveDuration === 1 ? 'day' : 'days'}
            </Badge>
            <Badge variant="outline">
              {getWorkingDaysCount()} working days
            </Badge>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {dateErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {dateErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warning Messages */}
      {dateWarnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {dateWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {dateErrors.length === 0 && fromDate && toDate && leaveDuration > 0 && (
        <Alert className="border-green-500 text-green-700 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Date range is valid. Your leave application covers {leaveDuration} {leaveDuration === 1 ? 'day' : 'days'} 
            ({getWorkingDaysCount()} working days).
          </AlertDescription>
        </Alert>
      )}

      {/* Additional Information */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>• Leave applications cannot be submitted for past dates</p>
        <p>• Long duration leaves (4+ days) require HOD approval</p>
        <p>• Emergency leaves can be submitted with same-day start dates</p>
        <p>• Weekend days are included in total duration but not in working days count</p>
      </div>
    </div>
  );
}