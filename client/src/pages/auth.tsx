import { useState } from "react";
import { useAuth } from "@/hooks/simple-auth";
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
      department: "",
      phoneNumber: "",
    },
  });

  if (user) {
    return <Redirect to="/" />;
  }

  const onLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 flex-col justify-center items-center text-white p-12">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-8">
            <GraduationCap className="text-4xl" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Leave Management</h1>
          <h2 className="text-xl font-medium mb-6">Educational Institution System</h2>
          <p className="text-blue-100 leading-relaxed">
            Streamlined leave management for students and teachers. 
            Efficient workflow, real-time notifications, and comprehensive tracking.
          </p>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Welcome to Leave Management
              </CardTitle>
              <p className="text-gray-600 mt-2">Access your account or create a new one</p>
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
                        <p className="text-sm text-red-600 mt-1">
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
                        <p className="text-sm text-red-600 mt-1">
                          {loginForm.formState.errors.password.message}
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

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Demo Accounts:</h3>
                    <div className="text-sm space-y-1">
                      <p><strong>Teacher:</strong> teacher1 / password</p>
                      <p><strong>Student:</strong> student1 / password</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div>
                      <Label htmlFor="register-fullName">Full Name</Label>
                      <Input
                        id="register-fullName"
                        {...registerForm.register("fullName")}
                        placeholder="Enter your full name"
                        className="mt-1"
                      />
                      {registerForm.formState.errors.fullName && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.fullName.message}
                        </p>
                      )}
                    </div>

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
                          <p className="text-sm text-red-600 mt-1">
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
                          <p className="text-sm text-red-600 mt-1">
                            {registerForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="register-role">Role</Label>
                      <Select
                        value={registerForm.watch("role") || ""}
                        onValueChange={(value) => registerForm.setValue("role", value as any)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                        </SelectContent>
                      </Select>
                      {registerForm.formState.errors.role && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.role.message}
                        </p>
                      )}
                    </div>

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
                            <SelectItem value="Computer Science">Computer Science</SelectItem>
                            <SelectItem value="Mathematics">Mathematics</SelectItem>
                            <SelectItem value="Physics">Physics</SelectItem>
                            <SelectItem value="Chemistry">Chemistry</SelectItem>
                            <SelectItem value="Biology">Biology</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="register-phoneNumber">Phone Number</Label>
                        <Input
                          id="register-phoneNumber"
                          {...registerForm.register("phoneNumber")}
                          placeholder="Phone number"
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
                          <p className="text-sm text-red-600 mt-1">
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
                          <p className="text-sm text-red-600 mt-1">
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