"""
AI Engine - Centralized clinical decision support logic
Replaces frontend if/else chains with backend processing
"""
from typing import Dict, List, Any, Optional
from pydantic import BaseModel


class DiagnosisResult(BaseModel):
    diagnoses: List[Dict[str, str]]
    conduct: Dict[str, Any]
    medications: List[Dict[str, str]]


class MedicationItem(BaseModel):
    name: str
    dose: str
    frequency: str
    notes: str
    contraindications: Optional[str] = None


class ToxicologyResult(BaseModel):
    agent: str
    antidote: str
    mechanism: str
    conduct: List[str]
    protocol: str


class InteractionResult(BaseModel):
    severity: str
    summary: str
    details: str
    recommendations: str
    renal_impact: Optional[str] = None
    hepatic_impact: Optional[str] = None
    monitoring: Optional[Dict[str, List[str]]] = None


def normalize_text(text: str) -> str:
    """Normalize text for keyword matching"""
    import unicodedata
    text = text.lower()
    text = unicodedata.normalize('NFD', text)
    text = ''.join(char for char in text if unicodedata.category(char) != 'Mn')
    return text


def analyze_detailed_diagnosis(patient_data: Dict[str, Any]) -> DiagnosisResult:
    """Detailed diagnosis with full patient context"""
    complaint = normalize_text(patient_data.get("queixa", ""))
    age = patient_data.get("idade", "")
    sex = patient_data.get("sexo", "")
    history = normalize_text(patient_data.get("historia", ""))
    
    # Gynecological / Obstetric
    if any(kw in complaint for kw in ["menstruacao", "atraso", "sangramento vaginal", "colica", "gestante", "gravida"]):
        return DiagnosisResult(
            diagnoses=[
                {
                    "name": "Distúrbio Menstrual / Sangramento Uterino Anormal",
                    "justification": "Queixa relacionada ao ciclo menstrual. Considera-se oligomenorreia, amenorreia secundária, menorragia ou metrorragia. Se gestante, descartar aborto/gravidez ectópica."
                }
            ],
            conduct={
                "advice": "Solicitar βHCG, hemograma, coagulograma. Se gestante: USG obstétrico. Encaminhar ginecologia se sangramento volumoso ou instabilidade hemodinâmica.",
                "procedures": [
                    "Exame especular (descartar lesões cervicais)",
                    "Toque bimanual (avaliar útero/anexos)",
                    "βHCG sérico",
                    "Hemograma + Coagulograma"
                ]
            },
            medications=[
                {
                    "name": "Ácido Tranexâmico",
                    "dosage": "1g VO 3x/dia (se sangramento ativo)",
                    "mechanism": "Antifibrinolítico. Reduz perda sanguínea menstrual."
                },
                {
                    "name": "Contraceptivo Oral Combinado",
                    "dosage": "1 cp/dia por 21 dias (se não contraindicado)",
                    "mechanism": "Regulação do ciclo. Contém estrogênio + progestagênio."
                }
            ]
        )
    
    # Chest Pain / Cardiac
    elif any(kw in complaint for kw in ["dor no peito", "torax", "precordial", "infarto", "coracao"]):
        return DiagnosisResult(
            diagnoses=[
                {
                    "name": "Síndrome Coronariana Aguda (SCA) - A descartar",
                    "justification": "Dor torácica retroesternal, que pode irradiar para mandíbula/braço. Fatores de risco: HAS, DM, tabagismo. ECG pode mostrar supradesnivelamento do ST (IAMCSST) ou inversão de onda T (SCA sem supra)."
                }
            ],
            conduct={
                "advice": "ECG em < 10min. Troponina seriada (0h/3h). Considerar MONA (Morfina, O2, Nitrato, AAS) se SCA confirmada. Avaliação cardiológica urgente.",
                "procedures": [
                    "ECG de 12 derivações",
                    "Troponina I/T seriada",
                    "RX Tórax (descartar pneumotórax/dissecção)",
                    "Acesso venoso calibroso"
                ]
            },
            medications=[
                {
                    "name": "AAS (Ácido Acetilsalicílico)",
                    "dosage": "200-300mg VO (mastigar) dose de ataque",
                    "mechanism": "Antiagregante plaquetário. Reduz mortalidade em SCA."
                },
                {
                    "name": "Clopidogrel",
                    "dosage": "300-600mg VO dose de ataque",
                    "mechanism": "Inibidor P2Y12. Terapia dupla antiagregante."
                },
                {
                    "name": "Morfina",
                    "dosage": "2-4mg IV lento (se dor refratária)",
                    "mechanism": "Analgesia opioide. Reduz pré-carga."
                }
            ]
        )
    
    # Abdominal Pain
    elif any(kw in complaint for kw in ["barriga", "abdominal", "estomago", "epigastrica", "figado", "intestino"]):
        return DiagnosisResult(
            diagnoses=[
                {
                    "name": "Abdome Agudo (etiologia a esclarecer)",
                    "justification": "Dor abdominal aguda pode ser inflamatória (apendicite), obstrutiva (volvo), vascular (isquemia), perfurativa (úlcera) ou hemorrágica (gravidez ectópica)."
                }
            ],
            conduct={
                "advice": "Exame físico: dor à descompressão brusca (Blumberg), defesa, sinal de Murphy. Diferenciar abdome cirúrgico de clínico. USG/TC se necessário.",
                "procedures": [
                    "Hemograma (leucocitose com desvio)",
                    "Amilase/Lipase (pancreatite)",
                    "Função hepática (colecistite)",
                    "βHCG (mulheres em idade fértil)"
                ]
            },
            medications=[
                {
                    "name": "Dipirona",
                    "dosage": "1g IV (analgesia sintomática)",
                    "mechanism": "Analgésico/antitérmico. Não mascarar abdome cirúrgico."
                },
                {
                    "name": "Omeprazol",
                    "dosage": "40mg IV (se suspeita de úlcera péptica)",
                    "mechanism": "Inibidor de bomba de prótons."
                }
            ]
        )
    
    # Respiratory / Fever
    elif any(kw in complaint for kw in ["febre", "tosse", "ar", "garganta", "pulmao", "respirar", "covid", "coronavirus", "gripe", "influenza"]):
        if any(kw in complaint for kw in ["covid", "coronavirus"]):
            return DiagnosisResult(
                diagnoses=[
                    {
                        "name": "COVID-19 (Suspeita)",
                        "justification": "Quadro respiratório febril + contato com caso confirmado ou surto ativo. Sintomas: febre, tosse seca, dispneia, anosmia/ageusia. RT-PCR confirmatório."
                    }
                ],
                conduct={
                    "advice": "Isolamento domiciliar se leve. Saturação O2 < 94%: internação. RT-PCR/teste rápido. Monitorar sinais de alarme (dispneia progressiva).",
                    "procedures": [
                        "RT-PCR para SARS-CoV-2",
                        "Hemograma (linfopenia típica)",
                        "RX Tórax (se dispneia)",
                        "D-Dímero/PCR (marcadores de gravidade)"
                    ]
                },
                medications=[
                    {
                        "name": "Paracetamol",
                        "dosage": "750mg-1g VO 6/6h",
                        "mechanism": "Antitérmico (evitar AINEs se possível)."
                    },
                    {
                        "name": "Dexametasona",
                        "dosage": "6mg/dia VO/IV por 10 dias (se O2 necessário)",
                        "mechanism": "Corticoide. Reduz mortalidade em casos graves."
                    }
                ]
            )
        else:
            return DiagnosisResult(
                diagnoses=[
                    {
                        "name": "Infecção Respiratória Alta / Pneumonia",
                        "justification": "Febre + tosse produtiva + dispneia sugerem pneumonia comunitária. Ausculta com estertores/crepitantes. RX pode mostrar infiltrado."
                    }
                ],
                conduct={
                    "advice": "Avaliar critérios CURB-65 (confusão, ureia, FR, PA, idade). RX tórax. Oximetria. Internar se grave.",
                    "procedures": [
                        "RX Tórax (PA + Perfil)",
                        "Hemograma + PCR",
                        "Gasometria arterial (se grave)",
                        "Cultura de escarro (se disponível)"
                    ]
                },
                medications=[
                    {
                        "name": "Amoxicilina + Clavulanato",
                        "dosage": "875/125mg VO 12/12h por 7-10 dias",
                        "mechanism": "Antibiótico β-lactâmico. Cobertura para S. pneumoniae."
                    },
                    {
                        "name": "Azitromicina",
                        "dosage": "500mg VO 1x/dia por 5 dias",
                        "mechanism": "Macrolídeo. Alternativa se alergia à penicilina."
                    }
                ]
            )
    
    # Vector-borne diseases
    elif any(kw in complaint for kw in ["malaria", "paludismo", "dengue", "zika", "chikungunya", "picada", "mosquito"]):
        if any(kw in complaint for kw in ["malaria", "paludismo"]):
            return DiagnosisResult(
                diagnoses=[
                    {
                        "name": "Malária (Paludismo)",
                        "justification": "Febre cíclica (terçã/quartã) + história de viagem a área endêmica. Esfregaço/gota espessa positivo para Plasmodium."
                    }
                ],
                conduct={
                    "advice": "Confirmação parasitológica (gota espessa). Espécie define tratamento. P. falciparum: tratamento urgente (risco de malária cerebral).",
                    "procedures": [
                        "Gota espessa + esfregaço",
                        "Hemograma (anemia hemolítica, trombocitopenia)",
                        "Função renal (complicação)",
                        "Monitorar parasitemia"
                    ]
                },
                medications=[
                    {
                        "name": "Artemeter + Lumefantrina (Coartem)",
                        "dosage": "Dose por peso, 6 doses em 3 dias",
                        "mechanism": "Antimalárico (falciparum). Primeira linha no Brasil."
                    },
                    {
                        "name": "Primaquina",
                        "dosage": "0.5mg/kg/dia por 7 dias (vivax)",
                        "mechanism": "Elimina hipnozoítos hepáticos. Previne recaída."
                    }
                ]
            )
        else:
            return DiagnosisResult(
                diagnoses=[
                    {
                        "name": "Arbovirose (Dengue / Zika / Chikungunya)",
                        "justification": "Febre alta súbita + mialgia + exantema + manifestações hemorrágicas sugerem dengue. Zika: exantema mais proeminente. Chikungunya: artralgia intensa."
                    }
                ],
                conduct={
                    "advice": "Hidratação oral/venosa. Monitorar sinais de alarme (dor abdominal intensa, vômitos, sangramento). Prova do laço. Hemograma seriado.",
                    "procedures": [
                        "Hemograma (hemoconcentração, plaquetopenia)",
                        "Provas de função hepática",
                        "NS1/IgM para dengue",
                        "Avaliar critérios de internação"
                    ]
                },
                medications=[
                    {
                        "name": "Paracetamol",
                        "dosage": "750mg VO 6/6h",
                        "mechanism": "Analgésico/antitérmico. NÃO usar AINEs (risco de sangramento)."
                    },
                    {
                        "name": "Soro Fisiológico 0.9%",
                        "dosage": "Hidratação venosa (se sinais de alarme)",
                        "mechanism": "Expansão volêmica. Evitar choque."
                    }
                ]
            )
    
    # Headache
    elif any(kw in complaint for kw in ["cabeca", "cefaleia", "enxaqueca", "tontura"]):
        return DiagnosisResult(
            diagnoses=[
                {
                    "name": "Enxaqueca (Migrânea)",
                    "justification": "Cefaleia pulsátil, unilateral, de intensidade moderada-grave. Associada a náusea, fotofobia. Piora com atividade física. História familiar comum."
                }
            ],
            conduct={
                "advice": "Descartar cefaleias secundárias (hemorragia subaracnóidea se cefaleia em 'trovoada', meningite se febre/rigidez nucal). TC crânio se sinais de alarme.",
                "procedures": [
                    "Exame neurológico completo",
                    "TC crânio (se cefaleia súbita/intensa)",
                    "Punção lombar (se suspeita de meningite)",
                    "Fundoscopia (papiledema)"
                ]
            },
            medications=[
                {
                    "name": "Sumatriptano",
                    "dosage": "50-100mg VO ou 6mg SC (crise)",
                    "mechanism": "Agonista 5-HT1. Tratamento abortivo da enxaqueca."
                },
                {
                    "name": "Dipirona",
                    "dosage": "1g IV/VO",
                    "mechanism": "Analgésico. Primeira escolha em muitos serviços."
                },
                {
                    "name": "Metoclopramida",
                    "dosage": "10mg IV (para náusea)",
                    "mechanism": "Antiemético + procinético."
                }
            ]
        )
    
    # Musculoskeletal Pain
    elif any(kw in complaint for kw in ["dor", "costas", "lombar", "perna", "braco", "muscular"]):
        return DiagnosisResult(
            diagnoses=[
                {
                    "name": "Dor Musculoesquelética / Lombalgia Mecânica",
                    "justification": "Dor lombar de início gradual, relacionada a esforço físico. Sem sinais de alarme (febre, déficit neurológico, incontinência). Exame físico: dor à palpação paravertebral."
                }
            ],
            conduct={
                "advice": "Repouso relativo. Calor local. Fisioterapia. RX/RM se sinais de alarme ou persistência > 6 semanas.",
                "procedures": [
                    "Lasègue/Teste da perna estendida",
                    "Avaliar reflexos (L4-S1)",
                    "RX coluna lombossacra (se > 50 anos ou trauma)",
                    "RM (se déficit neurológico)"
                ]
            },
            medications=[
                {
                    "name": "Ibuprofeno",
                    "dosage": "400-600mg VO 8/8h",
                    "mechanism": "AINE. Anti-inflamatório + analgésico."
                },
                {
                    "name": "Ciclobenzaprina",
                    "dosage": "5-10mg VO à noite",
                    "mechanism": "Relaxante muscular. Reduz espasmo."
                }
            ]
        )
    
    # Default / Unknown
    else:
        return DiagnosisResult(
            diagnoses=[
                {
                    "name": "Quadro Inespecífico",
                    "justification": "Queixa não se enquadra em padrões comuns. Necessária anamnese e exame físico detalhados para elucidar diagnóstico."
                }
            ],
            conduct={
                "advice": "Reavaliação clínica completa. Exames complementares conforme hipóteses. Considerar diagnósticos diferenciais amplos.",
                "procedures": [
                    "Anamnese detalhada (HPMA completa)",
                    "Exame físico por aparelhos",
                    "Exames básicos: Hemograma, Função renal, Glicemia",
                    "Reavaliar em 24-48h"
                ]
            },
            medications=[
                {
                    "name": "Sintomáticos conforme necessário",
                    "dosage": "A definir com base na queixa principal",
                    "mechanism": "Aguardar esclarecimento diagnóstico."
                }
            ]
        )


