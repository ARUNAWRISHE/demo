#!/usr/bin/env python3

import requests
import sys
import json
import subprocess
from datetime import datetime
from typing import Dict, Any, Optional

class TimetableAPITester:
    def __init__(self, base_url="https://class-scheduler-114.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Store created entities for cleanup
        self.created_departments = []
        self.created_staff = []
        self.created_subjects = []
        self.created_timetable_entries = []

    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })

    def create_test_user_session(self) -> bool:
        """Create test user and session in MongoDB"""
        try:
            timestamp = int(datetime.now().timestamp())
            user_id = f"test-user-{timestamp}"
            session_token = f"test_session_{timestamp}"
            
            # MongoDB script to create test user and session
            mongo_script = f"""
use('test_database');
var userId = '{user_id}';
var sessionToken = '{session_token}';
db.users.insertOne({{
  user_id: userId,
  email: 'test.user.{timestamp}@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  created_at: new Date()
}});
db.user_sessions.insertOne({{
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});
print('SUCCESS: User and session created');
"""
            
            result = subprocess.run(
                ["mongosh", "--eval", mongo_script],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0 and "SUCCESS" in result.stdout:
                self.session_token = session_token
                self.user_id = user_id
                self.log_result("Create Test User Session", True)
                return True
            else:
                self.log_result("Create Test User Session", False, f"MongoDB error: {result.stderr}")
                return False
                
        except Exception as e:
            self.log_result("Create Test User Session", False, str(e))
            return False

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, expected_status: int = 200) -> tuple[bool, Dict]:
        """Make authenticated API request"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.session_token}'
        }
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}
            
            return success, response_data
            
        except Exception as e:
            return False, {"error": str(e)}

    def test_auth_endpoints(self) -> bool:
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints...")
        
        # Test /auth/me endpoint
        success, data = self.make_request('GET', 'auth/me')
        if success and data.get('user_id') == self.user_id:
            self.log_result("GET /auth/me", True)
        else:
            self.log_result("GET /auth/me", False, f"Expected user_id {self.user_id}, got {data}")
            return False
        
        return True

    def test_department_endpoints(self) -> bool:
        """Test department CRUD operations"""
        print("\n🏢 Testing Department Endpoints...")
        
        # Test GET departments (empty)
        success, data = self.make_request('GET', 'departments')
        self.log_result("GET /departments (empty)", success and isinstance(data, list))
        
        # Test CREATE department
        dept_data = {
            "name": "Computer Science",
            "code": "CS",
            "description": "Computer Science Department"
        }
        success, response = self.make_request('POST', 'departments', dept_data, 200)
        if success and response.get('department_id'):
            dept_id = response['department_id']
            self.created_departments.append(dept_id)
            self.log_result("POST /departments", True)
        else:
            self.log_result("POST /departments", False, str(response))
            return False
        
        # Test GET departments (with data)
        success, data = self.make_request('GET', 'departments')
        if success and len(data) > 0 and data[0].get('name') == 'Computer Science':
            self.log_result("GET /departments (with data)", True)
        else:
            self.log_result("GET /departments (with data)", False, "Department not found in list")
        
        # Test DELETE department
        success, response = self.make_request('DELETE', f'departments/{dept_id}')
        if success:
            self.log_result("DELETE /departments/{id}", True)
            self.created_departments.remove(dept_id)
        else:
            self.log_result("DELETE /departments/{id}", False, str(response))
        
        return True

    def test_staff_endpoints(self) -> bool:
        """Test staff CRUD operations"""
        print("\n👥 Testing Staff Endpoints...")
        
        # First create a department for staff
        dept_data = {"name": "Test Department", "code": "TD", "description": "Test"}
        success, dept_response = self.make_request('POST', 'departments', dept_data)
        if not success:
            self.log_result("Staff Test Setup (Department)", False, "Failed to create test department")
            return False
        
        dept_id = dept_response['department_id']
        self.created_departments.append(dept_id)
        
        # Test GET staff (empty)
        success, data = self.make_request('GET', 'staff')
        self.log_result("GET /staff (empty)", success and isinstance(data, list))
        
        # Test CREATE staff
        staff_data = {
            "name": "John Doe",
            "email": "john.doe@example.com",
            "department_id": dept_id,
            "designation": "Professor"
        }
        success, response = self.make_request('POST', 'staff', staff_data)
        if success and response.get('staff_id'):
            staff_id = response['staff_id']
            self.created_staff.append(staff_id)
            self.log_result("POST /staff", True)
        else:
            self.log_result("POST /staff", False, str(response))
            return False
        
        # Test GET staff (with data)
        success, data = self.make_request('GET', 'staff')
        if success and len(data) > 0 and data[0].get('name') == 'John Doe':
            self.log_result("GET /staff (with data)", True)
        else:
            self.log_result("GET /staff (with data)", False, "Staff not found in list")
        
        # Test DELETE staff
        success, response = self.make_request('DELETE', f'staff/{staff_id}')
        if success:
            self.log_result("DELETE /staff/{id}", True)
            self.created_staff.remove(staff_id)
        else:
            self.log_result("DELETE /staff/{id}", False, str(response))
        
        return True

    def test_subject_endpoints(self) -> bool:
        """Test subject CRUD operations"""
        print("\n📚 Testing Subject Endpoints...")
        
        # First create a department for subjects
        dept_data = {"name": "Test Department", "code": "TD", "description": "Test"}
        success, dept_response = self.make_request('POST', 'departments', dept_data)
        if not success:
            self.log_result("Subject Test Setup (Department)", False, "Failed to create test department")
            return False
        
        dept_id = dept_response['department_id']
        self.created_departments.append(dept_id)
        
        # Test GET subjects (empty)
        success, data = self.make_request('GET', 'subjects')
        self.log_result("GET /subjects (empty)", success and isinstance(data, list))
        
        # Test CREATE subject
        subject_data = {
            "code": "CS101",
            "name": "Data Structures",
            "credits": 3,
            "department_id": dept_id,
            "subject_type": "REGULAR"
        }
        success, response = self.make_request('POST', 'subjects', subject_data)
        if success and response.get('subject_id'):
            subject_id = response['subject_id']
            self.created_subjects.append(subject_id)
            self.log_result("POST /subjects", True)
        else:
            self.log_result("POST /subjects", False, str(response))
            return False
        
        # Test GET subjects (with data)
        success, data = self.make_request('GET', 'subjects')
        if success and len(data) > 0 and data[0].get('code') == 'CS101':
            self.log_result("GET /subjects (with data)", True)
        else:
            self.log_result("GET /subjects (with data)", False, "Subject not found in list")
        
        # Test DELETE subject
        success, response = self.make_request('DELETE', f'subjects/{subject_id}')
        if success:
            self.log_result("DELETE /subjects/{id}", True)
            self.created_subjects.remove(subject_id)
        else:
            self.log_result("DELETE /subjects/{id}", False, str(response))
        
        return True

    def test_time_slots_endpoint(self) -> bool:
        """Test time slots endpoint"""
        print("\n⏰ Testing Time Slots Endpoint...")
        
        # Test GET time-slots (should auto-create default slots)
        success, data = self.make_request('GET', 'time-slots')
        if success and isinstance(data, list) and len(data) > 0:
            # Check if default slots are created
            has_class_slots = any(slot.get('slot_type') == 'CLASS' for slot in data)
            has_break_slots = any(slot.get('slot_type') in ['BREAK', 'LUNCH'] for slot in data)
            
            if has_class_slots and has_break_slots:
                self.log_result("GET /time-slots (auto-creation)", True)
            else:
                self.log_result("GET /time-slots (auto-creation)", False, "Missing expected slot types")
        else:
            self.log_result("GET /time-slots (auto-creation)", False, str(data))
        
        return True

    def test_timetable_endpoints(self) -> bool:
        """Test timetable CRUD operations"""
        print("\n📅 Testing Timetable Endpoints...")
        
        # Setup: Create department, staff, subject, and get time slots
        dept_data = {"name": "Test Department", "code": "TD", "description": "Test"}
        success, dept_response = self.make_request('POST', 'departments', dept_data)
        if not success:
            self.log_result("Timetable Test Setup (Department)", False, "Failed to create test department")
            return False
        
        dept_id = dept_response['department_id']
        self.created_departments.append(dept_id)
        
        # Create staff
        staff_data = {
            "name": "Test Teacher",
            "email": "teacher@example.com",
            "department_id": dept_id,
            "designation": "Professor"
        }
        success, staff_response = self.make_request('POST', 'staff', staff_data)
        if not success:
            self.log_result("Timetable Test Setup (Staff)", False, "Failed to create test staff")
            return False
        
        staff_id = staff_response['staff_id']
        self.created_staff.append(staff_id)
        
        # Create subject
        subject_data = {
            "code": "TEST101",
            "name": "Test Subject",
            "credits": 3,
            "department_id": dept_id,
            "subject_type": "REGULAR"
        }
        success, subject_response = self.make_request('POST', 'subjects', subject_data)
        if not success:
            self.log_result("Timetable Test Setup (Subject)", False, "Failed to create test subject")
            return False
        
        subject_id = subject_response['subject_id']
        self.created_subjects.append(subject_id)
        
        # Get time slots
        success, slots_data = self.make_request('GET', 'time-slots')
        if not success or not slots_data:
            self.log_result("Timetable Test Setup (Time Slots)", False, "Failed to get time slots")
            return False
        
        # Find a class slot
        class_slot = next((slot for slot in slots_data if slot.get('slot_type') == 'CLASS'), None)
        if not class_slot:
            self.log_result("Timetable Test Setup (Class Slot)", False, "No class slot found")
            return False
        
        slot_id = class_slot['slot_id']
        
        # Test GET timetable (empty)
        success, data = self.make_request('GET', 'timetable')
        self.log_result("GET /timetable (empty)", success and isinstance(data, list))
        
        # Test CREATE timetable entry
        timetable_data = {
            "academic_year": "2025-2026",
            "program": "B.Tech",
            "year_semester": "I",
            "section": "A",
            "day_of_week": "Monday",
            "slot_id": slot_id,
            "subject_id": subject_id,
            "staff_id": staff_id,
            "classroom": "Room 101",
            "entry_type": "CLASS"
        }
        success, response = self.make_request('POST', 'timetable', timetable_data)
        if success and response.get('entry_id'):
            entry_id = response['entry_id']
            self.created_timetable_entries.append(entry_id)
            self.log_result("POST /timetable", True)
        else:
            self.log_result("POST /timetable", False, str(response))
            return False
        
        # Test GET timetable (with data)
        success, data = self.make_request('GET', 'timetable')
        if success and len(data) > 0 and data[0].get('academic_year') == '2025-2026':
            self.log_result("GET /timetable (with data)", True)
        else:
            self.log_result("GET /timetable (with data)", False, "Timetable entry not found")
        
        # Test GET timetable with filters
        success, data = self.make_request('GET', 'timetable?academic_year=2025-2026&program=B.Tech')
        if success and len(data) > 0:
            self.log_result("GET /timetable (with filters)", True)
        else:
            self.log_result("GET /timetable (with filters)", False, "Filtered timetable not found")
        
        # Test DELETE timetable entry
        success, response = self.make_request('DELETE', f'timetable/{entry_id}')
        if success:
            self.log_result("DELETE /timetable/{id}", True)
            self.created_timetable_entries.remove(entry_id)
        else:
            self.log_result("DELETE /timetable/{id}", False, str(response))
        
        return True

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Clean up timetable entries
        for entry_id in self.created_timetable_entries[:]:
            success, _ = self.make_request('DELETE', f'timetable/{entry_id}')
            if success:
                self.created_timetable_entries.remove(entry_id)
        
        # Clean up subjects
        for subject_id in self.created_subjects[:]:
            success, _ = self.make_request('DELETE', f'subjects/{subject_id}')
            if success:
                self.created_subjects.remove(subject_id)
        
        # Clean up staff
        for staff_id in self.created_staff[:]:
            success, _ = self.make_request('DELETE', f'staff/{staff_id}')
            if success:
                self.created_staff.remove(staff_id)
        
        # Clean up departments
        for dept_id in self.created_departments[:]:
            success, _ = self.make_request('DELETE', f'departments/{dept_id}')
            if success:
                self.created_departments.remove(dept_id)
        
        # Clean up test user and session from MongoDB
        if self.user_id:
            try:
                mongo_script = f"""
