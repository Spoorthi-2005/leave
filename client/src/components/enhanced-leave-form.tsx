import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Calendar, Clock, FileText, Phone, User, AlertTriangle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertLeaveApplicationSchema } from "@shared/schema";
import { z } from "zod";

const leaveFormSchema = z.object({
  leaveType: z.enum(["sick", "casual", "personal", "emergency", "other"]),
  fromDate: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    return selectedDate >= today;
  }, "Leave date cannot be in the past"),
  toDate: z.string(),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  priority: z.enum(["normal", "urgent"]).optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  attachmentPath: z.string().optional(),
}).refine((data) => {
  const fromDate = new Date(data.fromDate);
  const toDate = new Date(data.toDate);
  return toDate >= fromDate;
}, {
  message: "End date must be after or equal to start date",
  path: ["toDate"],
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const form = useForm<LeaveFormData>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      leaveType: "sick",
      fromDate: "",
      toDate: "",
      reason: "",
      emergencyContact: "",
      emergencyPhone: "",
      priority: "normal",
      attachmentPath: "",
    },
  });

  // Update form when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      form.setValue("leaveType", selectedTemplate.leaveType as any);
      form.setValue("reason", selectedTemplate.reasonTemplate);
    }
  }, [selectedTemplate, form]);

  const submitMutation = useMutation({
    mutationFn: async (data: LeaveFormData) => {
      let attachmentPath = "";
      
      // Upload file if present
      if (uploadedFile) {
        const formData = new FormData();
        formData.append("file", uploadedFile);
        
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          attachmentPath = uploadData.filePath;
        }
      }

      const res = await apiRequest("POST", "/api/leave-applications", {
        ...data,
        attachmentPath,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your leave application has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
      form.reset();
      setUploadedFile(null);
      onOpenChange(false);
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
    submitMutation.mutate(data);
  };

  const calculateDays = () => {
    const fromDate = form.watch("fromDate");
    const toDate = form.watch("toDate");
    
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      const diffTime = Math.abs(to.getTime() - from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const leaveTypes = [
    { value: "sick", label: "Sick Leave", icon: "🏥" },
    { value: "casual", label: "Casual Leave", icon: "🌴" },
    { value: "personal", label: "Personal Leave", icon: "👤" },
    { value: "emergency", label: "Emergency Leave", icon: "🚨" },
    { value: "other", label: "Other", icon: "📝" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Enhanced Leave Application
          </DialogTitle>
        </DialogHeader>

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
                        {leaveTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <span className="flex items-center gap-2">
                              <span>{type.icon}</span>
                              {type.label}
                            </span>
                          </SelectItem>
                        ))}
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
                      <AlertTriangle className="w-4 h-4" />
                      Priority
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="normal">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Normal
                          </span>
                        </SelectItem>
                        <SelectItem value="urgent">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            Urgent
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date Range */}
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
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          const selectedDate = new Date(e.target.value);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          if (selectedDate < today) {
                            toast({
                              title: "Invalid Date Selection",
                              description: "Cannot select past dates for leave application. Please choose today or a future date.",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          field.onChange(e.target.value);
                          // Auto-update toDate if it's before fromDate
                          const currentToDate = form.getValues("toDate");
                          if (currentToDate && new Date(currentToDate) < selectedDate) {
                            form.setValue("toDate", e.target.value);
                          }
                        }}
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
                        min={form.watch("fromDate") || new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          const selectedToDate = new Date(e.target.value);
                          const fromDate = form.getValues("fromDate");
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          if (selectedToDate < today) {
                            toast({
                              title: "Invalid Date Selection",
                              description: "End date cannot be in the past. Please choose today or a future date.",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          if (fromDate && selectedToDate < new Date(fromDate)) {
                            toast({
                              title: "Invalid Date Range",
                              description: "End date must be after or equal to start date.",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          field.onChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Duration Display */}
            {calculateDays() > 0 && (
              <div className="flex items-center justify-center">
                <Badge variant="secondary" className="px-4 py-2 text-sm">
                  <Clock className="w-4 h-4 mr-2" />
                  Duration: {calculateDays()} day(s)
                  {calculateDays() > 3 && (
                    <span className="ml-2 text-orange-600">(Requires HOD approval)</span>
                  )}
                </Badge>
              </div>
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
                      placeholder="Please provide a detailed reason for your leave application..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Emergency Contact Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Emergency Contact (Optional)</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Contact Person
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
                        Phone Number
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
            <div className="space-y-4">
              <FormLabel className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Supporting Documents (Optional)
              </FormLabel>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-gray-500">
                    PDF, DOC, DOCX, JPG, PNG (max 10MB)
                  </span>
                </label>
                {uploadedFile && (
                  <div className="mt-2 p-2 bg-blue-50 rounded flex items-center justify-between">
                    <span className="text-sm text-blue-700">{uploadedFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}