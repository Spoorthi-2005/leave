import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, Edit, Trash2, Copy, FileText, Star, Bookmark, 
  Clock, Users, CheckCircle, Eye, Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface LeaveTemplate {
  id: number;
  name: string;
  leaveType: string;
  reasonTemplate: string;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  usageCount?: number;
}

interface LeaveTemplatesProps {
  onUseTemplate?: (template: LeaveTemplate) => void;
  userRole: string;
}

export function LeaveTemplates({ onUseTemplate, userRole }: LeaveTemplatesProps) {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<LeaveTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    leaveType: "",
    reasonTemplate: ""
  });

  const { data: templates = [], isLoading } = useQuery<LeaveTemplate[]>({
    queryKey: ["/api/leave-templates"],
    enabled: true,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: typeof newTemplate) => {
      const res = await apiRequest("POST", "/api/leave-templates", template);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-templates"] });
      toast({
        title: "Template Created",
        description: "Leave template has been created successfully.",
      });
      setShowCreateDialog(false);
      setNewTemplate({ name: "", leaveType: "", reasonTemplate: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...template }: LeaveTemplate) => {
      const res = await apiRequest("PUT", `/api/leave-templates/${id}`, template);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-templates"] });
      toast({
        title: "Template Updated",
        description: "Leave template has been updated successfully.",
      });
      setEditingTemplate(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/leave-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-templates"] });
      toast({
        title: "Template Deleted",
        description: "Leave template has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.leaveType || !newTemplate.reasonTemplate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createTemplate.mutate(newTemplate);
  };

  const handleUpdateTemplate = () => {
    if (editingTemplate) {
      updateTemplate.mutate(editingTemplate);
    }
  };

  const handleUseTemplate = (template: LeaveTemplate) => {
    if (onUseTemplate) {
      onUseTemplate(template);
      toast({
        title: "Template Applied",
        description: `Template "${template.name}" has been applied to your application.`,
      });
    }
  };

  const duplicateTemplate = (template: LeaveTemplate) => {
    setNewTemplate({
      name: `${template.name} (Copy)`,
      leaveType: template.leaveType,
      reasonTemplate: template.reasonTemplate
    });
    setShowCreateDialog(true);
  };

  const mockTemplates: LeaveTemplate[] = templates.length > 0 ? templates : [
    {
      id: 1,
      name: "Medical Appointment",
      leaveType: "sick",
      reasonTemplate: "I need to attend a medical appointment with [Doctor/Specialist] on [Date] at [Time]. The appointment is essential for my health and cannot be rescheduled to non-working hours.",
      isActive: true,
      createdBy: 1,
      createdAt: new Date().toISOString(),
      usageCount: 45
    },
    {
      id: 2,
      name: "Family Emergency",
      leaveType: "emergency",
      reasonTemplate: "Due to an unexpected family emergency involving [Family Member], I need to take immediate leave to provide necessary support and assistance. The situation requires my immediate attention.",
      isActive: true,
      createdBy: 1,
      createdAt: new Date().toISOString(),
      usageCount: 23
    },
    {
      id: 3,
      name: "Personal Work",
      leaveType: "personal",
      reasonTemplate: "I require personal leave to attend to important personal matters that cannot be scheduled outside working hours. This includes [Brief Description of Personal Work].",
      isActive: true,
      createdBy: 1,
      createdAt: new Date().toISOString(),
      usageCount: 67
    },
    {
      id: 4,
      name: "Festival/Religious Observance",
      leaveType: "casual",
      reasonTemplate: "I would like to request leave to observe [Festival/Religious Event] on [Date]. This is an important cultural/religious occasion for me and my family.",
      isActive: true,
      createdBy: 1,
      createdAt: new Date().toISOString(),
      usageCount: 89
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Leave Templates</h3>
          <p className="text-gray-600 dark:text-gray-400">Pre-defined templates to streamline leave applications</p>
        </div>
        {(userRole === 'admin' || userRole === 'faculty') && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="luxury-button">
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Leave Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Template Name</label>
                  <Input
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Medical Appointment"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Leave Type</label>
                  <Select 
                    value={newTemplate.leaveType} 
                    onValueChange={(value) => setNewTemplate(prev => ({ ...prev, leaveType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="casual">Casual Leave</SelectItem>
                      <SelectItem value="personal">Personal Leave</SelectItem>
                      <SelectItem value="emergency">Emergency Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Reason Template</label>
                  <Textarea
                    value={newTemplate.reasonTemplate}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, reasonTemplate: e.target.value }))}
                    placeholder="Enter the template text. Use [placeholders] for variable content."
                    rows={5}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use placeholders like [Date], [Time], [Doctor], [Family Member] for customizable content
                  </p>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateTemplate} disabled={createTemplate.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockTemplates.map((template) => (
            <Card key={template.id} className="luxury-card hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-blue-500" />
                      {template.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="capitalize">
                        {template.leaveType}
                      </Badge>
                      {template.usageCount && (
                        <Badge variant="secondary" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {template.usageCount} uses
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {template.isActive && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" title="Active" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4">
                      {template.reasonTemplate}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                      {onUseTemplate && (
                        <Button
                          size="sm"
                          onClick={() => handleUseTemplate(template)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Use
                        </Button>
                      )}
                      
                      {(userRole === 'admin' || userRole === 'faculty') && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => duplicateTemplate(template)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTemplate(template)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTemplate.mutate(template.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {new Date(template.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Template Name</label>
                <Input
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Leave Type</label>
                <Select 
                  value={editingTemplate.leaveType} 
                  onValueChange={(value) => setEditingTemplate(prev => prev ? { ...prev, leaveType: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="casual">Casual Leave</SelectItem>
                    <SelectItem value="personal">Personal Leave</SelectItem>
                    <SelectItem value="emergency">Emergency Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Reason Template</label>
                <Textarea
                  value={editingTemplate.reasonTemplate}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, reasonTemplate: e.target.value } : null)}
                  rows={5}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateTemplate} disabled={updateTemplate.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Update Template
                </Button>
                <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Usage Statistics */}
      {userRole === 'admin' && (
        <Card className="luxury-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Template Usage Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockTemplates.slice(0, 4).map((template) => (
                <div key={template.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-2xl font-bold text-blue-600">{template.usageCount}</p>
                  <p className="text-xs text-gray-500">times used</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}