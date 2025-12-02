#!/usr/bin/env python3
"""
Test to verify if endpoints return immediately with task_id
"""
import requests
import time

BACKEND_URL = "https://medufai.preview.emergentagent.com/api"
TEST_USERNAME = "ur1fs"
TEST_PASSWORD = "@Fred1807"

def test_immediate_response():
    """Test if consensus endpoints return task_id immediately"""
    
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
    
    # Test diagnosis endpoint
    print("\n🧠 Testing diagnosis endpoint response time...")
    start_time = time.time()
    
    response = requests.post(
        f"{BACKEND_URL}/ai/consensus/diagnosis",
        json={"queixa": "febre", "idade": "30", "sexo": "M"},
        headers=headers
    )
    
    response_time = time.time() - start_time
    
    print(f"Response time: {response_time:.3f}s")
    print(f"Status code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Response data: {data}")
        
        if "task_id" in data:
            print(f"✅ Task ID returned: {data['task_id']}")
            if response_time < 1.0:
                print(f"✅ Response was immediate ({response_time:.3f}s < 1s)")
            else:
                print(f"❌ Response was too slow ({response_time:.3f}s >= 1s)")
        else:
            print("❌ No task_id in response")
    else:
        print(f"❌ Request failed: {response.text}")

if __name__ == "__main__":
    test_immediate_response()