use('test_database');
db.users.deleteOne({{user_id: '{self.user_id}'}});
db.user_sessions.deleteOne({{user_id: '{self.user_id}'}});
print('Test user and session cleaned up');
"""
                subprocess.run(["mongosh", "--eval", mongo_script], capture_output=True, timeout=10)
            except Exception as e:
                print(f"Warning: Failed to cleanup test user: {e}")

    def run_all_tests(self) -> bool:
        """Run all backend tests"""
        print("🚀 Starting Timetable Management Platform Backend Tests")
        print(f"Testing against: {self.base_url}")
        
        # Create test user session
        if not self.create_test_user_session():
            print("❌ Failed to create test user session. Cannot proceed with tests.")
            return False
        
        try:
            # Run all test suites
            auth_success = self.test_auth_endpoints()
            dept_success = self.test_department_endpoints()
            staff_success = self.test_staff_endpoints()
            subject_success = self.test_subject_endpoints()
            slots_success = self.test_time_slots_endpoint()
            timetable_success = self.test_timetable_endpoints()
            
            # Print summary
            print(f"\n📊 Test Summary:")
            print(f"Tests run: {self.tests_run}")
            print(f"Tests passed: {self.tests_passed}")
            print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
            
            overall_success = all([auth_success, dept_success, staff_success, subject_success, slots_success, timetable_success])
            
            if overall_success:
                print("✅ All backend tests passed!")
            else:
                print("❌ Some backend tests failed!")
                
            return overall_success
            
        finally:
            # Always cleanup
            self.cleanup_test_data()

def main():
    tester = TimetableAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())