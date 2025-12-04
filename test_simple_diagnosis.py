#!/usr/bin/env python3
"""
Test Simple Diagnosis endpoint
"""
import requests
import time

BACKEND_URL = "https://meduf-ai-2.preview.emergentagent.com/api"
TEST_USERNAME = "ur1fs"
TEST_PASSWORD = "@Fred1807"

def test_simple_diagnosis():
    """Test simple diagnosis endpoint"""
    
    # Login first
    print("🔐 Logging in...")
    login_response = requests.post(
        f"{BACKEND_URL}/auth/login",
        data={"username": TEST_USERNAME, "password": TEST_PASSWORD}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return
    
    token = login_response.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test simple diagnosis with N/I data as specified in review request
    print("\n🧠 Testing Simple Diagnosis...")
    test_data = {
        "queixa": "dor de cabeça forte",
        "idade": "N/I", 
        "sexo": "N/I"
    }
    
    start_time = time.time()
    response = requests.post(
        f"{BACKEND_URL}/ai/consensus/diagnosis",
        json=test_data,
        headers=headers
    )
    submit_duration = time.time() - start_time
    
    print(f"Submit response time: {submit_duration:.3f}s")
    print(f"Status code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        task_id = data.get("task_id")
        print(f"✅ Task ID: {task_id}")
        
        if submit_duration < 1.0:
            print(f"✅ Immediate response ({submit_duration:.3f}s < 1s)")
        else:
            print(f"❌ Response too slow ({submit_duration:.3f}s >= 1s)")
        
        # Poll for result
        print(f"📊 Polling for result...")
        poll_count = 0
        start_poll = time.time()
        
        while True:
            poll_count += 1
            time.sleep(2)
            
            poll_response = requests.get(f"{BACKEND_URL}/ai/tasks/{task_id}", headers=headers)
            
            if poll_response.status_code == 200:
                poll_data = poll_response.json()
                status = poll_data.get("status")
                progress = poll_data.get("progress", 0)
                
                print(f"  Poll #{poll_count}: Status={status}, Progress={progress}%")
                
                if status == "completed":
                    total_time = time.time() - start_poll
                    result = poll_data.get("result")
                    print(f"✅ Task completed in {poll_count} polls ({total_time:.1f}s)")
                    
                    if result and "diagnoses" in result:
                        print(f"✅ Result contains diagnoses array")
                        print(f"📋 Diagnoses: {len(result['diagnoses'])} found")
                        for i, diag in enumerate(result['diagnoses'][:2]):
                            print(f"  {i+1}. {diag.get('name', 'Unknown')}")
                    else:
                        print(f"❌ Invalid result structure")
                    break
                    
                elif status == "failed":
                    error = poll_data.get("error", "Unknown error")
                    print(f"❌ Task failed: {error}")
                    break
                    
                elif poll_count > 60:  # 2 minutes timeout
                    print(f"❌ Timeout after {poll_count} polls")
                    break
            else:
                print(f"❌ Poll failed: {poll_response.status_code}")
                break
    else:
        print(f"❌ Request failed: {response.text}")

if __name__ == "__main__":
    test_simple_diagnosis()