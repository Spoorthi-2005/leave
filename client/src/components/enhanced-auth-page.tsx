import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, User, Mail, Phone, MapPin, Building, Calendar, Shield, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { Redirect } from "wouter";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function EnhancedAuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      role: "student",
      department: "",
      phoneNumber: "",
      address: "",
      studentId: "",
      employeeId: "",
      year: undefined,
      semester: undefined,
      designation: "",
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

  const departments = [
    "CSE",
    "IT", 
    "ECE",
    "EEE",
    "CSM"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Hero Section */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">GVPCEW</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Leave Management System</p>
              </div>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              Streamlined Leave<br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Management
              </span>
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto lg:mx-0">
              Gayatri Vidya Parishad College of Engineering for Women - 
              Advanced leave management with multi-level approval workflows
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">Secure</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Role-based access control
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Real-time</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Instant notifications
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">Supported Roles:</p>
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                Students
              </Badge>
              <Badge variant="outline" className="bg-indigo-50 border-indigo-200 text-indigo-700">
                Faculty
              </Badge>
              <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
                HOD
              </Badge>
              <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
                Admin
              </Badge>
            </div>
          </div>
        </div>

        {/* Authentication Forms */}
        <Card className="w-full max-w-md mx-auto luxury-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">
              Welcome to GVPCEW
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Access your leave management portal
            </p>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login" className="space-y-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Username
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full luxury-button"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>

                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Demo Accounts:<br />
                  <code className="text-xs">admin/password</code> • <code className="text-xs">student1/password</code>
                </div>
              </TabsContent>

              {/* Registration Form */}
              <TabsContent value="register" className="space-y-4">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Basic Information</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={registerForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Email address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm password"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  >
                                    {showConfirmPassword ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Role & Academic Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Academic Information</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={registerForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="student">Student</SelectItem>
                                  <SelectItem value="faculty">Faculty</SelectItem>
                                  <SelectItem value="admin">Admin/HOD</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Building className="w-4 h-4" />
                                Department
                              </FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {departments.map((dept) => (
                                    <SelectItem key={dept} value={dept}>
                                      {dept}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Student-specific fields */}
                      {registerForm.watch("role") === "student" && (
                        <>
                          <div className="grid grid-cols-3 gap-3">
                            <FormField
                              control={registerForm.control}
                              name="studentId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Student ID</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Student ID" {...field} value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={registerForm.control}
                              name="year"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Year</FormLabel>
                                  <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Year" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="1">1st Year</SelectItem>
                                      <SelectItem value="2">2nd Year</SelectItem>
                                      <SelectItem value="3">3rd Year</SelectItem>
                                      <SelectItem value="4">4th Year</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={registerForm.control}
                              name="semester"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Semester</FormLabel>
                                  <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sem" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="1">I</SelectItem>
                                      <SelectItem value="2">II</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={registerForm.control}
                            name="section"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  Section (for CSE 4th Year Students)
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select your section" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="CSE1">CSE1 - Class Teacher: Gowthami</SelectItem>
                                    <SelectItem value="CSE2">CSE2 - Class Teacher: Y Sowmya</SelectItem>
                                    <SelectItem value="CSE3">CSE3 - Class Teacher: M Pavani</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}

                      {/* Faculty-specific fields */}
                      {(registerForm.watch("role") === "faculty" || registerForm.watch("role") === "admin") && (
                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={registerForm.control}
                            name="employeeId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Employee ID</FormLabel>
                                <FormControl>
                                  <Input placeholder="Employee ID" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="designation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Designation</FormLabel>
                                <FormControl>
                                  <Input placeholder="Designation" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Contact Information</h4>
                      
                      <FormField
                        control={registerForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Phone Number
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Phone number" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Address
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Address" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full luxury-button"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}