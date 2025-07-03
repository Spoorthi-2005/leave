import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { GraduationCap, Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["student", "faculty", "admin"], {
    required_error: "Please select your role",
  }),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      role: undefined,
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      role: undefined,
      studentId: "",
      department: "",
      year: undefined,
      semester: undefined,
      section: "",
      designation: "",
      phoneNumber: "",
    },
  });

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate({
      username: data.username,
      password: data.password,
    });
  };

  const onRegister = (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gvpcew-gradient flex-col justify-center items-center text-white p-12">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-8">
            <GraduationCap className="text-4xl" />
          </div>
          <h1 className="text-4xl font-bold mb-4">GVPCEW</h1>
          <h2 className="text-xl font-medium mb-6">Leave Management System</h2>
          <p className="text-blue-100 leading-relaxed">
            Streamlined leave management for students, faculty, and administrators. 
            Efficient workflow, real-time notifications, and comprehensive reporting.
          </p>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Welcome to GVPCEW LMS
              </CardTitle>
              <p className="text-gray-600 mt-2">Manage your leave applications efficiently</p>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div>
                      <Label htmlFor="login-username">Username</Label>
                      <Input
                        id="login-username"
                        {...loginForm.register("username")}
                        placeholder="Enter your username"
                        className="mt-1"
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-sm text-destructive mt-1">
                          {loginForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        {...loginForm.register("password")}
                        placeholder="Enter your password"
                        className="mt-1"
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-destructive mt-1">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="login-role">Role</Label>
                      <Select
                        value={loginForm.watch("role")}
                        onValueChange={(value) => loginForm.setValue("role", value as any)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="faculty">Faculty</SelectItem>
                          <SelectItem value="admin">Admin/HOD</SelectItem>
                        </SelectContent>
                      </Select>
                      {loginForm.formState.errors.role && (
                        <p className="text-sm text-destructive mt-1">
                          {loginForm.formState.errors.role.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Sign In
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="register-username">Username</Label>
                        <Input
                          id="register-username"
                          {...registerForm.register("username")}
                          placeholder="Username"
                          className="mt-1"
                        />
                        {registerForm.formState.errors.username && (
                          <p className="text-sm text-destructive mt-1">
                            {registerForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="register-email">Email</Label>
                        <Input
                          id="register-email"
                          type="email"
                          {...registerForm.register("email")}
                          placeholder="Email address"
                          className="mt-1"
                        />
                        {registerForm.formState.errors.email && (
                          <p className="text-sm text-destructive mt-1">
                            {registerForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="register-fullName">Full Name</Label>
                      <Input
                        id="register-fullName"
                        {...registerForm.register("fullName")}
                        placeholder="Enter your full name"
                        className="mt-1"
                      />
                      {registerForm.formState.errors.fullName && (
                        <p className="text-sm text-destructive mt-1">
                          {registerForm.formState.errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="register-role">Role</Label>
                      <Select
                        value={registerForm.watch("role")}
                        onValueChange={(value) => registerForm.setValue("role", value as any)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="faculty">Faculty</SelectItem>
                          <SelectItem value="admin">Admin/HOD</SelectItem>
                        </SelectContent>
                      </Select>
                      {registerForm.formState.errors.role && (
                        <p className="text-sm text-destructive mt-1">
                          {registerForm.formState.errors.role.message}
                        </p>
                      )}
                    </div>

                    {registerForm.watch("role") === "student" && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="register-studentId">Student ID</Label>
                            <Input
                              id="register-studentId"
                              {...registerForm.register("studentId")}
                              placeholder="e.g., 21CSE1001"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="register-year">Year</Label>
                            <Select
                              value={registerForm.watch("year")?.toString()}
                              onValueChange={(value) => registerForm.setValue("year", parseInt(value))}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1st Year</SelectItem>
                                <SelectItem value="2">2nd Year</SelectItem>
                                <SelectItem value="3">3rd Year</SelectItem>
                                <SelectItem value="4">4th Year</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="register-semester">Semester</Label>
                            <Select
                              value={registerForm.watch("semester")?.toString()}
                              onValueChange={(value) => registerForm.setValue("semester", parseInt(value))}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select semester" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1st Semester</SelectItem>
                                <SelectItem value="2">2nd Semester</SelectItem>
                                <SelectItem value="3">3rd Semester</SelectItem>
                                <SelectItem value="4">4th Semester</SelectItem>
                                <SelectItem value="5">5th Semester</SelectItem>
                                <SelectItem value="6">6th Semester</SelectItem>
                                <SelectItem value="7">7th Semester</SelectItem>
                                <SelectItem value="8">8th Semester</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="register-section">Section</Label>
                            <Select
                              value={registerForm.watch("section") || ""}
                              onValueChange={(value) => registerForm.setValue("section", value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select section" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">Section A</SelectItem>
                                <SelectItem value="B">Section B</SelectItem>
                                <SelectItem value="C">Section C</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="register-department">Department</Label>
                        <Select
                          value={registerForm.watch("department") || ""}
                          onValueChange={(value) => registerForm.setValue("department", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CSE">Computer Science Engineering (CSE)</SelectItem>
                            <SelectItem value="IT">Information Technology (IT)</SelectItem>
                            <SelectItem value="ECE">Electronics and Communication Engineering (ECE)</SelectItem>
                            <SelectItem value="EEE">Electrical and Electronics Engineering (EEE)</SelectItem>
                            <SelectItem value="CSM">Computer Science and Mathematics (CSM)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="register-phoneNumber">Phone Number</Label>
                        <Input
                          id="register-phoneNumber"
                          {...registerForm.register("phoneNumber")}
                          placeholder="+91-9876543210"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="register-password">Password</Label>
                        <Input
                          id="register-password"
                          type="password"
                          {...registerForm.register("password")}
                          placeholder="Password"
                          className="mt-1"
                        />
                        {registerForm.formState.errors.password && (
                          <p className="text-sm text-destructive mt-1">
                            {registerForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="register-confirmPassword">Confirm Password</Label>
                        <Input
                          id="register-confirmPassword"
                          type="password"
                          {...registerForm.register("confirmPassword")}
                          placeholder="Confirm password"
                          className="mt-1"
                        />
                        {registerForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-destructive mt-1">
                            {registerForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Account
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
