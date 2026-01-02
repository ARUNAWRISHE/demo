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

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function TimetableView({ user }) {
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [slots, setSlots] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    academic_year: "2025-2026",
    program: "B.Tech",
    year_semester: "I",
    section: "A",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, [filters]);

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
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
      setLoading(false);
    }
  };

  const fetchTimetable = async () => {
    try {
      const params = new URLSearchParams(filters);
      const response = await axios.get(`${API}/timetable?${params}`, {
        withCredentials: true,
      });
      setTimetableEntries(response.data);
    } catch (error) {
      console.error("Error fetching timetable:", error);
      toast.error("Failed to load timetable");
    }
  };

  const getEntryForDayAndSlot = (day, slotId) => {
    return timetableEntries.find(
      (entry) => entry.day_of_week === day && entry.slot_id === slotId
    );
  };

  const getSubjectName = (id) => {
    if (!id) return "-";
    const subject = subjects.find((s) => s.subject_id === id);
    return subject ? subject.code : "-";
  };

  const getStaffName = (id) => {
    if (!id) return "-";
    const member = staff.find((s) => s.staff_id === id);
    return member ? member.name.split(' ').slice(0, 2).join(' ') : "-";
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    try {
      await axios.delete(`${API}/timetable/${entryId}`, { withCredentials: true });
      toast.success("Entry deleted successfully");
      fetchTimetable();
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete entry");
    }
  };

  const classSlots = slots.filter((s) => s.slot_type === "CLASS");

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="timetable-view-page">
        <div>
          <h1 className="text-3xl font-bold text-foreground">View Timetable</h1>
          <p className="text-muted-foreground mt-1">View and manage existing timetables</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="filter_year">Academic Year</Label>
                <Input
                  id="filter_year"
                  data-testid="filter-academic-year"
                  value={filters.academic_year}
                  onChange={(e) => setFilters({ ...filters, academic_year: e.target.value })}
                  placeholder="2025-2026"
                />
              </div>
              <div>
                <Label htmlFor="filter_program">Program</Label>
                <Input
                  id="filter_program"
                  data-testid="filter-program"
                  value={filters.program}
                  onChange={(e) => setFilters({ ...filters, program: e.target.value })}
                  placeholder="B.Tech"
                />
              </div>
              <div>
                <Label htmlFor="filter_semester">Year/Semester</Label>
                <Select
                  value={filters.year_semester}
                  onValueChange={(value) => setFilters({ ...filters, year_semester: value })}
                >
                  <SelectTrigger data-testid="filter-year-semester">
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
                <Label htmlFor="filter_section">Section</Label>
                <Input
                  id="filter_section"
                  data-testid="filter-section"
                  value={filters.section}
                  onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                  placeholder="A"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Timetable for {filters.program} - Year {filters.year_semester}, Section {filters.section}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : classSlots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No time slots configured</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" data-testid="timetable-table">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-3 text-left font-semibold text-sm">Day / Period</th>
                      {classSlots.map((slot) => (
                        <th key={slot.slot_id} className="border border-border p-3 text-center font-semibold text-sm min-w-[140px]">
                          <div>Period {slot.period_number}</div>
                          <div className="text-xs font-normal text-muted-foreground mt-1">
                            {slot.start_time} - {slot.end_time}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day) => (
                      <tr key={day}>
                        <td className="border border-border p-3 font-semibold bg-muted text-sm">{day}</td>
                        {classSlots.map((slot) => {
                          const entry = getEntryForDayAndSlot(day, slot.slot_id);
                          return (
                            <td key={slot.slot_id} className="border border-border p-2 text-center align-top">
                              {entry ? (
                                <div className="bg-blue-50 p-2 rounded space-y-1 min-h-[80px] relative group">
                                  <div className="font-medium text-sm text-primary">
                                    {getSubjectName(entry.subject_id)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {getStaffName(entry.staff_id)}
                                  </div>
                                  {entry.classroom && (
                                    <div className="text-xs text-muted-foreground">
                                      {entry.classroom}
                                    </div>
                                  )}
                                  <button
                                    onClick={() => handleDeleteEntry(entry.entry_id)}
                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                    data-testid={`delete-entry-${entry.entry_id}`}
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground py-4">-</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {timetableEntries.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                No timetable entries found for the selected filters. Create entries in the Timetable Manager.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default TimetableView;