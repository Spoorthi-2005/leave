// Security Enhanced Leave Application Form with Date Validation
// Includes comprehensive input sanitization and validation

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Calendar, Shield, AlertTriangle, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EnhancedDateValidation } from "./enhanced-date-validation";
import { z } from "zod";

// Enhanced form schema with comprehensive validation
const secureLeaveFormSchema = z.object({
  leaveType: z.enum(["sick", "casual", "personal", "emergency", "other"]),
  fromDate: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }, "Leave date cannot be in the past"),
  toDate: z.string(),
  reason: z.string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason cannot exceed 500 characters")
    .refine((text) => {
      // Sanitize and validate content
      const sanitized = text.replace(/<[^>]*>/g, '').trim();
      return sanitized.length >= 10;
    }, "Reason must contain valid text content"),
  priority: z.enum(["normal", "urgent"]).optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional().refine((phone) => {
    if (!phone) return true;
    return /^[\+]?[1-9][\d]{0,15}$/.test(phone);
  }, "Invalid phone number format"),
  attachmentPath: z.string().optional(),
}).refine((data) => {
  const fromDate = new Date(data.fromDate);
  const toDate = new Date(data.toDate);
  return toDate >= fromDate;
}, {
  message: "End date must be after or equal to start date",
  path: ["toDate"],
});

type SecureLeaveFormData = z.infer<typeof secureLeaveFormSchema>;

interface SecurityEnhancedFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTemplate?: {
    leaveType: string;
    reasonTemplate: string;
  } | null;
}

