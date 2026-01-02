import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function TimetableManager({ user }) {
  const [slots, setSlots] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    academic_year: "2025-2026",
    program: "B.Tech",
    year_semester: "I",
    section: "A",
    day_of_week: "Monday",
    slot_id: "",
    subject_id: "",
    staff_id: "",
    classroom: "",
    entry_type: "CLASS",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [slotsRes, subjectsRes, staffRes] = await Promise.all([
        axios.get(`${API}/time-slots`, { withCredentials: true }),
        axios.get(`${API}/subjects`, { withCredentials: true }),
        axios.get(`${API}/staff`, { withCredentials: true }),
      ]);
      setSlots(slotsRes.data);
      setSubjects(subjectsRes.data);
      setStaff(staffRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/timetable`, formData, { withCredentials: true });
      toast.success("Timetable entry created successfully");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error creating entry:", error);
      toast.error("Failed to create timetable entry");
    }
  };

  const getSlotDisplay = (slot) => {
    if (slot.slot_type === "BREAK" || slot.slot_type === "LUNCH") {
      return `${slot.start_time} - ${slot.end_time} (${slot.slot_type})`;
    }
    return `Period ${slot.period_number} (${slot.start_time} - ${slot.end_time})`;
  };

  const getSubjectName = (id) => subjects.find((s) => s.subject_id === id)?.name || "Unknown";
  const getStaffName = (id) => staff.find((s) => s.staff_id === id)?.name || "Unknown";

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="timetable-manager-page">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Timetable Manager</h1>
            <p className="text-muted-foreground mt-1">Create and manage timetable entries</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-timetable-entry-button">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Timetable Entry</DialogTitle>
                <DialogDescription>Create a new timetable entry for a specific class</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="academic_year">Academic Year</Label>
                    <Input
                      id="academic_year"
                      data-testid="academic-year-input"
                      value={formData.academic_year}
                      onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                      placeholder="2025-2026"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="program">Program</Label>
                    <Input
                      id="program"
                      data-testid="program-input"
                      value={formData.program}
                      onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                      placeholder="B.Tech"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="year_semester">Year/Semester</Label>
                    <Select
                      value={formData.year_semester}
                      onValueChange={(value) => setFormData({ ...formData, year_semester: value })}
                    >
                      <SelectTrigger data-testid="year-semester-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["I", "II", "III", "IV"].map((yr) => (
                          <SelectItem key={yr} value={yr}>
                            {yr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="section">Section</Label>
                    <Input
                      id="section"
                      data-testid="section-input"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      placeholder="A"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="day">Day of Week</Label>
                  <Select
                    value={formData.day_of_week}
                    onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
                  >
                    <SelectTrigger data-testid="day-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="slot">Time Slot</Label>
                  <Select
                    value={formData.slot_id}
                    onValueChange={(value) => setFormData({ ...formData, slot_id: value })}
                  >
                    <SelectTrigger data-testid="slot-select">
                      <SelectValue placeholder="Select time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {slots.map((slot) => (
                        <SelectItem key={slot.slot_id} value={slot.slot_id}>
                          {getSlotDisplay(slot)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={formData.subject_id}
                    onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                  >
                    <SelectTrigger data-testid="subject-select">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.subject_id} value={subject.subject_id}>
                          {subject.code} - {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="staff">Staff</Label>
                  <Select
                    value={formData.staff_id}
                    onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
                  >
                    <SelectTrigger data-testid="staff-select">
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((member) => (
                        <SelectItem key={member.staff_id} value={member.staff_id}>
                          {member.name} ({member.designation || "Staff"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="classroom">Classroom</Label>
                  <Input
                    id="classroom"
                    data-testid="classroom-input"
                    value={formData.classroom}
                    onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                    placeholder="e.g., Room 101"
                  />
                </div>

                <Button type="submit" className="w-full" data-testid="submit-timetable-entry">
                  Create Timetable Entry
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Start Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>To create a complete timetable, follow these steps:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Ensure you have added all departments, staff, and subjects</li>
                <li>Click "Add Entry" to create individual timetable entries</li>
                <li>Fill in the academic year, program, year/semester, and section</li>
                <li>Select the day and time slot for the entry</li>
                <li>Assign the subject, staff member, and classroom</li>
                <li>Repeat for all periods across all days</li>
                <li>View the complete timetable in the "View Timetable" section</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time Slots</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {slots.map((slot) => (
                  <div
                    key={slot.slot_id}
                    className={`p-3 rounded-lg border ${
                      slot.slot_type === "BREAK" || slot.slot_type === "LUNCH"
                        ? "bg-orange-50 border-orange-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="font-medium text-sm">{getSlotDisplay(slot)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {slot.start_time} - {slot.end_time}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default TimetableManager;