import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Utensils, Lock, Mail } from "lucide-react";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userData = await login(email, password);
      // Redirect based on role
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.role === "waiter") {
        navigate("/tables");
      } else if (user.role === "chef") {
        navigate("/kitchen");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      // Error is displayed via toast in AuthContext
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const demoCredentials = [
    { email: "admin@vishalparatha.com", name: "Admin Dashboard" },
    { email: "manager@vishalparatha.com", name: "Manager Dashboard" },
    { email: "cashier@vishalparatha.com", name: "POS System(Cashier)" },
    { email: "waiter@vishalparatha.com", name: "Table Management(Waiter)" },
    { email: "chef@vishalparatha.com", name: "Kitchen Display(Chef)" },
  ];

  const quickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo123");
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-elegant mb-4">
            <Utensils className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">RestaurantPOS</h1>
          <p className="text-white/80">Complete Restaurant Management System</p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm shadow-pos">
          <CardHeader>
            <CardTitle className="text-center text-xl">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="text-center text-sm text-muted-foreground mb-3">
                Quick Demo Access
              </div>
              <div className="grid grid-cols-2 gap-2">
                {demoCredentials.map((demo, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin(demo.email)}
                    className="text-xs"
                  >
                    {demo.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