def analyze_simple_diagnosis(text: str) -> DiagnosisResult:
    """Simplified diagnosis with text-only input"""
    # Reuse detailed diagnosis logic with minimal patient data
    return analyze_detailed_diagnosis({"queixa": text, "idade": "N/I", "sexo": "N/I", "historia": ""})


def get_medication_guide(symptoms: str) -> List[MedicationItem]:
    """Medication recommendations based on symptoms"""
    text = normalize_text(symptoms)
    
    # Pain/Fever/Inflammation
    if any(kw in text for kw in ["dor", "febre", "inflama", "quente", "algico", "doendo"]):
        return [
            MedicationItem(
                name="Dipirona",
                dose="500-1000mg",
                frequency="6/6h (máx 4g/dia)",
                notes="Analgésico potente. Antitérmico eficaz. Popular no Brasil.",
                contraindications="Risco raro de agranulocitose."
            ),
            MedicationItem(
                name="Paracetamol",
                dose="750mg-1g",
                frequency="6/6h (máx 4g/dia)",
                notes="Alternativa segura. Hepatotóxico em overdose.",
                contraindications="Doença hepática grave."
            ),
            MedicationItem(
                name="Ibuprofeno",
                dose="400-600mg",
                frequency="8/8h (máx 2.4g/dia)",
                notes="AINE. Efeito anti-inflamatório superior.",
                contraindications="Úlcera péptica, insuficiência renal."
            )
        ]
    
    # Nausea/Vomiting
    elif any(kw in text for kw in ["vomito", "nausea", "enjoo", "ansia", "tontura", "vertigem"]):
        return [
            MedicationItem(
                name="Metoclopramida",
                dose="10mg",
                frequency="8/8h VO/IV",
                notes="Procinético + antiemético. Atua no SNC e trato GI.",
                contraindications="Parkinson, epilepsia."
            ),
            MedicationItem(
                name="Ondansetrona",
                dose="4-8mg",
                frequency="8/8h VO/IV",
                notes="Antagonista 5-HT3. Eficaz em náusea quimioterápica.",
                contraindications="Evitar em síndrome QT longo."
            ),
            MedicationItem(
                name="Dimenidrato (Dramin)",
                dose="50-100mg",
                frequency="4-6h",
                notes="Anti-histamínico. Usado em cinetose/vertigem.",
                contraindications="Glaucoma, próstata aumentada."
            )
        ]
    
    # Allergy/Itching
    elif any(kw in text for kw in ["alergia", "coceira", "vermelh", "prurido", "picada", "incha"]):
        return [
            MedicationItem(
                name="Loratadina",
                dose="10mg",
                frequency="1x/dia",
                notes="Anti-histamínico de 2ª geração. Não causa sonolência.",
                contraindications="Raro."
            ),
            MedicationItem(
                name="Dexclorfeniramina",
                dose="2-6mg",
                frequency="8/8h",
                notes="Anti-histamínico de 1ª geração. Sonolência comum.",
                contraindications="Glaucoma, retenção urinária."
            ),
            MedicationItem(
                name="Prednisolona",
                dose="20-40mg",
                frequency="1x/dia por 3-5 dias",
                notes="Corticoide oral. Usar em alergias graves/urticária extensa.",
                contraindications="DM descompensado, infecções ativas."
            )
        ]
    
    # Respiratory
    elif any(kw in text for kw in ["tosse", "ar", "garganta", "peito", "respir"]):
        return [
            MedicationItem(
                name="Ambroxol",
                dose="30mg",
                frequency="8/8h",
                notes="Mucolítico/expectorante. Fluidifica secreções.",
                contraindications="Úlcera péptica ativa."
            ),
            MedicationItem(
                name="Dextrometorfano",
                dose="15-30mg",
                frequency="6-8h",
                notes="Antitussígeno. Suprime tosse seca improdutiva.",
                contraindications="Tosse produtiva (não usar)."
            ),
            MedicationItem(
                name="Salbutamol (Aerolin)",
                dose="2 puffs (100mcg cada)",
                frequency="6/6h ou SOS",
                notes="Broncodilatador. Indicado se broncoespasmo/asma.",
                contraindications="Cardiopatia grave."
            )
        ]
    
    # Gastrointestinal
    elif any(kw in text for kw in ["barriga", "estomago", "abdom", "gastrit", "queima"]):
        return [
            MedicationItem(
                name="Omeprazol",
                dose="20-40mg",
                frequency="1x/dia em jejum",
                notes="IBP. Suprime ácido gástrico. Indicado em DRGE/gastrite.",
                contraindications="Raro."
            ),
            MedicationItem(
                name="Ranitidina / Famotidina",
                dose="150mg / 20mg",
                frequency="12/12h",
                notes="Bloqueador H2. Alternativa ao IBP.",
                contraindications="Insuficiência renal (ajustar dose)."
            ),
            MedicationItem(
                name="Domperidona",
                dose="10mg",
                frequency="3x/dia antes das refeições",
                notes="Procinético. Melhora esvaziamento gástrico.",
                contraindications="Prolongamento QT."
            )
        ]
    
    # Default
    else:
        return [
            MedicationItem(
                name="Consulte um médico",
                dose="N/A",
                frequency="N/A",
                notes="Sintomas inespecíficos. Avaliação médica necessária para prescrição adequada.",
                contraindications="N/A"
            )
        ]


