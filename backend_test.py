#!/usr/bin/env python3
"""
Backend Test Suite for Meduf AI Background Task System
Tests the consensus AI endpoints with background processing
"""

import requests
import time
import json
from datetime import datetime

# Configuration
BACKEND_URL = "https://clinical-helper-ai.preview.emergentagent.com/api"
TEST_USERNAME = "ur1fs"
TEST_PASSWORD = "@Fred1807"

class BackendTester:
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
    
    def test_consensus_diagnosis(self):
        """Test consensus diagnosis endpoint"""
        print(f"\n🧠 Testing Consensus Diagnosis...")
        
        # Test data from review request
        test_data = {
            "queixa": "febre e tosse",
            "idade": "30", 
            "sexo": "M"
        }
        
        start_time = time.time()
        try:
            # Step 1: Submit diagnosis request
            response = self.session.post(
                f"{BACKEND_URL}/ai/consensus/diagnosis",
                json=test_data
            )
            submit_duration = time.time() - start_time
            
            if response.status_code != 200:
                self.log_result("Consensus Diagnosis - Submit", False, 
                              f"Submit failed: {response.status_code} - {response.text}", submit_duration)
                return False
            
            data = response.json()
            task_id = data.get("task_id")
            
            if not task_id:
                self.log_result("Consensus Diagnosis - Submit", False, 
                              "No task_id returned", submit_duration)
                return False
            
            # Check if response was immediate (< 1 second as required)
            if submit_duration > 1.0:
                self.log_result("Consensus Diagnosis - Submit Speed", False, 
                              f"Response too slow: {submit_duration:.2f}s (should be < 1s)", submit_duration)
            else:
                self.log_result("Consensus Diagnosis - Submit Speed", True, 
                              f"Immediate response with task_id: {task_id}", submit_duration)
            
            # Step 2: Poll for results
            return self.poll_task_result(task_id, "Consensus Diagnosis")
            
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Consensus Diagnosis", False, f"Error: {str(e)}", duration)
            return False
    
    def test_consensus_drug_interaction(self):
        """Test consensus drug interaction endpoint"""
        print(f"\n💊 Testing Consensus Drug Interaction...")
        
        # Test data from review request
        test_data = {
            "drug1": "ibuprofeno",
            "drug2": "varfarina"
        }
        
        start_time = time.time()
        try:
            # Step 1: Submit drug interaction request
            response = self.session.post(
                f"{BACKEND_URL}/ai/consensus/drug-interaction",
                json=test_data
            )
            submit_duration = time.time() - start_time
            
            if response.status_code != 200:
                self.log_result("Consensus Drug Interaction - Submit", False, 
                              f"Submit failed: {response.status_code} - {response.text}", submit_duration)
                return False
            
            data = response.json()
            task_id = data.get("task_id")
            
            if not task_id:
                self.log_result("Consensus Drug Interaction - Submit", False, 
                              "No task_id returned", submit_duration)
                return False
            
            # Check if response was immediate (< 1 second as required)
            if submit_duration > 1.0:
                self.log_result("Consensus Drug Interaction - Submit Speed", False, 
                              f"Response too slow: {submit_duration:.2f}s (should be < 1s)", submit_duration)
            else:
                self.log_result("Consensus Drug Interaction - Submit Speed", True, 
                              f"Immediate response with task_id: {task_id}", submit_duration)
            
            # Step 2: Poll for results
            return self.poll_task_result(task_id, "Consensus Drug Interaction", 
                                       expected_fields=["severity", "renal_impact", "hepatic_impact", "monitoring"])
            
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Consensus Drug Interaction", False, f"Error: {str(e)}", duration)
            return False
    
    def test_consensus_toxicology(self):
        """Test consensus toxicology endpoint"""
        print(f"\n☠️ Testing Consensus Toxicology...")
        
        # Test data from review request
        test_data = {
            "substance": "paracetamol"
        }
        
        start_time = time.time()
        try:
            # Step 1: Submit toxicology request
            response = self.session.post(
                f"{BACKEND_URL}/ai/consensus/toxicology",
                json=test_data
            )
            submit_duration = time.time() - start_time
            
            if response.status_code != 200:
                self.log_result("Consensus Toxicology - Submit", False, 
                              f"Submit failed: {response.status_code} - {response.text}", submit_duration)
                return False
            
            data = response.json()
            task_id = data.get("task_id")
            
            if not task_id:
                self.log_result("Consensus Toxicology - Submit", False, 
                              "No task_id returned", submit_duration)
                return False
            
            # Check if response was immediate (< 1 second as required)
            if submit_duration > 1.0:
                self.log_result("Consensus Toxicology - Submit Speed", False, 
                              f"Response too slow: {submit_duration:.2f}s (should be < 1s)", submit_duration)
            else:
                self.log_result("Consensus Toxicology - Submit Speed", True, 
                              f"Immediate response with task_id: {task_id}", submit_duration)
            
            # Step 2: Poll for results
            return self.poll_task_result(task_id, "Consensus Toxicology", 
                                       expected_fields=["agent", "antidote", "mechanism", "conduct"])
            
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Consensus Toxicology", False, f"Error: {str(e)}", duration)
            return False
    
    def test_consensus_medication_guide(self):
        """Test consensus medication guide endpoint"""
        print(f"\n💉 Testing Consensus Medication Guide...")
        
        # Test data from review request
        test_data = {
            "symptoms": "dor de cabeça"
        }
        
        start_time = time.time()
        try:
            # Step 1: Submit medication guide request
            response = self.session.post(
                f"{BACKEND_URL}/ai/consensus/medication-guide",
                json=test_data
            )
            submit_duration = time.time() - start_time
            
            if response.status_code != 200:
                self.log_result("Consensus Medication Guide - Submit", False, 
                              f"Submit failed: {response.status_code} - {response.text}", submit_duration)
                return False
            
            data = response.json()
            task_id = data.get("task_id")
            
            if not task_id:
                self.log_result("Consensus Medication Guide - Submit", False, 
                              "No task_id returned", submit_duration)
                return False
            
            # Check if response was immediate (< 1 second as required)
            if submit_duration > 1.0:
                self.log_result("Consensus Medication Guide - Submit Speed", False, 
                              f"Response too slow: {submit_duration:.2f}s (should be < 1s)", submit_duration)
            else:
                self.log_result("Consensus Medication Guide - Submit Speed", True, 
                              f"Immediate response with task_id: {task_id}", submit_duration)
            
            # Step 2: Poll for results
            return self.poll_task_result(task_id, "Consensus Medication Guide", 
                                       expected_fields=["medications"])
            
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Consensus Medication Guide", False, f"Error: {str(e)}", duration)
            return False
    
    def poll_task_result(self, task_id, test_name, expected_fields=None, max_wait=120):
        """Poll task status until completion or timeout"""
        print(f"📊 Polling task {task_id} for {test_name}...")
        
        start_time = time.time()
        poll_count = 0
        
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
                
                print(f"  Poll #{poll_count}: Status={status}, Progress={progress}%")
                
                if status == "completed":
                    total_duration = time.time() - start_time
                    result = data.get("result")
                    
                    if not result:
                        self.log_result(f"{test_name} - Result", False, 
                                      "Task completed but no result returned", total_duration)
                        return False
                    
                    # Validate expected fields if provided
                    if expected_fields:
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
                    
                    self.log_result(f"{test_name} - Completion", True, 
                                  f"Task completed successfully in {poll_count} polls", total_duration)
                    
                    # Log result summary
                    print(f"  📋 Result Summary: {json.dumps(result, indent=2)[:200]}...")
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
                                      f"Task timed out after {max_wait}s", max_wait)
                        return False
                    
                    # Wait before next poll (2 seconds as mentioned in review)
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
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Meduf AI Backend Task System Tests")
        print("=" * 60)
        
        # Step 1: Authentication
        if not self.authenticate():
            print("\n❌ Authentication failed - cannot proceed with tests")
            return False
        
        # Step 2: Test consensus endpoints (at least 2 as required)
        tests_passed = 0
        total_tests = 0
        
        # Test 1: Consensus Diagnosis
        total_tests += 1
        if self.test_consensus_diagnosis():
            tests_passed += 1
        
        # Test 2: Consensus Drug Interaction  
        total_tests += 1
        if self.test_consensus_drug_interaction():
            tests_passed += 1
        
        # Test 3: Consensus Toxicology (bonus test)
        total_tests += 1
        if self.test_consensus_toxicology():
            tests_passed += 1
        
        # Test 4: Consensus Medication Guide (bonus test)
        total_tests += 1
        if self.test_consensus_medication_guide():
            tests_passed += 1
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY: {tests_passed}/{total_tests} tests passed")
        
        if tests_passed == total_tests:
            print("🎉 ALL TESTS PASSED - Background task system working correctly!")
            return True
        else:
            print(f"⚠️  {total_tests - tests_passed} tests failed - see details above")
            return False

def main():
    """Main test execution"""
    tester = BackendTester()
    success = tester.run_all_tests()
    
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