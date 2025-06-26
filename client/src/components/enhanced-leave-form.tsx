import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Calendar, Upload, User, Phone, MapPin, AlertCircle, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertLeaveApplicationSchema } from "@shared/schema";
import { z } from "zod";
import { format, differenceInDays } from "date-fns";

const leaveFormSchema = insertLeaveApplicationSchema.extend({
  fromDate: z.string().min(1, "Start date is required"),
  toDate: z.string().min(1, "End date is required"),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

type LeaveFormData = z.infer<typeof leaveFormSchema>;

interface EnhancedLeaveFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTemplate?: {
    leaveType: string;
    reasonTemplate: string;
  } | null;
}

export function EnhancedLeaveForm({ open, onOpenChange, selectedTemplate }: EnhancedLeaveFormProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [leaveDays, setLeaveDays] = useState(0);

  const form = useForm<LeaveFormData>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      leaveType: selectedTemplate?.leaveType || "",
      reason: selectedTemplate?.reasonTemplate || "",
      priority: "normal",
      fromDate: "",
      toDate: "",
      emergencyContact: "",
      emergencyPhone: "",
    },
  });

  const createLeaveApplication = useMutation({
    mutationFn: async (data: LeaveFormData) => {
      const formData = new FormData();
      
      // Calculate leave days
      const fromDate = new Date(data.fromDate);
      const toDate = new Date(data.toDate);
      const calculatedDays = differenceInDays(toDate, fromDate) + 1;
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      formData.append('leaveDays', calculatedDays.toString());
      formData.append('isLongLeave', (calculatedDays > 3).toString());
      
      if (selectedFile) {
        formData.append('attachment', selectedFile);
      }

      const res = await fetch('/api/leave-applications', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to submit application');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-stats"] });
      toast({
        title: "Application Submitted",
        description: "Your leave application has been submitted successfully and is pending review.",
      });
      onOpenChange(false);
      form.reset();
      setSelectedFile(null);
      setLeaveDays(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LeaveFormData) => {
    if (leaveDays <= 0) {
      toast({
        title: "Invalid Dates",
        description: "Please select valid start and end dates.",
        variant: "destructive",
      });
      return;
    }
    createLeaveApplication.mutate(data);
  };

  const handleDateChange = () => {
    const fromDate = form.getValues('fromDate');
    const toDate = form.getValues('toDate');
    
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      const days = differenceInDays(to, from) + 1;
      setLeaveDays(Math.max(0, days));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto luxury-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Submit Leave Application
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>
          {selectedTemplate && (
            <Badge variant="outline" className="w-fit">
              Using Template: {selectedTemplate.leaveType}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Leave Type and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="leaveType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Leave Type
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select leave type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sick">Sick Leave</SelectItem>
                          <SelectItem value="casual">Casual Leave</SelectItem>
                          <SelectItem value="personal">Personal Leave</SelectItem>
                          <SelectItem value="emergency">Emergency Leave</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Priority
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fromDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        From Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleDateChange();
                          }}
                          min={format(new Date(), 'yyyy-MM-dd')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="toDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        To Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleDateChange();
                          }}
                          min={form.getValues('fromDate') || format(new Date(), 'yyyy-MM-dd')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Leave Duration Display */}
              {leaveDays > 0 && (
                <Alert className={leaveDays > 3 ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <span className="font-medium">Duration: {leaveDays} day{leaveDays > 1 ? 's' : ''}</span>
                    {leaveDays > 3 && (
                      <span className="block text-sm mt-1 text-orange-600">
                        Long leave (4+ days) requires additional approval levels
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Leave</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide detailed reason for your leave application..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Emergency Contact Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Emergency Contact (Optional)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergencyContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Contact Name
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Emergency contact name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Contact Phone
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Emergency contact phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-3">
                <FormLabel className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Supporting Documents (Optional)
                </FormLabel>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id="attachment"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                      }
                    }}
                  />
                  <label htmlFor="attachment" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Click to upload supporting documents
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX, JPG, PNG (Max 5MB)
                    </p>
                  </label>
                  {selectedFile && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                      Selected: {selectedFile.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createLeaveApplication.isPending || leaveDays <= 0}
                  className="flex-1 luxury-button"
                >
                  {createLeaveApplication.isPending ? "Submitting..." : "Submit Application"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}