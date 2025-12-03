#!/usr/bin/env python3
"""
CRITICAL STABILITY TEST - Meduf AI Medical System
Tests each functionality 3 times as required for medical system stability
ZERO FAILURE TOLERANCE for medical applications
"""

import requests
import time
import json
from datetime import datetime

# Configuration from environment
BACKEND_URL = "https://demobackend.emergentagent.com/api"
TEST_USERNAME = "ur1fs"
TEST_PASSWORD = "@Fred1807"

class CriticalStabilityTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        
    def log_result(self, test_name, success, message, duration=None):
        """Log test result with medical system criticality"""
        status = "✅ PASS" if success else "❌ CRITICAL FAILURE"
        duration_str = f" ({duration:.3f}s)" if duration else ""
        result = f"{status}: {test_name} - {message}{duration_str}"
        print(result)
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "duration": duration,
            "timestamp": datetime.now().isoformat()
        })
        
        self.total_tests += 1
        if success:
            self.passed_tests += 1
        else:
            self.failed_tests += 1
        
    def authenticate(self):
        """Login with provided credentials"""
        print(f"\n🔐 Authenticating with {TEST_USERNAME}...")
        
        start_time = time.time()
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                data={
                    "username": TEST_USERNAME,
                    "password": TEST_PASSWORD
                },
                timeout=10
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
    
    def test_diagnosis_simple_3x(self):
        """Test Diagnóstico Simples 3 times - CRITICAL MEDICAL FUNCTIONALITY"""
        print(f"\n🩺 CRITICAL TEST: Diagnóstico Simples (3x repetitions)")
        print("=" * 60)
        
        # Exact test data from review request
        test_data = {
            "queixa": "Febre alta há 2 dias",
            "idade": "30", 
            "sexo": "M"
        }
        
        success_count = 0
        
        for attempt in range(1, 4):  # 3 attempts
            print(f"\n📋 Attempt {attempt}/3: Diagnóstico Simples")
            
            start_time = time.time()
            try:
                # Step 1: Submit diagnosis request
                response = self.session.post(
                    f"{BACKEND_URL}/ai/consensus/diagnosis",
                    json=test_data,
                    timeout=30
                )
                submit_duration = time.time() - start_time
                
                if response.status_code != 200:
                    self.log_result(f"Diagnóstico Simples #{attempt} - Submit", False, 
                                  f"HTTP {response.status_code}: {response.text}", submit_duration)
                    continue
                
                data = response.json()
                task_id = data.get("task_id")
                
                if not task_id:
                    self.log_result(f"Diagnóstico Simples #{attempt} - Submit", False, 
                                  "No task_id returned", submit_duration)
                    continue
                
                # Verify immediate response (< 1s requirement)
                if submit_duration > 1.0:
                    self.log_result(f"Diagnóstico Simples #{attempt} - Response Time", False, 
                                  f"Too slow: {submit_duration:.3f}s (must be < 1s)", submit_duration)
                else:
                    self.log_result(f"Diagnóstico Simples #{attempt} - Response Time", True, 
                                  f"Immediate response: {submit_duration:.3f}s", submit_duration)
                
                # Step 2: Poll for completion (max 20s as per requirement)
                if self.poll_task_completion(task_id, f"Diagnóstico Simples #{attempt}", max_wait=20):
                    success_count += 1
                    self.log_result(f"Diagnóstico Simples #{attempt} - OVERALL", True, 
                                  "Complete success", time.time() - start_time)
                else:
                    self.log_result(f"Diagnóstico Simples #{attempt} - OVERALL", False, 
                                  "Failed to complete", time.time() - start_time)
                
            except Exception as e:
                duration = time.time() - start_time
                self.log_result(f"Diagnóstico Simples #{attempt} - OVERALL", False, 
                              f"Exception: {str(e)}", duration)
        
        # Critical assessment
        if success_count == 3:
            self.log_result("Diagnóstico Simples - STABILITY", True, 
                          f"ALL 3/3 attempts successful - STABLE", None)
            return True
        else:
            self.log_result("Diagnóstico Simples - STABILITY", False, 
                          f"ONLY {success_count}/3 attempts successful - UNSTABLE", None)
            return False
    
    def test_medication_guide_3x(self):
        """Test Guia Terapêutico 3 times - CRITICAL MEDICAL FUNCTIONALITY"""
        print(f"\n💊 CRITICAL TEST: Guia Terapêutico (3x repetitions)")
        print("=" * 60)
        
        # Exact test data from review request
        test_data = {
            "condition": "Hipertensão arterial"
        }
        
        success_count = 0
        
        for attempt in range(1, 4):  # 3 attempts
            print(f"\n📋 Attempt {attempt}/3: Guia Terapêutico")
            
            start_time = time.time()
            try:
                # Step 1: Submit medication guide request
                response = self.session.post(
                    f"{BACKEND_URL}/ai/consensus/medication-guide",
                    json=test_data,
                    timeout=30
                )
                submit_duration = time.time() - start_time
                
                if response.status_code != 200:
                    self.log_result(f"Guia Terapêutico #{attempt} - Submit", False, 
                                  f"HTTP {response.status_code}: {response.text}", submit_duration)
                    continue
                
                data = response.json()
                task_id = data.get("task_id")
                
                if not task_id:
                    self.log_result(f"Guia Terapêutico #{attempt} - Submit", False, 
                                  "No task_id returned", submit_duration)
                    continue
                
                # Verify immediate response (< 1s requirement)
                if submit_duration > 1.0:
                    self.log_result(f"Guia Terapêutico #{attempt} - Response Time", False, 
                                  f"Too slow: {submit_duration:.3f}s (must be < 1s)", submit_duration)
                else:
                    self.log_result(f"Guia Terapêutico #{attempt} - Response Time", True, 
                                  f"Immediate response: {submit_duration:.3f}s", submit_duration)
                
                # Step 2: Poll for completion (max 20s as per requirement)
                if self.poll_task_completion(task_id, f"Guia Terapêutico #{attempt}", max_wait=20):
                    success_count += 1
                    self.log_result(f"Guia Terapêutico #{attempt} - OVERALL", True, 
                                  "Complete success", time.time() - start_time)
                else:
                    self.log_result(f"Guia Terapêutico #{attempt} - OVERALL", False, 
                                  "Failed to complete", time.time() - start_time)
                
            except Exception as e:
                duration = time.time() - start_time
                self.log_result(f"Guia Terapêutico #{attempt} - OVERALL", False, 
                              f"Exception: {str(e)}", duration)
        
        # Critical assessment
        if success_count == 3:
            self.log_result("Guia Terapêutico - STABILITY", True, 
                          f"ALL 3/3 attempts successful - STABLE", None)
            return True
        else:
            self.log_result("Guia Terapêutico - STABILITY", False, 
                          f"ONLY {success_count}/3 attempts successful - UNSTABLE", None)
            return False
    
    def test_toxicology_3x(self):
        """Test Toxicologia 3 times - CRITICAL MEDICAL FUNCTIONALITY"""
        print(f"\n☠️ CRITICAL TEST: Toxicologia (3x repetitions)")
        print("=" * 60)
        
        # Exact test data from review request
        test_data = {
            "substance": "Paracetamol overdose"
        }
        
        success_count = 0
        
        for attempt in range(1, 4):  # 3 attempts
            print(f"\n📋 Attempt {attempt}/3: Toxicologia")
            
            start_time = time.time()
            try:
                # Step 1: Submit toxicology request
                response = self.session.post(
                    f"{BACKEND_URL}/ai/consensus/toxicology",
                    json=test_data,
                    timeout=30
                )
                submit_duration = time.time() - start_time
                
                if response.status_code != 200:
                    self.log_result(f"Toxicologia #{attempt} - Submit", False, 
                                  f"HTTP {response.status_code}: {response.text}", submit_duration)
                    continue
                
                data = response.json()
                task_id = data.get("task_id")
                
                if not task_id:
                    self.log_result(f"Toxicologia #{attempt} - Submit", False, 
                                  "No task_id returned", submit_duration)
                    continue
                
                # Verify immediate response (< 1s requirement)
                if submit_duration > 1.0:
                    self.log_result(f"Toxicologia #{attempt} - Response Time", False, 
                                  f"Too slow: {submit_duration:.3f}s (must be < 1s)", submit_duration)
                else:
                    self.log_result(f"Toxicologia #{attempt} - Response Time", True, 
                                  f"Immediate response: {submit_duration:.3f}s", submit_duration)
                
                # Step 2: Poll for completion (max 20s as per requirement)
                if self.poll_task_completion(task_id, f"Toxicologia #{attempt}", max_wait=20):
                    success_count += 1
                    self.log_result(f"Toxicologia #{attempt} - OVERALL", True, 
                                  "Complete success", time.time() - start_time)
                else:
                    self.log_result(f"Toxicologia #{attempt} - OVERALL", False, 
                                  "Failed to complete", time.time() - start_time)
                
            except Exception as e:
                duration = time.time() - start_time
                self.log_result(f"Toxicologia #{attempt} - OVERALL", False, 
                              f"Exception: {str(e)}", duration)
        
        # Critical assessment
        if success_count == 3:
            self.log_result("Toxicologia - STABILITY", True, 
                          f"ALL 3/3 attempts successful - STABLE", None)
            return True
        else:
            self.log_result("Toxicologia - STABILITY", False, 
                          f"ONLY {success_count}/3 attempts successful - UNSTABLE", None)
            return False
    
    def poll_task_completion(self, task_id, test_name, max_wait=20):
        """Poll task until completion with strict timeout"""
        print(f"  📊 Polling {task_id} for {test_name} (max {max_wait}s)...")
        
        start_time = time.time()
        poll_count = 0
        
        try:
            while True:
                poll_count += 1
                poll_start = time.time()
                
                response = self.session.get(
                    f"{BACKEND_URL}/ai/tasks/{task_id}",
                    timeout=5
                )
                poll_duration = time.time() - poll_start
                
                if response.status_code != 200:
                    self.log_result(f"{test_name} - Poll #{poll_count}", False, 
                                  f"Poll failed: HTTP {response.status_code}", poll_duration)
                    return False
                
                data = response.json()
                status = data.get("status")
                progress = data.get("progress", 0)
                
                print(f"    Poll #{poll_count}: {status} ({progress}%)")
                
                if status == "completed":
                    total_duration = time.time() - start_time
                    result = data.get("result")
                    
                    if not result:
                        self.log_result(f"{test_name} - Completion", False, 
                                      "No result returned", total_duration)
                        return False
                    
                    # Verify completion time meets requirement (≤ 20s)
                    if total_duration > max_wait:
                        self.log_result(f"{test_name} - Completion Time", False, 
                                      f"Too slow: {total_duration:.3f}s (max {max_wait}s)", total_duration)
                        return False
                    else:
                        self.log_result(f"{test_name} - Completion Time", True, 
                                      f"Completed in {total_duration:.3f}s", total_duration)
                    
                    self.log_result(f"{test_name} - Result", True, 
                                  f"Valid result received ({len(str(result))} chars)", total_duration)
                    return True
                
                elif status == "failed":
                    total_duration = time.time() - start_time
                    error = data.get("error", "Unknown error")
                    self.log_result(f"{test_name} - Completion", False, 
                                  f"Task failed: {error}", total_duration)
                    return False
                
                elif status in ["pending", "processing"]:
                    # Check timeout
                    if time.time() - start_time > max_wait:
                        self.log_result(f"{test_name} - Timeout", False, 
                                      f"Timeout after {max_wait}s", max_wait)
                        return False
                    
                    # Wait before next poll
                    time.sleep(1)
                    continue
                
                else:
                    self.log_result(f"{test_name} - Status", False, 
                                  f"Unknown status: {status}", time.time() - start_time)
                    return False
                    
        except Exception as e:
            duration = time.time() - start_time
            self.log_result(f"{test_name} - Polling", False, f"Polling error: {str(e)}", duration)
            return False
    
    def run_critical_stability_tests(self):
        """Run all critical stability tests - MEDICAL SYSTEM REQUIREMENTS"""
        print("🚨 CRITICAL STABILITY TEST - MEDUF AI MEDICAL SYSTEM")
        print("=" * 80)
        print("REQUIREMENT: ALL 9 attempts (3x each functionality) MUST COMPLETE")
        print("REQUIREMENT: Maximum 20s per analysis")
        print("REQUIREMENT: NO 400, 500, timeout errors")
        print("REQUIREMENT: 0% failure rate for medical system")
        print("=" * 80)
        
        # Step 1: Authentication
        if not self.authenticate():
            print("\n❌ CRITICAL FAILURE: Authentication failed - cannot proceed")
            return False
        
        # Step 2: Run all critical tests
        all_stable = True
        
        # Test 1: Diagnóstico Simples (3x)
        if not self.test_diagnosis_simple_3x():
            all_stable = False
        
        # Test 2: Guia Terapêutico (3x)  
        if not self.test_medication_guide_3x():
            all_stable = False
        
        # Test 3: Toxicologia (3x)
        if not self.test_toxicology_3x():
            all_stable = False
        
        # Final Assessment
        print("\n" + "=" * 80)
        print("🏥 CRITICAL MEDICAL SYSTEM ASSESSMENT")
        print("=" * 80)
        
        failure_rate = (self.failed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"📊 TOTAL TESTS: {self.total_tests}")
        print(f"✅ PASSED: {self.passed_tests}")
        print(f"❌ FAILED: {self.failed_tests}")
        print(f"📈 FAILURE RATE: {failure_rate:.1f}%")
        
        if all_stable and failure_rate == 0:
            print("\n🎉 MEDICAL SYSTEM CERTIFICATION: STABLE")
            print("✅ ALL 9 attempts completed successfully")
            print("✅ All response times under 20s")
            print("✅ No HTTP errors detected")
            print("✅ 0% failure rate achieved")
            print("✅ SYSTEM READY FOR MEDICAL USE")
            return True
        else:
            print("\n🚨 MEDICAL SYSTEM CERTIFICATION: UNSTABLE")
            print("❌ CRITICAL FAILURES DETECTED")
            print("❌ SYSTEM NOT SAFE FOR MEDICAL USE")
            print("❌ IMMEDIATE FIXES REQUIRED")
            return False

def main():
    """Execute critical stability testing"""
    tester = CriticalStabilityTester()
    success = tester.run_critical_stability_tests()
    
    # Detailed results for debugging
    print("\n📋 DETAILED TEST LOG:")
    print("-" * 60)
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        duration = f" ({result['duration']:.3f}s)" if result["duration"] else ""
        print(f"{status} {result['test']}: {result['message']}{duration}")
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)