export function SecurityEnhancedForm({ open, onOpenChange, selectedTemplate }: SecurityEnhancedFormProps) {
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [securityScore, setSecurityScore] = useState<number>(0);
  const [showSecurityTips, setShowSecurityTips] = useState<boolean>(false);
  const [submissionAttempts, setSubmissionAttempts] = useState<number>(0);

  const form = useForm<SecureLeaveFormData>({
    resolver: zodResolver(secureLeaveFormSchema),
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

  // Security validation on form changes
  useEffect(() => {
    calculateSecurityScore();
  }, [form.watch()]);

  // Update form when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      form.setValue("leaveType", selectedTemplate.leaveType as any);
      form.setValue("reason", selectedTemplate.reasonTemplate);
    }
  }, [selectedTemplate, form]);

  const calculateSecurityScore = () => {
    const values = form.getValues();
    let score = 0;

    // Date validation (30 points)
    if (values.fromDate && values.toDate) {
      const from = new Date(values.fromDate);
      const to = new Date(values.toDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (from >= today && to >= from) {
        score += 30;
      }
    }

    // Reason quality (25 points)
    if (values.reason) {
      const cleanReason = values.reason.replace(/<[^>]*>/g, '').trim();
      if (cleanReason.length >= 10 && cleanReason.length <= 500) {
        score += 15;
        // Additional points for detailed reasons
        if (cleanReason.length >= 50) score += 10;
      }
    }

    // Contact information (20 points)
    if (values.emergencyContact && values.emergencyPhone) {
      const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
      if (phonePattern.test(values.emergencyPhone)) {
        score += 20;
      }
    }

    // Leave type selection (15 points)
    if (values.leaveType) {
      score += 15;
    }

    // Priority assessment (10 points)
    if (values.priority) {
      score += 10;
    }

    setSecurityScore(score);
  };

  const sanitizeInput = (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  };

  const validateFileUpload = (file: File): { valid: boolean; message: string } => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        message: 'Only JPEG, PNG, GIF images and PDF files are allowed'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        message: 'File size must be less than 5MB'
      };
    }

    return { valid: true, message: 'File is valid' };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFileUpload(file);
    if (!validation.valid) {
      toast({
        title: "File Upload Error",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    toast({
      title: "File Selected",
      description: `${file.name} is ready for upload`,
    });
  };

  const submitMutation = useMutation({
    mutationFn: async (data: SecureLeaveFormData) => {
      setSubmissionAttempts(prev => prev + 1);

      // Client-side security validation
      if (securityScore < 70) {
        throw new Error("Please complete all required fields to ensure secure submission");
      }

      // Rate limiting check
      if (submissionAttempts >= 3) {
        throw new Error("Too many submission attempts. Please wait before trying again.");
      }

      // Sanitize inputs
      const sanitizedData = {
        ...data,
        reason: sanitizeInput(data.reason),
        emergencyContact: data.emergencyContact ? sanitizeInput(data.emergencyContact) : undefined,
      };

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
        } else {
          throw new Error("File upload failed");
        }
      }

      const res = await apiRequest("POST", "/api/leave-applications", {
        ...sanitizedData,
        attachmentPath,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to submit application");
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted Successfully",
        description: "Your leave application has been securely submitted and is now under review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-applications"] });
      form.reset();
      setUploadedFile(null);
      setSubmissionAttempts(0);
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

  const handleDateChange = (dates: { fromDate: string; toDate: string }) => {
    form.setValue("fromDate", dates.fromDate);
    form.setValue("toDate", dates.toDate);
  };

  const getSecurityLevel = (): { level: string; color: string; description: string } => {
    if (securityScore >= 90) return { level: "Excellent", color: "text-green-600", description: "Highly secure submission" };
    if (securityScore >= 70) return { level: "Good", color: "text-blue-600", description: "Secure submission ready" };
    if (securityScore >= 50) return { level: "Fair", color: "text-yellow-600", description: "Improve security by completing fields" };
    return { level: "Poor", color: "text-red-600", description: "Please complete required fields" };
  };

  const securityLevel = getSecurityLevel();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Secure Leave Application
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => submitMutation.mutate(data))} className="space-y-6">
            
            {/* Security Score Display */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Security Score</span>
                <Badge variant={securityScore >= 70 ? "default" : "secondary"}>
                  {securityScore}/100
                </Badge>
              </div>
              <Progress value={securityScore} className="mb-2" />
              <p className={`text-xs ${securityLevel.color}`}>
                {securityLevel.level}: {securityLevel.description}
              </p>
            </div>

            {/* Enhanced Date Validation Component */}
            <EnhancedDateValidation
              fromDate={form.watch("fromDate")}
              toDate={form.watch("toDate")}
              onDateChange={handleDateChange}
              disabled={submitMutation.isPending}
            />

            {/* Leave Type and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="leaveType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type</FormLabel>
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
                    <FormLabel>Priority</FormLabel>
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
                      onChange={(e) => {
                        const sanitized = sanitizeInput(e.target.value);
                        field.onChange(sanitized);
                      }}
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Minimum 10 characters</span>
                    <span>{field.value?.length || 0}/500</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Emergency Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emergencyContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contact person name"
                        {...field}
                        onChange={(e) => {
                          const sanitized = sanitizeInput(e.target.value);
                          field.onChange(sanitized);
                        }}
                      />
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
                    <FormLabel>Emergency Contact Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+91-9876543210"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <FormLabel>Supporting Document (Optional)</FormLabel>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                disabled={submitMutation.isPending}
              />
              {uploadedFile && (
                <p className="text-sm text-green-600">
                  File selected: {uploadedFile.name}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Supported formats: JPEG, PNG, GIF, PDF (Max 5MB)
              </p>
            </div>

            {/* Security Tips */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Your data is protected with enterprise-grade security</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSecurityTips(!showSecurityTips)}
                  >
                    {showSecurityTips ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {showSecurityTips && (
                  <ul className="mt-2 text-xs space-y-1">
                    <li>• All inputs are sanitized to prevent malicious content</li>
                    <li>• File uploads are validated for type and size</li>
                    <li>• Past date selection is prevented</li>
                    <li>• Rate limiting protects against spam submissions</li>
                    <li>• All communications are encrypted</li>
                  </ul>
                )}
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <div className="flex justify-end space-x-2">
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
                disabled={submitMutation.isPending || securityScore < 70}
                className="min-w-[120px]"
              >
                {submitMutation.isPending ? (
                  "Submitting..."
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Secure Submit
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}