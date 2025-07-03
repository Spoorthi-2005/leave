import { useAuth } from "@/hooks/simple-auth";
import { Redirect } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { GraduationCap, Users, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Redirect to appropriate dashboard based on role
  if (user.role === "student") {
    return <Redirect to="/student" />;
  } else if (user.role === "teacher") {
    return <Redirect to="/teacher" />;
  } else if (user.role === "hod") {
    return <Redirect to="/hod" />;
  } else if (user.role === "admin") {
    return <Redirect to="/admin" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Leave Management System</h1>
          <p className="text-lg text-gray-600">Streamlined leave management for educational institutions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <GraduationCap className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <CardTitle>For Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Submit leave applications, track status, and manage your leave balance</p>
              <Link href="/student">
                <Button className="w-full">Student Dashboard</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle>For Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Review applications, approve/reject leaves, and manage student requests</p>
              <Link href="/teacher">
                <Button className="w-full">Teacher Dashboard</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Calendar className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">View comprehensive reports and system analytics</p>
              <Link href="/admin">
                <Button className="w-full">Admin Panel</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900">Easy Application</h3>
              <p className="text-sm text-blue-700">Submit leave requests in minutes</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900">Quick Approval</h3>
              <p className="text-sm text-green-700">Fast review and approval process</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900">Real-time Updates</h3>
              <p className="text-sm text-purple-700">Instant notifications and status updates</p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-orange-900">Leave Tracking</h3>
              <p className="text-sm text-orange-700">Monitor leave balance and history</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}