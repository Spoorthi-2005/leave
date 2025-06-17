import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LeaveApplication } from "@shared/schema";
import { format } from "date-fns";
import { FileText, User, Calendar, Clock, MessageSquare } from "lucide-react";

interface LeaveDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: LeaveApplication | null;
  onApprove?: () => void;
  onReject?: () => void;
  canReview?: boolean;
}

export function LeaveDetailsModal({
  open,
  onOpenChange,
  application,
  onApprove,
  onReject,
  canReview = false,
}: LeaveDetailsModalProps) {
  if (!application) return null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    return priority === "urgent" ? "destructive" : "outline";
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "PPP");
  };

  const calculateDuration = () => {
    const from = new Date(application.fromDate);
    const to = new Date(application.toDate);
    const diffTime = Math.abs(to.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Leave Application Details</span>
            <div className="flex gap-2">
              <Badge variant={getStatusBadgeVariant(application.status)}>
                {application.status.toUpperCase()}
              </Badge>
              <Badge variant={getPriorityBadgeVariant(application.priority)}>
                {application.priority.toUpperCase()}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Application Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Applicant</span>
              </div>
              <p className="text-sm text-gray-700">{(application as any).userName || "N/A"}</p>
              {(application as any).studentId && (
                <p className="text-xs text-gray-500">ID: {(application as any).studentId}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Leave Type</span>
              </div>
              <p className="text-sm text-gray-700 capitalize">{application.leaveType}</p>
            </div>
          </div>

          <Separator />

          {/* Date and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Duration</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">From:</span> {formatDate(application.fromDate)}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">To:</span> {formatDate(application.toDate)}
                </p>
                <p className="text-xs text-gray-500">
                  Total: {calculateDuration()} day(s)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Applied On</span>
              </div>
              <p className="text-sm text-gray-700">{formatDate(application.appliedAt)}</p>
            </div>
          </div>

          <Separator />

          {/* Reason */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Reason</span>
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
              {application.reason}
            </p>
          </div>

          {/* Attachment */}
          {application.attachmentPath && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Supporting Document</span>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">Document attached</span>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto"
                  onClick={() => window.open(`/uploads/leave-documents/${application.attachmentPath}`, '_blank')}
                >
                  View
                </Button>
              </div>
            </div>
          )}

          {/* Review Comments */}
          {application.reviewComments && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Review Comments</span>
              <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-md border-l-4 border-primary">
                {application.reviewComments}
              </p>
              {application.reviewedAt && (
                <p className="text-xs text-gray-500">
                  Reviewed on {formatDate(application.reviewedAt)}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {canReview && application.status === "pending" && (
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={onReject}
                className="text-destructive hover:text-destructive"
              >
                Reject
              </Button>
              <Button onClick={onApprove} className="bg-secondary hover:bg-secondary/90">
                Approve
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
