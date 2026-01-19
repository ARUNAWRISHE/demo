import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const VALID_PASSWORD = "admin@123";
const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "hod", label: "HOD" },
  { value: "ao", label: "AO" },
  { value: "director", label: "Director" },
];

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ role: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.role || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    
    if (formData.password !== VALID_PASSWORD) {
      toast.error("Invalid password");
      setLoading(false);
      return;
    }

    toast.success("Login successful!");
    
    const user = { role: formData.role, name: formData.role.toUpperCase() };
    
    if (formData.role === "admin") {
      navigate("/", { state: { user }, replace: true });
    } else {
      navigate("/role-home", { state: { user }, replace: true });
    }
    
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Card className="w-full max-w-md shadow-lg" data-testid="login-card">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold">Timing Investigator</CardTitle>
          <CardDescription className="text-base">
            Video analysis and investigation system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                disabled={loading}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <Button 
              type="submit"
              className="w-full h-11"
              disabled={loading || !formData.role}
              data-testid="login-button"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;