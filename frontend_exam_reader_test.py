#!/usr/bin/env python3
"""
Frontend Exam Reader Test - Test the actual frontend behavior
"""

import requests
import time
import json
import base64
import io
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

# Configuration
BACKEND_URL = "https://meduf-ai-1.preview.emergentagent.com/api"
TEST_USERNAME = "ur1fs"
TEST_PASSWORD = "@Fred1807"

class FrontendExamReaderTester:
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

    def create_problematic_exam_image(self):
        """Create an exam image that might cause processing issues"""
        try:
            # Create a very detailed, high-resolution image
            img = Image.new('RGB', (2000, 3000), color='white')
            draw = ImageDraw.Draw(img)
            
            # Try to use fonts
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
                title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
                small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
            except:
                font = ImageFont.load_default()
                title_font = ImageFont.load_default()
                small_font = ImageFont.load_default()
            
            # Create a very complex exam with lots of text and values
            y_pos = 50
            
            # Header
            draw.text((50, y_pos), "LABORATÓRIO CLÍNICO COMPLEXO - EXAME DETALHADO", fill='black', font=title_font)
            y_pos += 50
            draw.text((50, y_pos), "Paciente: João Silva Santos - ID: 123456789", fill='black', font=font)
            y_pos += 30
            draw.text((50, y_pos), "Data: 02/12/2024 - Hora: 08:30 - Médico: Dr. Cardiologista", fill='black', font=font)
            y_pos += 50
            
            # Create many sections with lots of values
            sections = [
                ("HEMOGRAMA COMPLETO", [
                    "Hemoglobina: 8.2 g/dL (VR: 12.0-16.0) ↓ CRÍTICO",
                    "Hematócrito: 24% (VR: 36-46%) ↓ BAIXO",
                    "Eritrócitos: 2.8 milhões/mm³ (VR: 4.0-5.5) ↓",
                    "VCM: 78 fL (VR: 80-100) ↓ MICROCÍTICO",
                    "HCM: 22 pg (VR: 27-32) ↓ HIPOCRÔMICO",
                    "CHCM: 28% (VR: 32-36%) ↓",
                    "RDW: 18% (VR: 11.5-14.5%) ↑ ANISOCITOSE",
                    "Leucócitos: 22.000/mm³ (VR: 4.000-11.000) ↑ LEUCOCITOSE",
                    "Neutrófilos: 18.000/mm³ (82%) ↑ NEUTROFILIA",
                    "Linfócitos: 2.200/mm³ (10%) ↓ LINFOPENIA",
                    "Monócitos: 1.100/mm³ (5%) NORMAL",
                    "Eosinófilos: 440/mm³ (2%) NORMAL",
                    "Basófilos: 220/mm³ (1%) NORMAL",
                    "Plaquetas: 85.000/mm³ (VR: 150.000-400.000) ↓ PLAQUETOPENIA"
                ]),
                ("BIOQUÍMICA SÉRICA COMPLETA", [
                    "Glicose: 350 mg/dL (VR: 70-100) ↑ HIPERGLICEMIA SEVERA",
                    "Ureia: 220 mg/dL (VR: 15-45) ↑ AZOTEMIA",
                    "Creatinina: 5.8 mg/dL (VR: 0.6-1.2) ↑ INSUFICIÊNCIA RENAL",
                    "Ácido Úrico: 12 mg/dL (VR: 3.5-7.0) ↑ HIPERURICEMIA",
                    "Sódio: 125 mEq/L (VR: 136-145) ↓ HIPONATREMIA",
                    "Potássio: 6.2 mEq/L (VR: 3.5-5.0) ↑ HIPERCALEMIA",
                    "Cloro: 95 mEq/L (VR: 98-107) ↓ HIPOCLOREMIA",
                    "Cálcio: 7.8 mg/dL (VR: 8.5-10.5) ↓ HIPOCALCEMIA",
                    "Fósforo: 8.5 mg/dL (VR: 2.5-4.5) ↑ HIPERFOSFATEMIA",
                    "Magnésio: 1.2 mg/dL (VR: 1.7-2.2) ↓ HIPOMAGNESEMIA"
                ]),
                ("FUNÇÃO HEPÁTICA", [
                    "TGO/AST: 280 U/L (VR: 10-40) ↑ HEPATOPATIA",
                    "TGP/ALT: 320 U/L (VR: 10-40) ↑ LESÃO HEPATOCELULAR",
                    "Fosfatase Alcalina: 450 U/L (VR: 44-147) ↑ COLESTASE",
                    "GGT: 380 U/L (VR: 9-48) ↑ HEPATOPATIA",
                    "Bilirrubina Total: 12.5 mg/dL (VR: 0.2-1.2) ↑ ICTERÍCIA",
                    "Bilirrubina Direta: 8.2 mg/dL (VR: 0.0-0.3) ↑ COLESTASE",
                    "Bilirrubina Indireta: 4.3 mg/dL (VR: 0.2-0.8) ↑ HEMÓLISE",
                    "Albumina: 2.1 g/dL (VR: 3.5-5.0) ↓ HIPOALBUMINEMIA",
                    "Proteínas Totais: 5.2 g/dL (VR: 6.0-8.3) ↓ HIPOPROTEINEMIA"
                ]),
                ("PERFIL LIPÍDICO", [
                    "Colesterol Total: 380 mg/dL (VR: <200) ↑ HIPERCOLESTEROLEMIA",
                    "HDL: 18 mg/dL (VR: >40) ↓ BAIXO HDL",
                    "LDL: 280 mg/dL (VR: <100) ↑ ALTO LDL",
                    "VLDL: 82 mg/dL (VR: <30) ↑ ALTO VLDL",
                    "Triglicérides: 650 mg/dL (VR: <150) ↑ HIPERTRIGLICERIDEMIA",
                    "Apolipoproteína A1: 85 mg/dL (VR: 115-220) ↓",
                    "Apolipoproteína B: 180 mg/dL (VR: 60-133) ↑"
                ]),
                ("MARCADORES CARDÍACOS", [
                    "Troponina I: 15.2 ng/mL (VR: <0.04) ↑ INFARTO AGUDO",
                    "CK-MB: 85 ng/mL (VR: <6.3) ↑ LESÃO MIOCÁRDICA",
                    "CK Total: 1200 U/L (VR: 30-200) ↑ RABDOMIÓLISE",
                    "LDH: 850 U/L (VR: 120-246) ↑ NECROSE TECIDUAL",
                    "Mioglobina: 450 ng/mL (VR: 25-72) ↑ LESÃO MUSCULAR"
                ]),
                ("COAGULAÇÃO", [
                    "TP: 28 seg (VR: 11-13) ↑ COAGULOPATIA",
                    "INR: 2.8 (VR: 0.8-1.2) ↑ ANTICOAGULAÇÃO",
                    "TTPA: 65 seg (VR: 25-35) ↑ COAGULOPATIA",
                    "Fibrinogênio: 150 mg/dL (VR: 200-400) ↓ HIPOFIBRINOGENEMIA",
                    "D-Dímero: 2500 ng/mL (VR: <500) ↑ TROMBOSE"
                ])
            ]
            
            # Draw all sections
            for section_title, values in sections:
                draw.text((50, y_pos), section_title, fill='black', font=title_font)
                y_pos += 40
                
                for value in values:
                    color = 'red' if '↑' in value or '↓' in value or 'CRÍTICO' in value else 'black'
                    draw.text((70, y_pos), f"• {value}", fill=color, font=small_font)
                    y_pos += 25
                
                y_pos += 30
            
            # Add observations
            draw.text((50, y_pos), "OBSERVAÇÕES CRÍTICAS:", fill='red', font=title_font)
            y_pos += 40
            
            observations = [
                "QUADRO CLÍNICO GRAVE - MÚLTIPLAS ALTERAÇÕES",
                "Anemia severa com sinais de hemólise",
                "Insuficiência renal aguda com distúrbios eletrolíticos",
                "Hepatopatia grave com icterícia e coagulopatia",
                "Infarto agudo do miocárdio em curso",
                "Hiperglicemia severa - cetoacidose diabética?",
                "Processo inflamatório sistêmico grave",
                "NECESSITA INTERNAÇÃO IMEDIATA EM UTI"
            ]
            
            for obs in observations:
                draw.text((70, y_pos), f"• {obs}", fill='red', font=small_font)
                y_pos += 25
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG', quality=95)
            img_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            print(f"📸 Created complex problematic exam image ({len(img_data)} bytes)")
            return img_data
            
        except Exception as e:
            print(f"❌ Error creating problematic test image: {e}")
            return None

    def test_frontend_progress_behavior(self):
        """Test frontend progress behavior to identify 25% stuck issue"""
        print(f"\n🔬 Testing Frontend Progress Behavior...")
        
        # Create problematic test image
        test_image = self.create_problematic_exam_image()
        if not test_image:
            self.log_result("Frontend Test - Image Creation", False, "Failed to create test image")
            return False
        
        start_time = time.time()
        try:
            # Prepare multipart form data
            files = {
                'files': ('problematic_exam.png', base64.b64decode(test_image), 'image/png')
            }
            data = {
                'additional_info': 'Paciente crítico - múltiplas comorbidades - análise urgente necessária'
            }
            
            print("📤 Uploading problematic exam image...")
            
            # Submit exam analysis request
            response = self.session.post(
                f"{BACKEND_URL}/ai/analyze-exam",
                files=files,
                data=data
            )
            submit_duration = time.time() - start_time
            
            print(f"📊 Upload response: {response.status_code}")
            if response.status_code != 200:
                self.log_result("Frontend Test - Upload", False, 
                              f"Upload failed: {response.status_code} - {response.text}", submit_duration)
                return False
            
            response_data = response.json()
            task_id = response_data.get("task_id")
            
            if not task_id:
                self.log_result("Frontend Test - Upload", False, 
                              "No task_id returned", submit_duration)
                return False
            
            self.log_result("Frontend Test - Upload Speed", True, 
                          f"Upload successful with task_id: {task_id}", submit_duration)
            
            # Simulate frontend polling behavior exactly as the frontend does
            return self.simulate_frontend_polling(task_id, "Frontend Behavior Test")
            
        except Exception as e:
            duration = time.time() - start_time
            self.log_result("Frontend Test - Upload", False, f"Error: {str(e)}", duration)
            return False

    def simulate_frontend_polling(self, task_id, test_name):
        """Simulate exact frontend polling behavior"""
        print(f"📊 Simulating Frontend Polling for {test_name}...")
        
        start_time = time.time()
        attempts = 0
        max_attempts = 90  # Same as frontend
        frontend_progress_history = []
        backend_progress_history = []
        
        try:
            while attempts < max_attempts:
                attempts += 1
                poll_start = time.time()
                
                # Calculate frontend progress exactly as frontend does
                frontend_progress = min(20 + (attempts * 70 / max_attempts), 90)
                
                # Get actual backend progress
                response = self.session.get(f"{BACKEND_URL}/ai/tasks/{task_id}")
                poll_duration = time.time() - poll_start
                
                if response.status_code != 200:
                    self.log_result(f"{test_name} - Polling", False, 
                                  f"Poll failed: {response.status_code} - {response.text}", poll_duration)
                    return False
                
                data = response.json()
                backend_status = data.get("status")
                backend_progress = data.get("progress", 0)
                
                # Track both frontend and backend progress
                frontend_progress_history.append({
                    'attempt': attempts,
                    'frontend_progress': frontend_progress,
                    'time': time.time() - start_time
                })
                
                backend_progress_history.append({
                    'attempt': attempts,
                    'backend_progress': backend_progress,
                    'backend_status': backend_status,
                    'time': time.time() - start_time
                })
                
                # Determine frontend progress message (same logic as frontend)
                if attempts < 15:
                    progress_message = 'Lendo valores da imagem...'
                elif attempts < 30:
                    progress_message = 'Identificando alterações...'
                elif attempts < 60:
                    progress_message = 'Analisando significado clínico...'
                else:
                    progress_message = 'Finalizando análise...'
                
                print(f"  Attempt #{attempts}: Frontend={frontend_progress:.1f}%, Backend={backend_progress}% ({backend_status}) - {progress_message}")
                
                # Check for the 25% stuck issue
                if attempts >= 10:  # After 10 seconds
                    recent_frontend = [p['frontend_progress'] for p in frontend_progress_history[-5:]]
                    recent_backend = [p['backend_progress'] for p in backend_progress_history[-5:]]
                    
                    # Check if frontend shows progress but backend is stuck
                    if (all(20 <= p <= 30 for p in recent_backend) and 
                        backend_status == "processing" and 
                        max(recent_frontend) > 30):
                        
                        self.log_result(f"{test_name} - 25% STUCK DETECTED", False, 
                                      f"Backend stuck at ~25% while frontend shows {frontend_progress:.1f}%", 
                                      time.time() - start_time)
                        # Continue monitoring to see if it recovers
                
                # Check completion
                if backend_status == "completed":
                    total_duration = time.time() - start_time
                    result = data.get("result")
                    
                    if not result:
                        self.log_result(f"{test_name} - Result", False, 
                                      "Task completed but no result returned", total_duration)
                        return False
                    
                    # Log progress comparison
                    print(f"\n📊 PROGRESS ANALYSIS:")
                    print(f"  Final Frontend Progress: {frontend_progress:.1f}%")
                    print(f"  Final Backend Progress: {backend_progress}%")
                    print(f"  Total Duration: {total_duration:.1f}s")
                    print(f"  Total Attempts: {attempts}")
                    
                    # Check for discrepancies
                    max_frontend = max([p['frontend_progress'] for p in frontend_progress_history])
                    max_backend = max([p['backend_progress'] for p in backend_progress_history])
                    
                    if max_frontend > max_backend + 20:  # Significant discrepancy
                        self.log_result(f"{test_name} - Progress Discrepancy", False, 
                                      f"Frontend showed {max_frontend:.1f}% while backend max was {max_backend}%")
                    
                    self.log_result(f"{test_name} - Completion", True, 
                                  f"Analysis completed successfully", total_duration)
                    
                    return True
                
                elif backend_status == "failed":
                    total_duration = time.time() - start_time
                    error = data.get("error", "Unknown error")
                    self.log_result(f"{test_name} - Completion", False, 
                                  f"Task failed: {error}", total_duration)
                    
                    # Log progress history for debugging
                    print(f"  📊 Frontend Progress History: {frontend_progress_history}")
                    print(f"  📊 Backend Progress History: {backend_progress_history}")
                    return False
                
                # Wait 1 second (same as frontend)
                time.sleep(1)
            
            # Timeout reached
            self.log_result(f"{test_name} - Timeout", False, 
                          f"Frontend timeout after {max_attempts}s", max_attempts)
            
            # Log final progress states
            print(f"  📊 TIMEOUT ANALYSIS:")
            print(f"  Final Frontend Progress: {frontend_progress:.1f}%")
            print(f"  Final Backend Progress: {backend_progress}% ({backend_status})")
            print(f"  Frontend Progress History: {frontend_progress_history[-5:]}")
            print(f"  Backend Progress History: {backend_progress_history[-5:]}")
            
            return False
                    
        except Exception as e:
            duration = time.time() - start_time
            self.log_result(f"{test_name} - Polling", False, f"Polling error: {str(e)}", duration)
            return False

    def run_frontend_tests(self):
        """Run frontend-specific tests"""
        print("🚀 Starting Frontend Exam Reader Tests")
        print("=" * 60)
        
        # Authentication
        if not self.authenticate():
            print("\n❌ Authentication failed - cannot proceed with tests")
            return False
        
        tests_passed = 0
        total_tests = 0
        
        # Test 1: Frontend progress behavior
        total_tests += 1
        if self.test_frontend_progress_behavior():
            tests_passed += 1
        
        # Summary
        print("\n" + "=" * 60)
        print(f"📊 FRONTEND TEST SUMMARY: {tests_passed}/{total_tests} tests passed")
        
        if tests_passed == total_tests:
            print("🎉 ALL FRONTEND TESTS PASSED!")
            return True
        else:
            print(f"⚠️  {total_tests - tests_passed} tests failed - see details above")
            return False

def main():
    """Main test execution"""
    tester = FrontendExamReaderTester()
    success = tester.run_frontend_tests()
    
    # Print detailed results
    print("\n📋 DETAILED FRONTEND TEST RESULTS:")
    print("-" * 40)
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        duration = f" ({result['duration']:.2f}s)" if result["duration"] else ""
        print(f"{status} {result['test']}: {result['message']}{duration}")
    
    return success

if __name__ == "__main__":
    main()