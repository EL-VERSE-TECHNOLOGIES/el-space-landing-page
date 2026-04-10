"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [elSpaceId, setElSpaceId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserName(user.name || user.email);
      setElSpaceId(user.el_space_id || "EL-XXXXXXXX");
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

    // Decode token to get user info (basic example)
    try {
      const decoded = JSON.parse(Buffer.from(token, "base64").toString());
      setUserName(decoded.email);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem("authToken");
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          <p className="text-white mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            <span className="text-cyan-600">EL</span>
            <span className="text-slate-900"> SPACE</span>
          </h1>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Welcome to your Dashboard! 🎉
          </h2>
          <div className="flex flex-wrap gap-4 mb-8">
            <p className="text-slate-600">
              User: <strong>{userName}</strong>
            </p>
            <p className="text-slate-600">
              EL SPACE ID: <strong className="text-cyan-600">{elSpaceId}</strong>
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                  Post a Project
                </Button>
                <Button variant="outline">Browse Talent</Button>
                <Button variant="outline">View My Profile</Button>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Dashboard Features (Coming Soon)
              </h3>
              <ul className="space-y-2 text-slate-600">
                <li>✅ Project Management</li>
                <li>✅ Earnings Dashboard</li>
                <li>✅ Milestone Tracking</li>
                <li>✅ Daily Standups</li>
                <li>✅ Review System</li>
                <li>✅ Verified Badge Status</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
