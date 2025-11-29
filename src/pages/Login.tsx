import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, Mail } from "lucide-react";

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
      await login(email, password);
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (user.role === "waiter") {
        navigate("/tables");
      } else if (user.role === "chef") {
        navigate("/kitchen");
      } else if (user.role === "cashier") {
        // Check cashier layout mode to redirect to appropriate page
        const cashierLayoutMode =
          user?.restaurant?.featureFlags?.cashier_layout_mode || "both";

        if (cashierLayoutMode === "manage_orders") {
          navigate("/cashier");
        } else if (cashierLayoutMode === "pos_only") {
          navigate("/pos");
        } else {
          // Default to pos for "both" mode
          navigate("/pos");
        }
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const demoCredentials = [
    { email: "admin@vishalparatha.com", name: "Admin Dashboard" },
    { email: "manager@vishalparatha.com", name: "Manager Dashboard" },
    { email: "cashier@vishalparatha.com", name: "POS System (Cashier)" },
    { email: "waiter@vishalparatha.com", name: "Table Management (Waiter)" },
    { email: "chef@vishalparatha.com", name: "Kitchen Display (Chef)" },
  ];

  const quickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo123");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-400 to-blue-600 p-4 overflow-hidden">
      {/* background blur layer */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-md"></div>

      <div className="relative w-full max-w-md space-y-6 z-10">
        {/* Branding Section */}

        {/* Card Section */}
        <Card className="bg-white/80 backdrop-blur-xl shadow-2xl border border-white/40 rounded-2xl">
          <div className="flex flex-col items-center space-y-2 mt-4">
            <img
              src="/logo.png"
              alt="RestaurantPOS Logo"
              className="w-20 h-20 object-contain drop-shadow-lg animate-fade-in"
            />
            <img
              src="/rasoi_trackLogo.png"
              alt="RasoiTrack Logo"
              className="w-48 object-contain animate-fade-in-slow"
            />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-2xl font-semibold text-gray-800">
              Welcome Back 👋
            </CardTitle>
            <p className="text-center text-sm text-gray-500">
              Sign in to continue to RasoiTrack
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-lg transition-all"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Quick Demo Access */}
            <div className="mt-6">
              <div className="flex items-center justify-center">
                <span className="text-sm text-gray-500 font-medium">
                  Quick Demo Access
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                {demoCredentials.map((demo, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin(demo.email)}
                    className="text-xs border-gray-300 hover:border-orange-500 hover:text-orange-600 transition-colors bg-white/70"
                  >
                    {demo.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subtle footer */}
        <p className="text-center text-xs text-gray-200 mt-4">
          © {new Date().getFullYear()} RasoiTrack • All rights reserved
        </p>
      </div>
    </div>
  );
};

export default Login;