def get_drug_organ_impact(drug_name: str) -> Dict[str, str]:
    """Get renal and hepatic impact information for a drug"""
    drug = normalize_text(drug_name)
    
    # Database of common drug impacts on organs
    drug_impacts = {
        # Antibiotics
        "gentamicina": {"renal": "ALTA nefrotoxicidade (tubular renal). Risco de IRA.", "hepatic": "Baixo impacto hepático."},
        "vancomicina": {"renal": "Nefrotoxicidade moderada. Monitorar creatinina.", "hepatic": "Baixo impacto hepático."},
        "amicacina": {"renal": "ALTA nefrotoxicidade. Ajustar dose pela TFG.", "hepatic": "Mínimo impacto hepático."},
        
        # NSAIDs
        "ibuprofeno": {"renal": "Pode causar IRA em doses altas. Reduz TFG. Evitar em IRC.", "hepatic": "Hepatotoxicidade rara, mas possível."},
        "diclofenaco": {"renal": "Nefrotoxicidade dose-dependente. Risco de IRA.", "hepatic": "HEPATOTOXICIDADE significativa. Monitorar TGO/TGP."},
        "nimesulida": {"renal": "Moderada nefrotoxicidade.", "hepatic": "ALTO risco de hepatite medicamentosa."},
        "aine": {"renal": "Classe: redução da TFG, risco de IRA.", "hepatic": "Hepatotoxicidade variável por droga."},
        
        # Analgesics
        "paracetamol": {"renal": "Nefrotoxicidade em overdose crônica.", "hepatic": "HEPATOTOXICIDADE grave em overdose (>4g/dia). Necrose hepática."},
        "dipirona": {"renal": "Baixo impacto renal.", "hepatic": "Baixo impacto hepático."},
        
        # Anticoagulants
        "varfarina": {"renal": "Ajustar dose em IRC moderada/grave.", "hepatic": "Metabolização hepática. Risco de sangramento se disfunção."},
        "heparina": {"renal": "Segura em IRC.", "hepatic": "Não requer ajuste hepático."},
        
        # Cardiovascular
        "enalapril": {"renal": "Pode piorar função renal em estenose bilateral. Monitorar creatinina.", "hepatic": "Baixo impacto hepático."},
        "losartana": {"renal": "Reduz pressão glomerular. Monitorar K+ e creatinina.", "hepatic": "Metabolização hepática. Ajustar em cirrose."},
        "espironolactona": {"renal": "CONTRAINDICADO se TFG < 30. Risco de hipercalemia.", "hepatic": "Usar com cautela em cirrose."},
        "furosemida": {"renal": "Pode causar azotemia pré-renal se hipovolemia.", "hepatic": "Usar com cautela em cirrose (risco de encefalopatia)."},
        "hidroclorotiazida": {"renal": "Ineficaz se TFG < 30. Ajustar dose.", "hepatic": "Pode precipitar encefalopatia hepática."},
        
        # Statins
        "atorvastatina": {"renal": "Segura em IRC. Não requer ajuste.", "hepatic": "HEPATOTOXICIDADE. Monitorar TGO/TGP. Contraindicado em hepatopatia ativa."},
        "sinvastatina": {"renal": "Segura em IRC leve/moderada.", "hepatic": "HEPATOTOXICIDADE. Monitorar transaminases."},
        "rosuvastatina": {"renal": "Ajustar dose se TFG < 30.", "hepatic": "HEPATOTOXICIDADE. Contraindicado em cirrose."},
        
        # Antidiabetics
        "metformina": {"renal": "CONTRAINDICADO se TFG < 30. Risco de acidose láctica.", "hepatic": "Contraindicado em insuficiência hepática."},
        "glibenclamida": {"renal": "Risco de hipoglicemia prolongada em IRC. Evitar.", "hepatic": "Metabolização hepática. Ajustar dose."},
        
        # Antibiotics
        "ciprofloxacino": {"renal": "Ajustar dose se TFG < 30.", "hepatic": "Hepatotoxicidade rara."},
        "azitromicina": {"renal": "Segura em IRC.", "hepatic": "Hepatotoxicidade rara mas possível."},
        "amoxicilina": {"renal": "Ajustar dose se TFG < 30.", "hepatic": "Hepatite colestática rara (especialmente com clavulanato)."},
        
        # Anticonvulsants
        "fenitoina": {"renal": "Ajustar em IRC avançada.", "hepatic": "HEPATOTOXICIDADE. Monitorar níveis e função hepática."},
        "carbamazepina": {"renal": "Hiponatremia em IRC.", "hepatic": "HEPATOTOXICIDADE. Monitorar TGO/TGP."},
        "valproato": {"renal": "Seguro em IRC.", "hepatic": "HEPATOTOXICIDADE grave (rara). Monitorar amônia."},
        
        # Psychiatric
        "fluoxetina": {"renal": "Segura em IRC leve/moderada.", "hepatic": "Metabolização hepática. Ajustar em cirrose."},
        "sertralina": {"renal": "Segura em IRC.", "hepatic": "Ajustar dose em hepatopatia."},
        
        # Immunosuppressants
        "ciclosporina": {"renal": "ALTA nefrotoxicidade. Fibrose intersticial.", "hepatic": "Hepatotoxicidade. Monitorar níveis e função hepática."},
        "tacrolimus": {"renal": "NEFROTOXICIDADE significativa.", "hepatic": "Hepatotoxicidade. Monitorar níveis."},
        
        # Others
        "omeprazol": {"renal": "Nefrite intersticial (rara). Seguro geralmente.", "hepatic": "Metabolização hepática. Geralmente seguro."},
        "ranitidina": {"renal": "Ajustar dose se TFG < 50.", "hepatic": "Hepatotoxicidade rara."},
    }
    
    return drug_impacts.get(drug, {
        "renal": "Impacto renal não catalogado. Consultar bula/Micromedex.",
        "hepatic": "Impacto hepático não catalogado. Consultar bula/Micromedex."
    })


