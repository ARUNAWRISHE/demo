import React from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

function Dashboard({ user }) {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Manage Departments",
      description: "Add, edit, or remove departments",
      icon: "🏢",
      path: "/departments",
      color: "bg-blue-50 hover:bg-blue-100",
    },
    {
      title: "Manage Staff",
      description: "Add staff members and assign departments",
      icon: "👥",
      path: "/staff",
      color: "bg-green-50 hover:bg-green-100",
    },
    {
      title: "Manage Subjects",
      description: "Configure subjects and courses",
      icon: "📚",
      path: "/subjects",
      color: "bg-purple-50 hover:bg-purple-100",
    },
    {
      title: "Create Timetable",
      description: "Build and manage timetables",
      icon: "⚙️",
      path: "/timetable-manager",
      color: "bg-orange-50 hover:bg-orange-100",
    },
    {
      title: "View Timetable",
      description: "View existing timetables",
      icon: "📅",
      path: "/timetable-view",
      color: "bg-pink-50 hover:bg-pink-100",
    },
  ];

  return (
    <Layout user={user}>
      <div className="space-y-8" data-testid="dashboard">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Manage your college timetables, staff, and schedules efficiently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className={`cursor-pointer transition-all hover:shadow-lg ${action.color} border-0`}
              onClick={() => navigate(action.path)}
              data-testid={`quick-action-${action.title.toLowerCase().replace(/ /g, '-')}`}
            >
              <CardHeader>
                <div className="text-4xl mb-2">{action.icon}</div>
                <CardTitle className="text-xl">{action.title}</CardTitle>
                <CardDescription className="text-base">{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" size="sm" className="w-full">
                  Open →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>About This Platform</CardTitle>
            <CardDescription>Comprehensive timetable management for educational institutions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                This platform allows you to efficiently manage all aspects of your institution's timetable:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Store and organize department information</li>
                <li>Manage staff details and assignments</li>
                <li>Configure subjects with credits and types</li>
                <li>Create comprehensive timetables for different sections</li>
                <li>View staff schedules and teaching hours</li>
                <li>Support for multiple academic years and programs</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default Dashboard;