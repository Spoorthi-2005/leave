import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import StudentDashboard from "@/pages/student-dashboard";
import FacultyDashboard from "@/pages/faculty-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import { NotificationSystem } from "@/components/notification-system";
import { useWebSocket } from "@/hooks/use-websocket";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={() => <DashboardRouter />} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function DashboardRouter() {
  return <StudentDashboard />;
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
