#!/usr/bin/env python3
"""
Exam Reader Test Suite for Meduf AI
Tests the medical image analysis functionality that is failing at ~25% progress
"""

import requests
import time
import json
import base64
import io
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

# Configuration
BACKEND_URL = "https://meduf-ai-doctor.preview.emergentagent.com/api"
TEST_USERNAME = "ur1fs"
TEST_PASSWORD = "@Fred1807"

class ExamReaderTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, duration=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        duration_str = f" ({duration:.2f}s)" if duration else ""
        result = f"{status}: {test_name} - {message}{duration_str}"
        print(result)
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "duration": duration,
            "timestamp": datetime.now().isoformat()
        })
        
    def authenticate(self):
        """Login and get authentication token"""
        print(f"\n🔐 Authenticating with {TEST_USERNAME}...")
        
        start_time = time.time()
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                data={
                    "username": TEST_USERNAME,
                    "password": TEST_PASSWORD
                }
            )
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                self.log_result("Authentication", True, f"Login successful for {data.get('user_name')}", duration)
                return True
            else:
                self.log_result("Authentication", False, f"Login failed: {response.status_code} - {response.text}", duration)
                return False
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Authentication", False, f"Login error: {str(e)}", duration)
            return False

    def create_test_exam_image(self):
        """Create a simple test exam image with lab results"""
        try:
            # Create a simple lab exam image
            img = Image.new('RGB', (800, 600), color='white')
            draw = ImageDraw.Draw(img)
            
            # Try to use a font, fallback to default if not available
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
                title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
            except:
                font = ImageFont.load_default()
                title_font = ImageFont.load_default()
            
            # Draw exam content
            draw.text((50, 50), "LABORATÓRIO CLÍNICO TESTE", fill='black', font=title_font)
            draw.text((50, 80), "Exame: Hemograma Completo", fill='black', font=font)
            draw.text((50, 110), "Paciente: João Silva", fill='black', font=font)
            draw.text((50, 140), "Data: 02/12/2024", fill='black', font=font)
            
            # Lab values
            draw.text((50, 180), "RESULTADOS:", fill='black', font=title_font)
            draw.text((50, 210), "Hemoglobina: 8.5 g/dL (VR: 12.0-16.0)", fill='red', font=font)
            draw.text((50, 240), "Hematócrito: 25% (VR: 36-46%)", fill='red', font=font)
            draw.text((50, 270), "Leucócitos: 15.000/mm³ (VR: 4.000-11.000)", fill='red', font=font)
            draw.text((50, 300), "Plaquetas: 450.000/mm³ (VR: 150.000-400.000)", fill='red', font=font)
            draw.text((50, 330), "Glicose: 180 mg/dL (VR: 70-100)", fill='red', font=font)
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            print("📸 Created test exam image with abnormal lab values")
            return img_data
            
        except Exception as e:
            print(f"❌ Error creating test image: {e}")
            return None

    def test_exam_upload_and_analysis(self):
        """Test exam upload and analysis - Main functionality"""
        print(f"\n🔬 Testing Exam Reader - Upload and Analysis...")
        
        # Create test image
        test_image = self.create_test_exam_image()
        if not test_image:
            self.log_result("Exam Reader - Image Creation", False, "Failed to create test image")
            return False
        
        start_time = time.time()
        try:
            # Prepare multipart form data
            files = {
                'files': ('test_exam.png', base64.b64decode(test_image), 'image/png')
            }
            data = {
                'additional_info': 'Paciente com suspeita de anemia e diabetes'
            }
            
            print("📤 Uploading exam image...")
            
            # Step 1: Submit exam analysis request
            response = self.session.post(
                f"{BACKEND_URL}/ai/analyze-exam",
                files=files,
                data=data
            )
            submit_duration = time.time() - start_time
            
            print(f"📊 Upload response: {response.status_code}")
            if response.status_code != 200:
                self.log_result("Exam Reader - Upload", False, 
                              f"Upload failed: {response.status_code} - {response.text}", submit_duration)
                return False
            
            response_data = response.json()
            task_id = response_data.get("task_id")
            
            if not task_id:
                self.log_result("Exam Reader - Upload", False, 
                              "No task_id returned", submit_duration)
                return False
            
            # Check if response was immediate (< 3 seconds for file upload)
            if submit_duration > 3.0:
                self.log_result("Exam Reader - Upload Speed", False, 
                              f"Upload too slow: {submit_duration:.2f}s (should be < 3s)", submit_duration)
            else:
                self.log_result("Exam Reader - Upload Speed", True, 
                              f"Upload successful with task_id: {task_id}", submit_duration)
            
            # Step 2: Poll for results with detailed progress monitoring
            return self.poll_exam_analysis_result(task_id, "Exam Reader Analysis")
            
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Exam Reader - Upload", False, f"Error: {str(e)}", duration)
            return False

    def poll_exam_analysis_result(self, task_id, test_name, max_wait=90):
        """Poll exam analysis task status with detailed progress monitoring"""
        print(f"📊 Polling exam analysis task {task_id}...")
        
        start_time = time.time()
        poll_count = 0
        progress_history = []
        
        try:
            while True:
                poll_count += 1
                poll_start = time.time()
                
                response = self.session.get(f"{BACKEND_URL}/ai/tasks/{task_id}")
                poll_duration = time.time() - poll_start
                
                if response.status_code != 200:
                    self.log_result(f"{test_name} - Polling", False, 
                                  f"Poll failed: {response.status_code} - {response.text}", poll_duration)
                    return False
                
                data = response.json()
                status = data.get("status")
                progress = data.get("progress", 0)
                
                # Track progress history to detect if it's stuck at ~25%
                progress_history.append({
                    'poll': poll_count,
                    'progress': progress,
                    'status': status,
                    'time': time.time() - start_time
                })
                
                print(f"  Poll #{poll_count}: Status={status}, Progress={progress}% (Time: {time.time() - start_time:.1f}s)")
                
                # Check for stuck at ~25% issue
                if poll_count >= 5:  # After 5 polls (10 seconds)
                    recent_progress = [p['progress'] for p in progress_history[-5:]]
                    if all(20 <= p <= 30 for p in recent_progress) and status == "processing":
                        self.log_result(f"{test_name} - Progress Stuck", False, 
                                      f"Progress stuck at ~25% for {len(recent_progress)} polls", time.time() - start_time)
                        # Continue polling but flag the issue
                
                if status == "completed":
                    total_duration = time.time() - start_time
                    result = data.get("result")
                    
                    if not result:
                        self.log_result(f"{test_name} - Result", False, 
                                      "Task completed but no result returned", total_duration)
                        return False
                    
                    # Validate exam analysis result structure
                    expected_fields = ["exam_type", "clinical_interpretation", "overall_severity", "recommendations"]
                    missing_fields = []
                    for field in expected_fields:
                        if field not in result:
                            missing_fields.append(field)
                    
                    if missing_fields:
                        self.log_result(f"{test_name} - Result Structure", False, 
                                      f"Missing expected fields: {missing_fields}", total_duration)
                    else:
                        self.log_result(f"{test_name} - Result Structure", True, 
                                      f"All expected fields present: {expected_fields}", total_duration)
                    
                    # Check if analysis detected the abnormal values we put in the test image
                    altered_values = result.get("altered_values", [])
                    if altered_values:
                        self.log_result(f"{test_name} - Analysis Quality", True, 
                                      f"Detected {len(altered_values)} altered values", total_duration)
                    else:
                        self.log_result(f"{test_name} - Analysis Quality", False, 
                                      "No altered values detected in test exam", total_duration)
                    
                    self.log_result(f"{test_name} - Completion", True, 
                                  f"Task completed successfully in {poll_count} polls", total_duration)
                    
                    # Log result summary
                    print(f"  📋 Exam Type: {result.get('exam_type', 'Unknown')}")
                    print(f"  📋 Severity: {result.get('overall_severity', 'Unknown')}")
                    print(f"  📋 Altered Values: {len(result.get('altered_values', []))}")
                    
                    return True
                
                elif status == "failed":
                    total_duration = time.time() - start_time
                    error = data.get("error", "Unknown error")
                    self.log_result(f"{test_name} - Completion", False, 
                                  f"Task failed: {error}", total_duration)
                    
                    # Log progress history for debugging
                    print(f"  📊 Progress History: {progress_history}")
                    return False
                
                elif status in ["pending", "processing"]:
                    # Check timeout
                    if time.time() - start_time > max_wait:
                        self.log_result(f"{test_name} - Timeout", False, 
                                      f"Task timed out after {max_wait}s at {progress}%", max_wait)
                        
                        # Log progress history for debugging the 25% stuck issue
                        print(f"  📊 Progress History at Timeout: {progress_history}")
                        return False
                    
                    # Wait before next poll (2 seconds)
                    time.sleep(2)
                    continue
                
                else:
                    self.log_result(f"{test_name} - Status", False, 
                                  f"Unknown status: {status}", time.time() - start_time)
                    return False
                    
        except Exception as e:
            duration = time.time() - start_time
            self.log_result(f"{test_name} - Polling", False, f"Polling error: {str(e)}", duration)
            print(f"  📊 Progress History at Error: {progress_history}")
            return False

    def test_backend_logs_during_analysis(self):
        """Check backend logs for errors during analysis"""
        print(f"\n📋 Checking Backend Logs...")
        
        try:
            # This would be run during or after an analysis to check for errors
            # For now, we'll just check if we can access the logs
            import subprocess
            result = subprocess.run(
                ["tail", "-n", "20", "/var/log/supervisor/backend.err.log"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                log_content = result.stdout
                if "error" in log_content.lower() or "exception" in log_content.lower():
                    self.log_result("Backend Logs - Error Check", False, 
                                  "Errors found in backend logs")
                    print(f"  📋 Recent errors: {log_content}")
                else:
                    self.log_result("Backend Logs - Error Check", True, 
                                  "No recent errors in backend logs")
                return True
            else:
                self.log_result("Backend Logs - Access", False, 
                              "Could not access backend logs")
                return False
                
        except Exception as e:
            self.log_result("Backend Logs - Check", False, f"Error checking logs: {str(e)}")
            return False

    def run_exam_reader_tests(self):
        """Run all exam reader tests"""
        print("🚀 Starting Meduf AI Exam Reader Tests")
        print("=" * 60)
        
        # Step 1: Authentication
        if not self.authenticate():
            print("\n❌ Authentication failed - cannot proceed with tests")
            return False
        
        # Step 2: Test exam analysis functionality
        tests_passed = 0
        total_tests = 0
        
        # Test 1: Main exam upload and analysis
        total_tests += 1
        if self.test_exam_upload_and_analysis():
            tests_passed += 1
        
        # Test 2: Backend logs check
        total_tests += 1
        if self.test_backend_logs_during_analysis():
            tests_passed += 1
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📊 EXAM READER TEST SUMMARY: {tests_passed}/{total_tests} tests passed")
        
        if tests_passed == total_tests:
            print("🎉 ALL EXAM READER TESTS PASSED!")
            return True
        else:
            print(f"⚠️  {total_tests - tests_passed} tests failed - see details above")
            return False

def main():
    """Main test execution"""
    tester = ExamReaderTester()
    success = tester.run_exam_reader_tests()
    
    # Print detailed results
    print("\n📋 DETAILED TEST RESULTS:")
    print("-" * 40)
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        duration = f" ({result['duration']:.2f}s)" if result["duration"] else ""
        print(f"{status} {result['test']}: {result['message']}{duration}")
    
    return success

if __name__ == "__main__":
    main()