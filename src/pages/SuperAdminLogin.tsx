// src/pages/SuperAdminLogin.tsx

import { useState } from "react";
import { useSuperAdminAuth } from "@/contexts/SuperAdminAuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // <-- Import Alert
import { Loader2, Terminal } from "lucide-react"; // <-- Import Loader2

export const SuperAdminLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); // <-- State for errors
  const [isLoading, setIsLoading] = useState(false); // <-- State for loading
  const auth = useSuperAdminAuth();

  // --- UPDATE THE ONSUBMIT FUNCTION ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setIsLoading(true); // Start loading

    try {
      await auth.login(email, password);
      // Navigate will be handled by the check below
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message); // Set error message from the context
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false); // Stop loading
    }
  };
  // --- END OF UPDATE ---

  if (auth.adminToken && !auth.isAdminLoading) {
    return <Navigate to="/super-admin" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Super Admin Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your platform dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              {/* --- ADD ERROR ALERT --- */}
              {error && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {/* --- END OF ALERT --- */}

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading} // <-- Disable when loading
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading} // <-- Disable when loading
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {/* --- ADD LOADING SPINNER --- */}
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
