#!/usr/bin/env python3
"""
Exam Reader Stress Test - Test with larger files and multiple scenarios
"""

import requests
import time
import json
import base64
import io
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

# Configuration
BACKEND_URL = "https://medai-assist-8.preview.emergentagent.com/api"
TEST_USERNAME = "ur1fs"
TEST_PASSWORD = "@Fred1807"

class ExamReaderStressTester:
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

    def create_large_exam_image(self):
        """Create a larger, more complex exam image"""
        try:
            # Create a larger image with more content
            img = Image.new('RGB', (1200, 1600), color='white')
            draw = ImageDraw.Draw(img)
            
            # Try to use fonts
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
                title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
                small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
            except:
                font = ImageFont.load_default()
                title_font = ImageFont.load_default()
                small_font = ImageFont.load_default()
            
            # Header
            draw.text((50, 50), "LABORATÓRIO CLÍNICO AVANÇADO", fill='black', font=title_font)
            draw.text((50, 80), "Exames Bioquímicos Completos", fill='black', font=font)
            draw.text((50, 110), "Paciente: Maria Santos Silva", fill='black', font=font)
            draw.text((50, 140), "Data: 02/12/2024 - Hora: 08:30", fill='black', font=font)
            draw.text((50, 170), "Médico: Dr. João Cardiologista", fill='black', font=font)
            
            # Multiple exam sections
            y_pos = 220
            
            # Hemograma
            draw.text((50, y_pos), "HEMOGRAMA COMPLETO", fill='black', font=title_font)
            y_pos += 40
            draw.text((50, y_pos), "Hemoglobina: 7.2 g/dL (VR: 12.0-16.0) ↓", fill='red', font=font)
            y_pos += 25
            draw.text((50, y_pos), "Hematócrito: 22% (VR: 36-46%) ↓", fill='red', font=font)
            y_pos += 25
            draw.text((50, y_pos), "Leucócitos: 18.500/mm³ (VR: 4.000-11.000) ↑", fill='red', font=font)
            y_pos += 25
            draw.text((50, y_pos), "Neutrófilos: 85% (VR: 50-70%) ↑", fill='red', font=font)
            y_pos += 25
            draw.text((50, y_pos), "Plaquetas: 95.000/mm³ (VR: 150.000-400.000) ↓", fill='red', font=font)
            
            y_pos += 60
            
            # Bioquímica
            draw.text((50, y_pos), "BIOQUÍMICA SÉRICA", fill='black', font=title_font)
            y_pos += 40
            draw.text((50, y_pos), "Glicose: 280 mg/dL (VR: 70-100) ↑", fill='red', font=font)
            y_pos += 25
            draw.text((50, y_pos), "Ureia: 180 mg/dL (VR: 15-45) ↑", fill='red', font=font)
            y_pos += 25
            draw.text((50, y_pos), "Creatinina: 4.2 mg/dL (VR: 0.6-1.2) ↑", fill='red', font=font)
            y_pos += 25
            draw.text((50, y_pos), "TGO/AST: 150 U/L (VR: 10-40) ↑", fill='red', font=font)
            y_pos += 25
            draw.text((50, y_pos), "TGP/ALT: 180 U/L (VR: 10-40) ↑", fill='red', font=font)
            y_pos += 25
            draw.text((50, y_pos), "Bilirrubina Total: 8.5 mg/dL (VR: 0.2-1.2) ↑", fill='red', font=font)
            
            y_pos += 60
            
            # Lipidograma
            draw.text((50, y_pos), "LIPIDOGRAMA", fill='black', font=title_font)
            y_pos += 40
            draw.text((50, y_pos), "Colesterol Total: 320 mg/dL (VR: <200) ↑", fill='red', font=font)
            y_pos += 25
            draw.text((50, y_pos), "HDL: 25 mg/dL (VR: >40) ↓", fill='red', font=font)
            y_pos += 25
            draw.text((50, y_pos), "LDL: 220 mg/dL (VR: <100) ↑", fill='red', font=font)
            y_pos += 25
            draw.text((50, y_pos), "Triglicérides: 450 mg/dL (VR: <150) ↑", fill='red', font=font)
            
            y_pos += 60
            
            # Hormônios
            draw.text((50, y_pos), "PERFIL HORMONAL", fill='black', font=title_font)
            y_pos += 40
            draw.text((50, y_pos), "TSH: 0.1 mUI/L (VR: 0.4-4.0) ↓", fill='red', font=font)
            y_pos += 25
            draw.text((50, y_pos), "T4 Livre: 3.8 ng/dL (VR: 0.8-1.8) ↑", fill='red', font=font)
            y_pos += 25
            draw.text((50, y_pos), "Cortisol: 35 μg/dL (VR: 5-25) ↑", fill='red', font=font)
            
            y_pos += 60
            
            # Marcadores inflamatórios
            draw.text((50, y_pos), "MARCADORES INFLAMATÓRIOS", fill='black', font=title_font)
            y_pos += 40
            draw.text((50, y_pos), "PCR: 45 mg/L (VR: <3.0) ↑", fill='red', font=font)
            y_pos += 25
            draw.text((50, y_pos), "VHS: 85 mm/h (VR: <20) ↑", fill='red', font=font)
            
            # Footer
            y_pos += 80
            draw.text((50, y_pos), "OBSERVAÇÕES CLÍNICAS:", fill='black', font=title_font)
            y_pos += 30
            draw.text((50, y_pos), "• Quadro compatível com descompensação diabética", fill='black', font=small_font)
            y_pos += 20
            draw.text((50, y_pos), "• Insuficiência renal aguda", fill='black', font=small_font)
            y_pos += 20
            draw.text((50, y_pos), "• Hepatopatia em investigação", fill='black', font=small_font)
            y_pos += 20
            draw.text((50, y_pos), "• Hipertireoidismo", fill='black', font=small_font)
            y_pos += 20
            draw.text((50, y_pos), "• Processo inflamatório sistêmico", fill='black', font=small_font)
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            print(f"📸 Created large complex exam image ({len(img_data)} bytes)")
            return img_data
            
        except Exception as e:
            print(f"❌ Error creating large test image: {e}")
            return None

    def test_large_exam_analysis(self):
        """Test with large complex exam"""
        print(f"\n🔬 Testing Large Complex Exam Analysis...")
        
        # Create large test image
        test_image = self.create_large_exam_image()
        if not test_image:
            self.log_result("Large Exam - Image Creation", False, "Failed to create large test image")
            return False
        
        start_time = time.time()
        try:
            # Prepare multipart form data
            files = {
                'files': ('complex_exam.png', base64.b64decode(test_image), 'image/png')
            }
            data = {
                'additional_info': 'Paciente diabético com suspeita de complicações múltiplas - urgente'
            }
            
            print("📤 Uploading large complex exam image...")
            
            # Submit exam analysis request
            response = self.session.post(
                f"{BACKEND_URL}/ai/analyze-exam",
                files=files,
                data=data
            )
            submit_duration = time.time() - start_time
            
            print(f"📊 Upload response: {response.status_code}")
            if response.status_code != 200:
                self.log_result("Large Exam - Upload", False, 
                              f"Upload failed: {response.status_code} - {response.text}", submit_duration)
                return False
            
            response_data = response.json()
            task_id = response_data.get("task_id")
            
            if not task_id:
                self.log_result("Large Exam - Upload", False, 
                              "No task_id returned", submit_duration)
                return False
            
            self.log_result("Large Exam - Upload Speed", True, 
                          f"Upload successful with task_id: {task_id}", submit_duration)
            
            # Poll for results with extended timeout for complex analysis
            return self.poll_exam_analysis_with_stuck_detection(task_id, "Large Complex Exam", max_wait=120)
            
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Large Exam - Upload", False, f"Error: {str(e)}", duration)
            return False

    def test_multiple_concurrent_uploads(self):
        """Test multiple concurrent exam uploads to stress test the system"""
        print(f"\n🔬 Testing Multiple Concurrent Uploads...")
        
        # Create a simple test image
        test_image = self.create_simple_exam_image()
        if not test_image:
            self.log_result("Concurrent Test - Image Creation", False, "Failed to create test image")
            return False
        
        task_ids = []
        start_time = time.time()
        
        try:
            # Submit 3 concurrent requests
            for i in range(3):
                files = {
                    'files': (f'concurrent_exam_{i}.png', base64.b64decode(test_image), 'image/png')
                }
                data = {
                    'additional_info': f'Concurrent test {i+1}'
                }
                
                response = self.session.post(
                    f"{BACKEND_URL}/ai/analyze-exam",
                    files=files,
                    data=data
                )
                
                if response.status_code == 200:
                    task_id = response.json().get("task_id")
                    if task_id:
                        task_ids.append(task_id)
                        print(f"  📤 Submitted concurrent request {i+1}: {task_id}")
                else:
                    self.log_result(f"Concurrent Upload {i+1}", False, 
                                  f"Upload failed: {response.status_code}")
            
            submit_duration = time.time() - start_time
            
            if len(task_ids) == 3:
                self.log_result("Concurrent Uploads - Submission", True, 
                              f"All 3 uploads submitted successfully", submit_duration)
            else:
                self.log_result("Concurrent Uploads - Submission", False, 
                              f"Only {len(task_ids)}/3 uploads successful", submit_duration)
                return False
            
            # Monitor all tasks
            completed_tasks = 0
            for i, task_id in enumerate(task_ids):
                print(f"\n📊 Monitoring concurrent task {i+1}: {task_id}")
                if self.poll_exam_analysis_with_stuck_detection(task_id, f"Concurrent Task {i+1}", max_wait=60):
                    completed_tasks += 1
            
            if completed_tasks == 3:
                self.log_result("Concurrent Analysis", True, 
                              f"All 3 concurrent analyses completed successfully")
                return True
            else:
                self.log_result("Concurrent Analysis", False, 
                              f"Only {completed_tasks}/3 analyses completed")
                return False
            
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Concurrent Test", False, f"Error: {str(e)}", duration)
            return False

    def create_simple_exam_image(self):
        """Create a simple exam image for concurrent testing"""
        try:
            img = Image.new('RGB', (600, 400), color='white')
            draw = ImageDraw.Draw(img)
            
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
            except:
                font = ImageFont.load_default()
            
            draw.text((50, 50), "EXAME SIMPLES", fill='black', font=font)
            draw.text((50, 80), "Glicose: 150 mg/dL (VR: 70-100)", fill='red', font=font)
            draw.text((50, 110), "Colesterol: 250 mg/dL (VR: <200)", fill='red', font=font)
            
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            return base64.b64encode(buffer.getvalue()).decode('utf-8')
            
        except Exception as e:
            print(f"❌ Error creating simple test image: {e}")
            return None

    def poll_exam_analysis_with_stuck_detection(self, task_id, test_name, max_wait=90):
        """Poll with enhanced stuck detection at 25%"""
        print(f"📊 Polling {test_name} task {task_id}...")
        
        start_time = time.time()
        poll_count = 0
        progress_history = []
        stuck_at_25_count = 0
        
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
                
                # Track progress history
                progress_history.append({
                    'poll': poll_count,
                    'progress': progress,
                    'status': status,
                    'time': time.time() - start_time
                })
                
                print(f"  Poll #{poll_count}: Status={status}, Progress={progress}% (Time: {time.time() - start_time:.1f}s)")
                
                # Enhanced stuck detection at ~25%
                if 20 <= progress <= 30 and status == "processing":
                    stuck_at_25_count += 1
                    if stuck_at_25_count >= 5:  # Stuck for 5 consecutive polls (10 seconds)
                        self.log_result(f"{test_name} - STUCK AT 25%", False, 
                                      f"Progress stuck at {progress}% for {stuck_at_25_count} polls", time.time() - start_time)
                        # Continue monitoring but flag the issue
                else:
                    stuck_at_25_count = 0  # Reset counter if not stuck
                
                if status == "completed":
                    total_duration = time.time() - start_time
                    result = data.get("result")
                    
                    if not result:
                        self.log_result(f"{test_name} - Result", False, 
                                      "Task completed but no result returned", total_duration)
                        return False
                    
                    # Check result quality
                    altered_values = result.get("altered_values", [])
                    severity = result.get("overall_severity", "Unknown")
                    
                    self.log_result(f"{test_name} - Completion", True, 
                                  f"Completed in {poll_count} polls, {len(altered_values)} alterations, severity: {severity}", total_duration)
                    
                    return True
                
                elif status == "failed":
                    total_duration = time.time() - start_time
                    error = data.get("error", "Unknown error")
                    self.log_result(f"{test_name} - Completion", False, 
                                  f"Task failed: {error}", total_duration)
                    
                    print(f"  📊 Progress History: {progress_history}")
                    return False
                
                elif status in ["pending", "processing"]:
                    # Check timeout
                    if time.time() - start_time > max_wait:
                        self.log_result(f"{test_name} - Timeout", False, 
                                      f"Task timed out after {max_wait}s at {progress}%", max_wait)
                        
                        print(f"  📊 Progress History at Timeout: {progress_history}")
                        return False
                    
                    # Wait before next poll
                    time.sleep(2)
                    continue
                
                else:
                    self.log_result(f"{test_name} - Status", False, 
                                  f"Unknown status: {status}", time.time() - start_time)
                    return False
                    
        except Exception as e:
            duration = time.time() - start_time
            self.log_result(f"{test_name} - Polling", False, f"Polling error: {str(e)}", duration)
            return False

    def run_stress_tests(self):
        """Run all stress tests"""
        print("🚀 Starting Meduf AI Exam Reader Stress Tests")
        print("=" * 60)
        
        # Authentication
        if not self.authenticate():
            print("\n❌ Authentication failed - cannot proceed with tests")
            return False
        
        tests_passed = 0
        total_tests = 0
        
        # Test 1: Large complex exam
        total_tests += 1
        if self.test_large_exam_analysis():
            tests_passed += 1
        
        # Test 2: Multiple concurrent uploads
        total_tests += 1
        if self.test_multiple_concurrent_uploads():
            tests_passed += 1
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📊 STRESS TEST SUMMARY: {tests_passed}/{total_tests} tests passed")
        
        if tests_passed == total_tests:
            print("🎉 ALL STRESS TESTS PASSED!")
            return True
        else:
            print(f"⚠️  {total_tests - tests_passed} tests failed - see details above")
            return False

def main():
    """Main test execution"""
    tester = ExamReaderStressTester()
    success = tester.run_stress_tests()
    
    # Print detailed results
    print("\n📋 DETAILED STRESS TEST RESULTS:")
    print("-" * 40)
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        duration = f" ({result['duration']:.2f}s)" if result["duration"] else ""
        print(f"{status} {result['test']}: {result['message']}{duration}")
    
    return success

if __name__ == "__main__":
    main()