// src/pages/SuperAdminLogin.tsx

import { useState, useEffect } from "react";
import { useSuperAdminAuth } from "@/contexts/SuperAdminAuthContext";
import { Navigate, useNavigate } from "react-router-dom";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal } from "lucide-react";

export default function SuperAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useSuperAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Navigate *only if* the token has just become available
    // AND the login process (`isLoading`) has just finished.
    if (auth.adminToken && !isLoading) {
      // Check if we *were* loading, meaning login just succeeded
      // We can add a temporary state or check if login was just attempted
      // For simplicity, let's assume if token exists and isLoading is false,
      // and we are on the login page, we should navigate.
      // The initial redirect below handles the already-logged-in case.
      navigate("/super-admin", { replace: true });
    }
  }, [auth.adminToken, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true); // Start loading

    try {
      await auth.login(email, password);
      // On success, auth.adminToken will be set, triggering the useEffect.
      // We might need to keep isLoading=true until navigation completes,
      // but let's try leaving it off here first.
      // If the loop persists, we'll prevent setting isLoading=false here on success.
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
      setIsLoading(false); // Only stop loading if there's an error
    }
    // If successful, useEffect should navigate, and this component will unmount.
  };

  // --- ADJUSTED INITIAL REDIRECT ---
  // If the context is NOT loading AND a token already exists, redirect.
  // This handles the case where the user is already logged in when visiting the page.
  if (!auth.isAdminLoading && auth.adminToken) {
    return <Navigate to="/super-admin" replace />;
  }
  // --- END ADJUSTMENT ---

  // Show loading indicator or the form
  if (auth.isAdminLoading) {
    // Optional: Show a loading spinner while context checks local storage
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Render the login form
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
              {error && (
                <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {/* Form inputs... (no changes needed below) */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
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
}
