import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import EnhancedAuthPage from "@/components/enhanced-auth-page";
import StudentDashboard from "@/pages/student-dashboard";
import FacultyDashboard from "@/pages/faculty-dashboard";
import EnhancedAdminDashboard from "@/pages/enhanced-admin-dashboard";
import { NotificationSystem } from "@/components/notification-system";
import { useWebSocket } from "@/hooks/use-websocket";
import ErrorBoundary from "./components/error-boundary";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={() => <DashboardRouter />} />
      <Route path="/auth" component={EnhancedAuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function DashboardRouter() {
  const { user } = useAuth();
  
  if (!user) {
    return <div>Loading...</div>;
  }

  switch (user.role) {
    case 'admin':
      return <EnhancedAdminDashboard />;
    case 'faculty':
      return <FacultyDashboard />;
    case 'student':
    default:
      return <StudentDashboard />;
  }
}

function AppContent() {
  useWebSocket(); // Initialize WebSocket connection
  return (
    <>
      <Router />
      <NotificationSystem />
      <Toaster />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
