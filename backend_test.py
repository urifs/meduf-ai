#!/usr/bin/env python3
"""
Backend Test Suite for Meduf AI Background Task System
Tests the consensus AI endpoints with background processing
"""

import requests
import time
import json
from datetime import datetime

# Configuration - Use production URL from frontend .env
BACKEND_URL = "https://meduf-ai-doctor.preview.emergentagent.com/api"
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
    
    def test_consensus_diagnosis_simple(self):
        """Test consensus diagnosis endpoint - Simple case"""
        print(f"\n🧠 Testing Consensus Diagnosis (Simple)...")
        
        # Test data from review request - Diagnóstico Simples
        test_data = {
            "queixa": "Dor de cabeça intensa há 3 dias",
            "idade": "35", 
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
            return self.poll_task_result(task_id, "Consensus Diagnosis (Simple)", 
                                       expected_fields=["diagnoses", "conduct", "medications"])
            
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Consensus Diagnosis (Simple)", False, f"Error: {str(e)}", duration)
            return False
    
    def test_consensus_diagnosis_detailed(self):
        """Test consensus diagnosis endpoint - Detailed case"""
        print(f"\n🧠 Testing Consensus Diagnosis (Detailed)...")
        
        # Test data from review request - Diagnóstico Detalhado with complete patient data
        test_data = {
            "queixa": "Dor de cabeça intensa há 3 dias com fotofobia e náuseas",
            "idade": "35", 
            "sexo": "M",
            "historia": "Paciente com histórico de enxaqueca, sem uso de medicações regulares",
            "exame_fisico": "PA: 120/80 mmHg, FC: 72 bpm, Tax: 36.5°C, consciente e orientado",
            "sintomas_associados": "fotofobia, náuseas, sem vômitos"
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
                self.log_result("Consensus Diagnosis (Detailed) - Submit", False, 
                              f"Submit failed: {response.status_code} - {response.text}", submit_duration)
                return False
            
            data = response.json()
            task_id = data.get("task_id")
            
            if not task_id:
                self.log_result("Consensus Diagnosis (Detailed) - Submit", False, 
                              "No task_id returned", submit_duration)
                return False
            
            # Check if response was immediate (< 1 second as required)
            if submit_duration > 1.0:
                self.log_result("Consensus Diagnosis (Detailed) - Submit Speed", False, 
                              f"Response too slow: {submit_duration:.2f}s (should be < 1s)", submit_duration)
            else:
                self.log_result("Consensus Diagnosis (Detailed) - Submit Speed", True, 
                              f"Immediate response with task_id: {task_id}", submit_duration)
            
            # Step 2: Poll for results
            return self.poll_task_result(task_id, "Consensus Diagnosis (Detailed)", 
                                       expected_fields=["diagnoses", "conduct", "medications"])
            
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Consensus Diagnosis (Detailed)", False, f"Error: {str(e)}", duration)
            return False

    def test_consensus_drug_interaction(self):
        """Test consensus drug interaction endpoint"""
        print(f"\n💊 Testing Consensus Drug Interaction...")
        
        # Test data from review request - Interação Medicamentosa
        test_data = {
            "medications": ["Paracetamol", "Ibuprofeno"]
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
        
        # Test data from review request - Toxicologia
        test_data = {
            "substance": "Paracetamol overdose"
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
        
        # Test data from review request - Guia Terapêutico
        test_data = {
            "symptoms": "Dor lombar aguda"
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
    
    def test_diagnosis_simple_review(self):
        """Test 1: Diagnóstico Simples - EXACT review request data"""
        test_data = {
            "queixa": "Febre e tosse",
            "idade": "30",
            "sexo": "M"
        }
        return self.execute_consensus_test("diagnosis", test_data, "Diagnóstico Simples")
    
    def test_medication_guide_review(self):
        """Test 2: Guia Terapêutico - EXACT review request data"""
        test_data = {
            "condition": "Hipertensão"
        }
        return self.execute_consensus_test("medication-guide", test_data, "Guia Terapêutico")
    
    def test_toxicology_review(self):
        """Test 3: Toxicologia - EXACT review request data"""
        test_data = {
            "substance": "Paracetamol overdose"
        }
        return self.execute_consensus_test("toxicology", test_data, "Toxicologia")
    
    def test_drug_interaction_review(self):
        """Test 4: Interação Medicamentosa - EXACT review request data"""
        test_data = {
            "medications": ["Paracetamol", "Ibuprofeno"]
        }
        return self.execute_consensus_test("drug-interaction", test_data, "Interação Medicamentosa")
    
    def test_diagnosis_detailed_review(self):
        """Test 5: Diagnóstico Detalhado - EXACT review request data"""
        test_data = {
            "queixa": "Dor no peito",
            "idade": "45",
            "sexo": "M",
            "historico": "Fumante"
        }
        return self.execute_consensus_test("diagnosis", test_data, "Diagnóstico Detalhado")
    
    def execute_consensus_test(self, endpoint, test_data, test_name):
        """Execute a consensus test with 15s max time requirement"""
        start_time = time.time()
        try:
            # Step 1: Submit request
            response = self.session.post(
                f"{BACKEND_URL}/ai/consensus/{endpoint}",
                json=test_data
            )
            submit_duration = time.time() - start_time
            
            if response.status_code != 200:
                self.log_result(f"{test_name} - Submit", False, 
                              f"Submit failed: {response.status_code} - {response.text}", submit_duration)
                return False
            
            data = response.json()
            task_id = data.get("task_id")
            
            if not task_id:
                self.log_result(f"{test_name} - Submit", False, 
                              "No task_id returned", submit_duration)
                return False
            
            print(f"      Task ID: {task_id} (response: {submit_duration:.3f}s)")
            
            # Step 2: Poll for results with 15s max time
            return self.poll_task_result_review(task_id, test_name, max_wait=15)
            
        except Exception as e:
            duration = time.time() - start_time
            self.log_result(f"{test_name}", False, f"Error: {str(e)}", duration)
            return False
    
    def poll_task_result_review(self, task_id, test_name, max_wait=15):
        """Poll task status for review request - MAX 15s per analysis"""
        start_time = time.time()
        poll_count = 0
        
        try:
            while True:
                poll_count += 1
                
                response = self.session.get(f"{BACKEND_URL}/ai/tasks/{task_id}")
                
                if response.status_code != 200:
                    total_duration = time.time() - start_time
                    print(f"      ❌ Poll failed: {response.status_code}")
                    return False
                
                data = response.json()
                status = data.get("status")
                progress = data.get("progress", 0)
                
                current_duration = time.time() - start_time
                print(f"      Poll #{poll_count}: {status} ({progress}%) - {current_duration:.1f}s")
                
                if status == "completed":
                    total_duration = time.time() - start_time
                    result = data.get("result")
                    
                    if not result:
                        print(f"      ❌ No result returned")
                        return False
                    
                    # Check 15s requirement
                    if total_duration > 15.0:
                        print(f"      ⚠️ TEMPO EXCEDIDO: {total_duration:.1f}s > 15s máximo")
                        return False
                    else:
                        print(f"      ✅ COMPLETOU em {total_duration:.1f}s (< 15s)")
                        return True
                
                elif status == "failed":
                    total_duration = time.time() - start_time
                    error = data.get("error", "Unknown error")
                    print(f"      ❌ Task failed: {error}")
                    return False
                
                elif status in ["pending", "processing"]:
                    # Check 15s timeout
                    if current_duration > max_wait:
                        print(f"      ❌ TIMEOUT: {current_duration:.1f}s > {max_wait}s máximo")
                        return False
                    
                    # Wait before next poll
                    time.sleep(1)
                    continue
                
                else:
                    print(f"      ❌ Unknown status: {status}")
                    return False
                    
        except Exception as e:
            duration = time.time() - start_time
            print(f"      ❌ Polling error: {str(e)}")
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
    
    def run_review_request_tests(self):
        """Run EXACT tests from review request - 5 functionalities, 2x each = 10 total tests"""
        print("🚀 TESTE DO BACKEND REESCRITO - 5 Funcionalidades Essenciais")
        print("CREDENCIAIS: ur1fs / @Fred1807")
        print("TESTAR CADA FUNCIONALIDADE 2 VEZES (confirmar estabilidade)")
        print("=" * 80)
        
        # Step 1: Authentication
        if not self.authenticate():
            print("\n❌ Authentication failed - cannot proceed with tests")
            return False
        
        tests_passed = 0
        total_tests = 10  # 5 functionalities × 2 times each
        failed_tests = []
        
        # 1. Diagnóstico Simples (2x)
        print(f"\n1️⃣ DIAGNÓSTICO SIMPLES (2x)")
        for attempt in [1, 2]:
            print(f"\n   Tentativa {attempt}/2:")
            if self.test_diagnosis_simple_review():
                tests_passed += 1
                print(f"   ✅ Tentativa {attempt} - SUCESSO")
            else:
                failed_tests.append(f"Diagnóstico Simples - Tentativa {attempt}")
                print(f"   ❌ Tentativa {attempt} - FALHOU")
        
        # 2. Guia Terapêutico (2x)
        print(f"\n2️⃣ GUIA TERAPÊUTICO (2x)")
        for attempt in [1, 2]:
            print(f"\n   Tentativa {attempt}/2:")
            if self.test_medication_guide_review():
                tests_passed += 1
                print(f"   ✅ Tentativa {attempt} - SUCESSO")
            else:
                failed_tests.append(f"Guia Terapêutico - Tentativa {attempt}")
                print(f"   ❌ Tentativa {attempt} - FALHOU")
        
        # 3. Toxicologia (2x)
        print(f"\n3️⃣ TOXICOLOGIA (2x)")
        for attempt in [1, 2]:
            print(f"\n   Tentativa {attempt}/2:")
            if self.test_toxicology_review():
                tests_passed += 1
                print(f"   ✅ Tentativa {attempt} - SUCESSO")
            else:
                failed_tests.append(f"Toxicologia - Tentativa {attempt}")
                print(f"   ❌ Tentativa {attempt} - FALHOU")
        
        # 4. Interação Medicamentosa (2x)
        print(f"\n4️⃣ INTERAÇÃO MEDICAMENTOSA (2x)")
        for attempt in [1, 2]:
            print(f"\n   Tentativa {attempt}/2:")
            if self.test_drug_interaction_review():
                tests_passed += 1
                print(f"   ✅ Tentativa {attempt} - SUCESSO")
            else:
                failed_tests.append(f"Interação Medicamentosa - Tentativa {attempt}")
                print(f"   ❌ Tentativa {attempt} - FALHOU")
        
        # 5. Diagnóstico Detalhado (2x)
        print(f"\n5️⃣ DIAGNÓSTICO DETALHADO (2x)")
        for attempt in [1, 2]:
            print(f"\n   Tentativa {attempt}/2:")
            if self.test_diagnosis_detailed_review():
                tests_passed += 1
                print(f"   ✅ Tentativa {attempt} - SUCESSO")
            else:
                failed_tests.append(f"Diagnóstico Detalhado - Tentativa {attempt}")
                print(f"   ❌ Tentativa {attempt} - FALHOU")
        
        # Final Results
        print("\n" + "=" * 80)
        print(f"📊 RESULTADO FINAL: {tests_passed}/{total_tests} tentativas COMPLETARAM")
        success_rate = (tests_passed / total_tests) * 100
        print(f"📈 Taxa de Sucesso: {success_rate:.1f}%")
        
        if tests_passed == total_tests:
            print("🎉 ✅ TODAS as 10 tentativas COMPLETARAM (100%)")
            print("🎉 ✅ Tempo máximo 15s por análise - VERIFICADO")
            print("🎉 ✅ Taxa de falha DEVE ser 0% - ALCANÇADO")
            print("🎉 BACKEND V2.0 - LIMPO E CONFIÁVEL!")
            return True
        else:
            print(f"⚠️ ❌ {total_tests - tests_passed} tentativas FALHARAM")
            print(f"⚠️ ❌ Taxa de falha: {100 - success_rate:.1f}% (DEVE ser 0%)")
            print("❌ TESTES FALHARAM:")
            for failed_test in failed_tests:
                print(f"   - {failed_test}")
            return False

    def test_admin_permanent_user_deletion(self):
        """Test permanent user deletion flow (BUG CORRECTED)"""
        print(f"\n🗑️ Testing Admin Permanent User Deletion Flow...")
        
        # Step 1: Create test user
        test_user_email = f"test_user_{int(time.time())}@meduf.test"
        user_data = {
            "email": test_user_email,
            "name": "Test User for Deletion",
            "password": "TestPassword123",
            "role": "USER",
            "days_valid": 30
        }
        
        start_time = time.time()
        try:
            # Create user
            response = self.session.post(
                f"{BACKEND_URL}/admin/users",
                json=user_data
            )
            create_duration = time.time() - start_time
            
            if response.status_code != 200:
                self.log_result("Admin - Create Test User", False, 
                              f"Failed to create user: {response.status_code} - {response.text}", create_duration)
                return False
            
            self.log_result("Admin - Create Test User", True, 
                          f"User created: {test_user_email}", create_duration)
            
            # Step 2: Soft delete user
            response = self.session.delete(f"{BACKEND_URL}/admin/users/{test_user_email}")
            if response.status_code != 200:
                self.log_result("Admin - Soft Delete User", False, 
                              f"Failed to soft delete: {response.status_code} - {response.text}")
                return False
            
            self.log_result("Admin - Soft Delete User", True, 
                          f"User soft deleted: {test_user_email}")
            
            # Step 3: Verify user appears in deleted users list
            response = self.session.get(f"{BACKEND_URL}/admin/deleted-users")
            if response.status_code != 200:
                self.log_result("Admin - Get Deleted Users", False, 
                              f"Failed to get deleted users: {response.status_code}")
                return False
            
            deleted_users = response.json()
            user_found_in_deleted = any(user.get("email") == test_user_email for user in deleted_users)
            
            if not user_found_in_deleted:
                self.log_result("Admin - Verify in Deleted List", False, 
                              f"User not found in deleted users list")
                return False
            
            self.log_result("Admin - Verify in Deleted List", True, 
                          f"User found in deleted users list")
            
            # Step 4: Permanent delete
            response = self.session.delete(f"{BACKEND_URL}/admin/users/{test_user_email}/permanent")
            if response.status_code != 200:
                self.log_result("Admin - Permanent Delete", False, 
                              f"Failed to permanently delete: {response.status_code} - {response.text}")
                return False
            
            perm_delete_data = response.json()
            deleted_count = perm_delete_data.get("deleted_count", 0)
            
            if deleted_count != 1:
                self.log_result("Admin - Permanent Delete Count", False, 
                              f"Expected deleted_count=1, got {deleted_count}")
                return False
            
            self.log_result("Admin - Permanent Delete", True, 
                          f"User permanently deleted, deleted_count={deleted_count}")
            
            # Step 5: Verify user NO LONGER appears in deleted users list
            response = self.session.get(f"{BACKEND_URL}/admin/deleted-users")
            if response.status_code != 200:
                self.log_result("Admin - Final Verification", False, 
                              f"Failed to get deleted users for verification: {response.status_code}")
                return False
            
            deleted_users_after = response.json()
            user_still_in_deleted = any(user.get("email") == test_user_email for user in deleted_users_after)
            
            if user_still_in_deleted:
                self.log_result("Admin - Final Verification", False, 
                              f"User still appears in deleted users list after permanent deletion")
                return False
            
            self.log_result("Admin - Final Verification", True, 
                          f"User successfully removed from deleted users list")
            
            total_duration = time.time() - start_time
            self.log_result("Admin - Permanent Deletion Flow", True, 
                          f"Complete flow successful: create → soft delete → verify → permanent delete → verify removal", total_duration)
            return True
            
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Admin - Permanent Deletion Flow", False, f"Error: {str(e)}", duration)
            return False
    
    def test_admin_authentication_flow(self):
        """Test admin authentication flow"""
        print(f"\n🔐 Testing Admin Authentication Flow...")
        
        start_time = time.time()
        try:
            # Test login with correct credentials
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                data={
                    "username": TEST_USERNAME,
                    "password": TEST_PASSWORD
                }
            )
            duration = time.time() - start_time
            
            if response.status_code != 200:
                self.log_result("Admin Authentication - Login", False, 
                              f"Login failed: {response.status_code} - {response.text}", duration)
                return False
            
            data = response.json()
            access_token = data.get("access_token")
            user_role = data.get("user_role")
            user_name = data.get("user_name")
            
            if not access_token:
                self.log_result("Admin Authentication - Token", False, 
                              "No access_token returned", duration)
                return False
            
            if user_role != "ADMIN":
                self.log_result("Admin Authentication - Role", False, 
                              f"Expected ADMIN role, got {user_role}", duration)
                return False
            
            self.log_result("Admin Authentication - Login", True, 
                          f"Login successful: {user_name} (role: {user_role})", duration)
            
            # Test using token for protected endpoint
            headers = {"Authorization": f"Bearer {access_token}"}
            response = self.session.get(f"{BACKEND_URL}/admin/users", headers=headers)
            
            if response.status_code != 200:
                self.log_result("Admin Authentication - Protected Access", False, 
                              f"Protected endpoint access failed: {response.status_code}")
                return False
            
            self.log_result("Admin Authentication - Protected Access", True, 
                          "Successfully accessed protected admin endpoint")
            
            return True
            
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Admin Authentication Flow", False, f"Error: {str(e)}", duration)
            return False
    
    def test_admin_user_listing(self):
        """Test admin user listing endpoints"""
        print(f"\n👥 Testing Admin User Listing...")
        
        start_time = time.time()
        try:
            # Ensure we have a fresh authentication token
            if not self.token:
                if not self.authenticate():
                    return False
            
            # Test GET /api/admin/users (active users)
            response = self.session.get(f"{BACKEND_URL}/admin/users")
            duration = time.time() - start_time
            
            if response.status_code != 200:
                self.log_result("Admin - Get Active Users", False, 
                              f"Failed to get active users: {response.status_code} - {response.text}", duration)
                return False
            
            active_users = response.json()
            
            if not isinstance(active_users, list):
                self.log_result("Admin - Get Active Users", False, 
                              f"Expected list, got {type(active_users)}", duration)
                return False
            
            # Verify users have deleted=false (or not present, which defaults to false)
            active_count = len(active_users)
            deleted_in_active = sum(1 for user in active_users if user.get("deleted", False))
            
            if deleted_in_active > 0:
                self.log_result("Admin - Active Users Validation", False, 
                              f"Found {deleted_in_active} deleted users in active list")
                return False
            
            self.log_result("Admin - Get Active Users", True, 
                          f"Retrieved {active_count} active users (deleted=false)", duration)
            
            # Test GET /api/admin/deleted-users (deleted users)
            response = self.session.get(f"{BACKEND_URL}/admin/deleted-users")
            
            if response.status_code != 200:
                self.log_result("Admin - Get Deleted Users", False, 
                              f"Failed to get deleted users: {response.status_code} - {response.text}")
                return False
            
            deleted_users = response.json()
            
            if not isinstance(deleted_users, list):
                self.log_result("Admin - Get Deleted Users", False, 
                              f"Expected list, got {type(deleted_users)}")
                return False
            
            # Verify users have deleted=true
            deleted_count = len(deleted_users)
            active_in_deleted = sum(1 for user in deleted_users if not user.get("deleted", False))
            
            if active_in_deleted > 0:
                self.log_result("Admin - Deleted Users Validation", False, 
                              f"Found {active_in_deleted} active users in deleted list")
                return False
            
            self.log_result("Admin - Get Deleted Users", True, 
                          f"Retrieved {deleted_count} deleted users (deleted=true)")
            
            total_duration = time.time() - start_time
            self.log_result("Admin - User Listing", True, 
                          f"Both endpoints working: {active_count} active, {deleted_count} deleted", total_duration)
            return True
            
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Admin - User Listing", False, f"Error: {str(e)}", duration)
            return False
    
    def run_admin_panel_tests(self):
        """Run admin panel functionality tests as specified in review request"""
        print("🔧 TESTE DO PAINEL ADMIN - Funcionalidades Específicas")
        print("CREDENCIAIS ADMIN: ur1fs / @Fred1807")
        print("URL BACKEND: https://meduf-ai-doctor.preview.emergentagent.com")
        print("=" * 80)
        
        tests_passed = 0
        total_tests = 3
        failed_tests = []
        
        # Test 1: Permanent User Deletion (BUG CORRECTED)
        print(f"\n1️⃣ EXCLUSÃO PERMANENTE DE USUÁRIO (BUG CORRIGIDO)")
        # Fresh authentication for this test
        if not self.authenticate():
            print("\n❌ Authentication failed - cannot proceed with admin tests")
            return False
        
        if self.test_admin_permanent_user_deletion():
            tests_passed += 1
            print(f"   ✅ Exclusão permanente - SUCESSO")
        else:
            failed_tests.append("Exclusão Permanente de Usuário")
            print(f"   ❌ Exclusão permanente - FALHOU")
        
        # Test 2: Authentication Flow
        print(f"\n2️⃣ FLUXO DE AUTENTICAÇÃO")
        if self.test_admin_authentication_flow():
            tests_passed += 1
            print(f"   ✅ Autenticação - SUCESSO")
        else:
            failed_tests.append("Fluxo de Autenticação")
            print(f"   ❌ Autenticação - FALHOU")
        
        # Test 3: User Listing
        print(f"\n3️⃣ LISTAGEM DE USUÁRIOS")
        # Fresh authentication for this test since previous test may have invalidated session
        if not self.authenticate():
            print("\n❌ Re-authentication failed for user listing test")
            failed_tests.append("Listagem de Usuários")
            print(f"   ❌ Listagem de usuários - FALHOU")
        elif self.test_admin_user_listing():
            tests_passed += 1
            print(f"   ✅ Listagem de usuários - SUCESSO")
        else:
            failed_tests.append("Listagem de Usuários")
            print(f"   ❌ Listagem de usuários - FALHOU")
        
        # Final Results
        print("\n" + "=" * 80)
        print(f"📊 RESULTADO FINAL ADMIN: {tests_passed}/{total_tests} testes PASSARAM")
        success_rate = (tests_passed / total_tests) * 100
        print(f"📈 Taxa de Sucesso: {success_rate:.1f}%")
        
        if tests_passed == total_tests:
            print("🎉 ✅ TODOS os testes do painel admin PASSARAM (100%)")
            print("🎉 ✅ Exclusão permanente funcionando corretamente")
            print("🎉 ✅ Autenticação com credenciais admin funcionando")
            print("🎉 ✅ Listagem de usuários ativos e excluídos funcionando")
            print("🎉 PAINEL ADMIN - TOTALMENTE FUNCIONAL!")
            return True
        else:
            print(f"⚠️ ❌ {total_tests - tests_passed} testes FALHARAM")
            print(f"⚠️ ❌ Taxa de falha: {100 - success_rate:.1f}%")
            print("❌ TESTES FALHARAM:")
            for failed_test in failed_tests:
                print(f"   - {failed_test}")
            return False

    def run_all_tests(self):
        """Run all backend tests - both consensus and admin panel tests"""
        print("🚀 TESTE COMPLETO DO BACKEND - Consenso AI + Painel Admin")
        print("=" * 80)
        
        # Run admin panel tests first (as per review request)
        admin_success = self.run_admin_panel_tests()
        
        print("\n" + "=" * 80)
        
        # Run consensus tests
        consensus_success = self.run_review_request_tests()
        
        # Overall results
        print("\n" + "=" * 80)
        print("📊 RESULTADO GERAL:")
        print(f"   Admin Panel: {'✅ PASSOU' if admin_success else '❌ FALHOU'}")
        print(f"   Consensus AI: {'✅ PASSOU' if consensus_success else '❌ FALHOU'}")
        
        overall_success = admin_success and consensus_success
        print(f"\n🎯 RESULTADO FINAL: {'✅ TODOS OS TESTES PASSARAM' if overall_success else '❌ ALGUNS TESTES FALHARAM'}")
        
        return overall_success

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