def analyze_drug_interaction(drug1: str, drug2: str) -> InteractionResult:
    """Check interactions between two drugs + renal and hepatic impact"""
    d1 = normalize_text(drug1)
    d2 = normalize_text(drug2)
    
    # Get organ impact for both drugs
    drug1_impact = get_drug_organ_impact(d1)
    drug2_impact = get_drug_organ_impact(d2)
    
    # Build monitoring recommendations
    monitoring = {
        "renal": [],
        "hepatic": [],
        "outros": []
    }
    
    # Check if any drug has renal impact
    if "nefrotoxicidade" in drug1_impact["renal"].lower() or "renal" in drug1_impact["renal"].lower() or "tgf" in drug1_impact["renal"].lower():
        monitoring["renal"].append("Monitorar Creatinina sérica")
        monitoring["renal"].append("Calcular TFG (Taxa de Filtração Glomerular)")
    if "nefrotoxicidade" in drug2_impact["renal"].lower() or "renal" in drug2_impact["renal"].lower() or "tgf" in drug2_impact["renal"].lower():
        if "Monitorar Creatinina sérica" not in monitoring["renal"]:
            monitoring["renal"].append("Monitorar Creatinina sérica")
            monitoring["renal"].append("Calcular TFG (Taxa de Filtração Glomerular)")
    
    # Check if any drug has hepatic impact
    if "hepatotoxicidade" in drug1_impact["hepatic"].lower() or "hepat" in drug1_impact["hepatic"].lower():
        monitoring["hepatic"].append("Monitorar TGO/TGP (Transaminases)")
        monitoring["hepatic"].append("Dosagem de Bilirrubinas")
    if "hepatotoxicidade" in drug2_impact["hepatic"].lower() or "hepat" in drug2_impact["hepatic"].lower():
        if "Monitorar TGO/TGP (Transaminases)" not in monitoring["hepatic"]:
            monitoring["hepatic"].append("Monitorar TGO/TGP (Transaminases)")
            monitoring["hepatic"].append("Dosagem de Bilirrubinas")
    
    # Known dangerous interactions
    if (("varfarina" in d1 or "warfarin" in d1) and ("aine" in d2 or "aspirina" in d2 or "ibuprofeno" in d2)) or \
       (("varfarina" in d2 or "warfarin" in d2) and ("aine" in d1 or "aspirina" in d1 or "ibuprofeno" in d1)):
        monitoring["outros"].append("INR (RNI) semanal ou conforme ajuste")
        monitoring["outros"].append("Hemograma (avaliar sangramento)")
        return InteractionResult(
            severity="GRAVE",
            summary="Interação significativa entre anticoagulante e AINE.",
            details="Varfarina + AINEs aumentam MUITO o risco de sangramento. Os AINEs inibem agregação plaquetária e podem causar lesão gástrica, potencializando o efeito anticoagulante.",
            recommendations="EVITAR combinação. Se necessário analgesia, preferir Paracetamol. Monitorar INR rigorosamente se uso inevitável.",
            renal_impact=f"**{drug1}:** {drug1_impact['renal']}\n**{drug2}:** {drug2_impact['renal']}",
            hepatic_impact=f"**{drug1}:** {drug1_impact['hepatic']}\n**{drug2}:** {drug2_impact['hepatic']}",
            monitoring=monitoring
        )
    
    if (("digoxina" in d1) and ("amiodarona" in d2 or "verapamil" in d2)) or \
       (("digoxina" in d2) and ("amiodarona" in d1 or "verapamil" in d1)):
        monitoring["outros"].append("Digoxinemia (níveis séricos)")
        monitoring["outros"].append("ECG (avaliar ritmo e condução)")
        return InteractionResult(
            severity="GRAVE",
            summary="Risco de intoxicação digitálica.",
            details="Amiodarona e Verapamil reduzem clearance da Digoxina, elevando níveis séricos. Risco de bradicardia, bloqueio AV e arritmias.",
            recommendations="Reduzir dose de Digoxina em 50% ao iniciar Amiodarona. Monitorar níveis séricos e ECG.",
            renal_impact=f"**{drug1}:** {drug1_impact['renal']}\n**{drug2}:** {drug2_impact['renal']}",
            hepatic_impact=f"**{drug1}:** {drug1_impact['hepatic']}\n**{drug2}:** {drug2_impact['hepatic']}",
            monitoring=monitoring
        )
    
    if (("isrs" in d1 or "fluoxetina" in d1 or "sertralina" in d1) and ("tramadol" in d2 or "opioide" in d2)) or \
       (("isrs" in d2 or "fluoxetina" in d2 or "sertralina" in d2) and ("tramadol" in d1 or "opioide" in d1)):
        return InteractionResult(
            severity="MODERADA a GRAVE",
            summary="Risco de Síndrome Serotoninérgica.",
            details="ISRS + Tramadol/Opioides aumentam serotonina no SNC. Sintomas: agitação, hipertermia, rigidez, tremor, hiperreflexia.",
            recommendations="Monitorar sinais de síndrome serotoninérgica. Preferir analgésicos não-opioides. Suspender drogas e suporte se sintomas."
        )
    
    if (("metformina" in d1) and ("contraste iodado" in d2)) or \
       (("metformina" in d2) and ("contraste iodado" in d1)):
        return InteractionResult(
            severity="MODERADA",
            summary="Risco de acidose láctica.",
            details="Contraste iodado pode causar nefropatia, reduzindo eliminação de Metformina e precipitando acidose láctica.",
            recommendations="Suspender Metformina 48h ANTES do exame. Reavaliar função renal. Retornar após 48-72h se função renal normal."
        )
    
    if (("iecas" in d1 or "enalapril" in d1 or "captopril" in d1) and ("espironolactona" in d2 or "amilorida" in d2)) or \
       (("iecas" in d2 or "enalapril" in d2 or "captopril" in d2) and ("espironolactona" in d1 or "amilorida" in d1)):
        return InteractionResult(
            severity="MODERADA",
            summary="Risco de hipercalemia.",
            details="IECAs + Diuréticos poupadores de potássio aumentam retenção de K+. Risco de arritmias cardíacas.",
            recommendations="Monitorar K+ sérico regularmente. Evitar suplementação de potássio. Considerar diurético tiazídico como alternativa."
        )
    
    # No known interaction
    return InteractionResult(
        severity="BAIXA ou DESCONHECIDA",
        summary="Não há interação grave conhecida entre esses medicamentos na literatura comum.",
        details="Isso não exclui interações raras ou farmacocinéticas sutis. Sempre consultar bula e bases especializadas (Micromedex, UpToDate).",
        recommendations="Monitoramento clínico de rotina. Relatar ao médico qualquer efeito adverso novo após início da combinação."
    )


