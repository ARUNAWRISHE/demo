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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function TimeSlots({ user }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    start_time: "",
    end_time: "",
    period_number: "",
    slot_type: "CLASS",
  });

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const response = await axios.get(`${API}/time-slots`, { withCredentials: true });
      setSlots(response.data);
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast.error("Failed to load time slots");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/time-slots`, {
        ...formData,
        period_number: parseInt(formData.period_number),
      }, { withCredentials: true });
      toast.success("Time slot created successfully");
      setIsDialogOpen(false);
      setFormData({ start_time: "", end_time: "", period_number: "", slot_type: "CLASS" });
      fetchSlots();
    } catch (error) {
      console.error("Error creating time slot:", error);
      toast.error("Failed to create time slot");
    }
  };

  const handleDelete = async (slotId) => {
    if (!window.confirm("Are you sure you want to delete this time slot?")) return;

    try {
      await axios.delete(`${API}/time-slots/${slotId}`, { withCredentials: true });
      toast.success("Time slot deleted successfully");
      fetchSlots();
    } catch (error) {
      console.error("Error deleting time slot:", error);
      toast.error("Failed to delete time slot");
    }
  };

  const getSlotDisplay = (slot) => {
    if (slot.slot_type === "BREAK" || slot.slot_type === "LUNCH") {
      return `${slot.start_time} - ${slot.end_time} (${slot.slot_type})`;
    }
    return `Period ${slot.period_number} (${slot.start_time} - ${slot.end_time})`;
  };

  return (
    <Layout user={user}>
      <div className="space-y-6" data-testid="time-slots-page">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Time Slots</h1>
            <p className="text-muted-foreground mt-1">Manage class timings and break periods</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-time-slot-button">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Time Slot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Time Slot</DialogTitle>
                <DialogDescription>Create a new time slot for the timetable</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      data-testid="start-time-input"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      data-testid="end-time-input"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="period_number">Period Number</Label>
                  <Input
                    id="period_number"
                    type="number"
                    data-testid="period-number-input"
                    value={formData.period_number}
                    onChange={(e) => setFormData({ ...formData, period_number: e.target.value })}
                    placeholder="1, 2, 3... (0 for breaks)"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slot_type">Slot Type</Label>
                  <Select
                    value={formData.slot_type}
                    onValueChange={(value) => setFormData({ ...formData, slot_type: value })}
                  >
                    <SelectTrigger data-testid="slot-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLASS">Class Period</SelectItem>
                      <SelectItem value="BREAK">Short Break</SelectItem>
                      <SelectItem value="LUNCH">Lunch Break</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" data-testid="submit-time-slot">
                  Create Time Slot
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Time Slots</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : slots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No time slots found. Add your first time slot to get started.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Display</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Period Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slots.sort((a, b) => a.start_time.localeCompare(b.start_time)).map((slot) => (
                      <TableRow key={slot.slot_id} data-testid={`slot-row-${slot.slot_id}`}>
                        <TableCell className="font-medium">{getSlotDisplay(slot)}</TableCell>
                        <TableCell>{slot.start_time}</TableCell>
                        <TableCell>{slot.end_time}</TableCell>
                        <TableCell>{slot.period_number}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            slot.slot_type === 'CLASS' ? 'bg-blue-100 text-blue-700' :
                            slot.slot_type === 'LUNCH' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {slot.slot_type}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(slot.slot_id)}
                            data-testid={`delete-slot-${slot.slot_id}`}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default TimeSlots;
