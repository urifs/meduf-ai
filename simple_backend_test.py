#!/usr/bin/env python3
"""
Simple Backend Test for Background Task System
Tests key requirements from review request
"""

import requests
import time
import json

def test_background_tasks():
    """Test the background task system as specified in review request"""
    
    print("🚀 Testing Meduf AI Background Task System")
    print("=" * 50)
    
    # Configuration
    BACKEND_URL = "http://localhost:8001/api"
    USERNAME = "ur1fs"
    PASSWORD = "@Fred1807"
    
    results = []
    
    try:
        # Step 1: Authentication
        print("🔐 Step 1: Authentication")
        auth_response = requests.post(
            f"{BACKEND_URL}/auth/login",
            data={"username": USERNAME, "password": PASSWORD},
            timeout=10
        )
        
        if auth_response.status_code != 200:
            print(f"❌ Authentication failed: {auth_response.status_code}")
            return False
            
        token = auth_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        user_name = auth_response.json().get("user_name")
        print(f"✅ Authenticated as: {user_name}")
        
        # Step 2: Test Consensus Diagnosis (Requirement 1)
        print("\n🧠 Step 2: Testing Consensus Diagnosis")
        test_data = {"queixa": "febre e tosse", "idade": "30", "sexo": "M"}
        
        start_time = time.time()
        response = requests.post(
            f"{BACKEND_URL}/ai/consensus/diagnosis",
            json=test_data,
            headers=headers,
            timeout=5
        )
        submit_duration = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            task_id = result.get("task_id")
            
            # Check immediate response requirement (< 1s)
            if submit_duration < 1.0:
                print(f"✅ Immediate response: {submit_duration:.3f}s (< 1s requirement met)")
                results.append(("Diagnosis Submit Speed", True, f"{submit_duration:.3f}s"))
            else:
                print(f"❌ Response too slow: {submit_duration:.3f}s (should be < 1s)")
                results.append(("Diagnosis Submit Speed", False, f"{submit_duration:.3f}s"))
            
            if task_id:
                print(f"✅ Task ID received: {task_id}")
                results.append(("Diagnosis Task Creation", True, task_id))
                
                # Test polling system
                print("📊 Testing polling system...")
                poll_success = test_polling(BACKEND_URL, task_id, headers, "diagnosis")
                results.append(("Diagnosis Polling", poll_success, "Polling system"))
            else:
                print("❌ No task_id in response")
                results.append(("Diagnosis Task Creation", False, "No task_id"))
        else:
            print(f"❌ Diagnosis request failed: {response.status_code}")
            results.append(("Diagnosis Request", False, f"Status {response.status_code}"))
        
        # Step 3: Test Drug Interaction (Requirement 2)
        print("\n💊 Step 3: Testing Consensus Drug Interaction")
        test_data = {"drug1": "ibuprofeno", "drug2": "varfarina"}
        
        start_time = time.time()
        response = requests.post(
            f"{BACKEND_URL}/ai/consensus/drug-interaction",
            json=test_data,
            headers=headers,
            timeout=5
        )
        submit_duration = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            task_id = result.get("task_id")
            
            # Check immediate response requirement (< 1s)
            if submit_duration < 1.0:
                print(f"✅ Immediate response: {submit_duration:.3f}s (< 1s requirement met)")
                results.append(("Drug Interaction Submit Speed", True, f"{submit_duration:.3f}s"))
            else:
                print(f"❌ Response too slow: {submit_duration:.3f}s (should be < 1s)")
                results.append(("Drug Interaction Submit Speed", False, f"{submit_duration:.3f}s"))
            
            if task_id:
                print(f"✅ Task ID received: {task_id}")
                results.append(("Drug Interaction Task Creation", True, task_id))
                
                # Test polling system
                print("📊 Testing polling system...")
                poll_success = test_polling(BACKEND_URL, task_id, headers, "drug-interaction", 
                                          expected_fields=["severity", "renal_impact", "hepatic_impact", "monitoring"])
                results.append(("Drug Interaction Polling", poll_success, "Polling with expected fields"))
            else:
                print("❌ No task_id in response")
                results.append(("Drug Interaction Task Creation", False, "No task_id"))
        else:
            print(f"❌ Drug interaction request failed: {response.status_code}")
            results.append(("Drug Interaction Request", False, f"Status {response.status_code}"))
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("-" * 30)
        
        passed = 0
        total = len(results)
        
        for test_name, success, details in results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{status}: {test_name} - {details}")
            if success:
                passed += 1
        
        print(f"\n🎯 Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED - Background task system working correctly!")
            return True
        else:
            print(f"⚠️  {total - passed} tests failed")
            return False
            
    except Exception as e:
        print(f"❌ Test execution error: {e}")
        return False

def test_polling(backend_url, task_id, headers, task_type, expected_fields=None, max_polls=10):
    """Test the polling system for a given task"""
    
    for i in range(max_polls):
        try:
            time.sleep(2)  # 2-second polling interval as mentioned in review
            
            response = requests.get(
                f"{backend_url}/ai/tasks/{task_id}",
                headers=headers,
                timeout=5
            )
            
            if response.status_code != 200:
                print(f"  ❌ Poll #{i+1} failed: {response.status_code}")
                return False
            
            data = response.json()
            status = data.get("status")
            progress = data.get("progress", 0)
            
            print(f"  📊 Poll #{i+1}: Status={status}, Progress={progress}%")
            
            if status == "completed":
                result = data.get("result")
                if result:
                    print(f"  ✅ Task completed successfully!")
                    
                    # Check expected fields if provided
                    if expected_fields:
                        found_fields = [f for f in expected_fields if f in result]
                        missing_fields = [f for f in expected_fields if f not in result]
                        
                        if missing_fields:
                            print(f"  ⚠️  Missing expected fields: {missing_fields}")
                        else:
                            print(f"  ✅ All expected fields present: {found_fields}")
                    
                    return True
                else:
                    print(f"  ❌ Task completed but no result")
                    return False
            
            elif status == "failed":
                error = data.get("error", "Unknown error")
                print(f"  ❌ Task failed: {error}")
                return False
            
            elif status in ["pending", "processing"]:
                continue  # Keep polling
            
            else:
                print(f"  ❌ Unknown status: {status}")
                return False
                
        except Exception as e:
            print(f"  ❌ Poll #{i+1} error: {e}")
            return False
    
    print(f"  ⏰ Polling timed out after {max_polls} attempts")
    return False

if __name__ == "__main__":
    success = test_background_tasks()
    exit(0 if success else 1)