def analyze_toxicology(substance: str) -> ToxicologyResult:
    """Get toxicology protocol - already implemented correctly in frontend, keeping here for completeness"""
    text = normalize_text(substance)
    
    # Stimulants
    if any(kw in text for kw in ["cocaina", "crack", "metanfetamina", "anfetamina", "ecstasy", "mdma"]):
        return ToxicologyResult(
            agent="Estimulantes (Cocaína/Anfetaminas)",
            antidote="Benzodiazepínicos (Sintomático)",
            mechanism="Bloqueio da recaptação de catecolaminas (Dopamina/Noradrenalina). Hiperestimulação simpática.",
            conduct=[
                "Monitorização cardíaca contínua (risco de arritmias/infarto).",
                "Controle da agitação/convulsões com Benzodiazepínicos (Diazepam/Midazolam).",
                "Resfriamento agressivo se hipertermia (>39°C).",
                "NÃO usar Beta-bloqueadores puros (risco de 'efeito alfa sem oposição')."
            ],
            protocol="Diazepam: 10mg IV a cada 5-10 min até sedação leve. \nNitroglicerina: Se dor torácica isquêmica. \nBicarbonato de Sódio: Se rabdomiólise/acidose."
        )
    
    # Paracetamol
    elif any(kw in text for kw in ["paracetamol", "tylenol", "acetaminofeno"]):
        return ToxicologyResult(
            agent="Paracetamol (Acetaminofeno)",
            antidote="N-Acetilcisteína (NAC)",
            mechanism="Hepatotoxicidade por metabólito NAPQI. Depleção de glutationa hepática.",
            conduct=[
                "Dosagem sérica de paracetamol (Nomograma de Rumack-Matthew) se ingestão > 4h.",
                "Lavagem gástrica se ingestão < 1h.",
                "Carvão ativado (1g/kg) se ingestão < 4h.",
                "Iniciar NAC imediatamente se ingestão tóxica provável (>7.5g em adultos ou 150mg/kg em crianças)."
            ],
            protocol="NAC Oral: Ataque 140mg/kg + 17 doses de 70mg/kg a cada 4h. \nNAC Venosa: Ataque 150mg/kg em 1h + 50mg/kg em 4h + 100mg/kg em 16h."
        )
    
    # Opioids
    elif any(kw in text for kw in ["opioide", "morfina", "fentanil", "tramadol", "codeina", "heroina", "metadona"]):
        return ToxicologyResult(
            agent="Opioide",
            antidote="Naloxona",
            mechanism="Depressão do SNC e respiratória por agonismo de receptores mi/kappa.",
            conduct=[
                "Garantir via aérea (ABCDE).",
                "Ventilação assistida se bradipneia/apneia.",
                "Administrar antídoto se depressão respiratória significativa (FR < 10)."
            ],
            protocol="Naloxona: 0.4mg a 2mg IV/IM/SC. Repetir a cada 2-3 min se necessário (até 10mg). \nObservar por 2h após última dose (risco de renarcotização, especialmente com Metadona/Tramadol)."
        )
    
    # Benzodiazepines
    elif any(kw in text for kw in ["benzo", "diazepam", "clonazepam", "alprazolam", "rivotril", "midazolam", "lexotan"]):
        return ToxicologyResult(
            agent="Benzodiazepínico",
            antidote="Flumazenil (Lanexat)",
            mechanism="Potencialização do GABA. Sedação, ataxia, depressão respiratória leve.",
            conduct=[
                "Suporte ventilatório e monitorização.",
                "Carvão ativado se ingestão < 1h e via aérea protegida.",
                "Uso de antídoto APENAS em casos selecionados (risco de convulsão em usuários crônicos)."
            ],
            protocol="Flumazenil: 0.2mg IV em 15s. Repetir 0.1mg a cada 60s até 1mg total. \nCONTRAINDICADO se suspeita de ingestão de tricíclicos ou história de epilepsia."
        )
    
    # Tricyclic Antidepressants
    elif any(kw in text for kw in ["amitriptilina", "nortriptilina", "clomipramina", "triciclico"]):
        return ToxicologyResult(
            agent="Antidepressivo Tricíclico",
            antidote="Bicarbonato de Sódio",
            mechanism="Bloqueio de canais de Sódio cardíacos (efeito quinidina-like). Arritmias graves.",
            conduct=[
                "ECG imediato (QRS > 100ms indica risco de convulsão/arritmia).",
                "Carvão ativado se ingestão < 2h.",
                "Alcalinização sérica se QRS alargado ou hipotensão."
            ],
            protocol="Bicarbonato de Sódio 8.4%: 1-2 mEq/kg em bolus IV. Repetir até pH 7.45-7.55. \nTratar convulsões com Benzodiazepínicos. Evitar Flumazenil."
        )
    
    # NSAIDs / Dipyrone
    elif any(kw in text for kw in ["dipirona", "ibuprofeno", "diclofenaco", "nimesulida", "aine"]):
        return ToxicologyResult(
            agent="AINEs / Dipirona",
            antidote="Suporte / Sintomático",
            mechanism="Inibição da COX (AINEs). Dipirona: mecanismo incerto, risco de hipotensão/choque em altas doses.",
            conduct=[
                "Carvão ativado se ingestão < 1-2h.",
                "Proteção gástrica (IBP) para AINEs.",
                "Hidratação venosa para prevenir insuficiência renal.",
                "Monitorar função renal e coagulograma."
            ],
            protocol="Não há antídoto específico. \nSe hipotensão por Dipirona: Expansão volêmica + Vasopressores se refratário. \nSe sangramento digestivo: Endoscopia."
        )
    
    # Organophosphates
    elif any(kw in text for kw in ["chumbinho", "veneno", "agrotoxico", "organofosforado", "carbamato"]):
        return ToxicologyResult(
            agent="Inibidor da Colinesterase (Organofosforado/Carbamato)",
            antidote="Atropina + Pralidoxima",
            mechanism="Síndrome Colinérgica (Muscarínica + Nicotínica). Miose, sialorreia, bradicardia, fasciculações.",
            conduct=[
                "Descontaminação cutânea imediata (remover roupas, lavar com água e sabão).",
                "Oxigenoterapia (risco de broncorreia).",
                "Atropinização precoce."
            ],
            protocol="Atropina: 1-5mg IV a cada 5-10 min até secar secreções (pulmão limpo). \nPralidoxima: 1-2g IV em 30 min (para organofosforados, idealmente < 48h)."
        )
    
    # Caustics
    elif any(kw in text for kw in ["soda", "caustica", "agua sanitaria", "cloro", "acido", "base"]):
        return ToxicologyResult(
            agent="Cáusticos (Ácidos/Bases)",
            antidote="Contraindicado neutralizar",
            mechanism="Necrose de liquefação (álcalis) ou coagulação (ácidos). Perfuração esofágica/gástrica.",
            conduct=[
                "NÃO provocar vômito (risco de nova queimadura).",
                "NÃO passar sonda nasogástrica às cegas.",
                "NÃO dar carvão ativado (não adsorve e atrapalha endoscopia).",
                "Jejum absoluto."
            ],
            protocol="Endoscopia Digestiva Alta nas primeiras 12-24h para estadiamento da lesão. \nAnalgesia potente. Avaliação cirúrgica se sinais de perfuração."
        )
    
    # Carbon Monoxide
    elif any(kw in text for kw in ["monoxido", "fumaca", "incendio", "gas"]):
        return ToxicologyResult(
            agent="Monóxido de Carbono (CO)",
            antidote="Oxigênio 100% (Normobárico ou Hiperbárico)",
            mechanism="Formação de Carboxiemoglobina (HbCO), deslocando O2 e inibindo respiração celular.",
            conduct=[
                "Remover da fonte de exposição.",
                "Máscara não-reinalante com reservatório (15L/min).",
                "Avaliar necessidade de Câmara Hiperbárica (gestantes, síncope, isquemia cardíaca, HbCO > 25%)."
            ],
            protocol="Manter O2 a 100% até HbCO < 5% (ou assintomático). Meia-vida do CO cai de 320min (ar ambiente) para 80min (O2 100%)."
        )
    
    # Alcohol
    elif any(kw in text for kw in ["alcool", "etanol", "bebida", "embriaguez"]):
        return ToxicologyResult(
            agent="Etanol (Intoxicação Aguda)",
            antidote="Suporte (Glicose + Tiamina)",
            mechanism="Depressão do SNC. Risco de hipoglicemia e broncoaspiração.",
            conduct=[
                "Decúbito lateral (prevenir aspiração).",
                "Glicemia capilar (HGT) imediata.",
                "Hidratação venosa."
            ],
            protocol="Glicose 50% se hipoglicemia. \nTiamina (Vit B1) 100mg IM/IV ANTES da glicose (prevenir Encefalopatia de Wernicke em etilistas crônicos)."
        )
    
    # Default
    else:
        return ToxicologyResult(
            agent="Agente Desconhecido / Outros",
            antidote="Suporte Clínico (ABCDE)",
            mechanism="Mecanismo a esclarecer. Priorizar estabilização.",
            conduct=[
                "A: Vias aéreas (proteger se Glasgow < 8).",
                "B: Ventilação (O2 suplementar).",
                "C: Circulação (Acesso venoso, monitorização, volume).",
                "D: Neurológico (Glicemia, pupilas).",
                "E: Exposição (controle de temperatura)."
            ],
            protocol="Considerar descontaminação (Carvão Ativado 1g/kg) se ingestão < 1h. \nContatar Centro de Informação Toxicológica (CEATOX: 0800 722 6001)."
        )
