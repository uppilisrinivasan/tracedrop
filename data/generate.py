#!/usr/bin/env python3
"""
Synthetic Data Generator for TraceDrop Phase 1

Generates FHIR-compliant synthetic donor, donation, observation, lab, and finding data
for the blood donation platform.

Configuration:
- Seed: 42 (reproducible)
- Output: 300 donors, 900 donations, 2700 observations
- Format: FHIR-compliant JSON with JSONL bundles

Protocol Rules: From docs/03-build/protocol-rules.md
- BP grading (G1, G2, urgency, emergency)
- Hb deferrals and severity
- Diabetes screening (prediabetes, diabetes)
- TTI counselling flags
"""

import json
import random
import argparse
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any
import uuid


class SyntheticDataGenerator:
    """Generate synthetic medical data for blood donors."""

    # Protocol thresholds from docs/03-build/protocol-rules.md
    BP_THRESHOLDS = {
        "normal": (120, 80),
        "elevated": (140, 90),
        "grade1": (160, 100),
        "grade2": (180, 120),
    }

    HB_THRESHOLDS = {
        "donor_min": 12.5,
        "severe_min": 8.0,
    }

    DM_THRESHOLDS = {
        "hba1c_prediabetes_min": 5.7,
        "hba1c_prediabetes_max": 6.4,
        "hba1c_diabetes_min": 6.5,
        "fpg_prediabetes_min": 100,
        "fpg_prediabetes_max": 125,
        "fpg_diabetes_min": 126,
    }

    def __init__(self, seed: int = 42, output_dir: str = "data/synthetic"):
        """Initialize generator with seed and output directory."""
        random.seed(seed)
        self.seed = seed
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Bengaluru language distribution (15% F, 85% M)
        self.languages = ["Kannada", "Hindi", "English", "Tamil", "Telugu"]
        self.language_distribution = [0.35, 0.30, 0.25, 0.05, 0.05]

        self.blood_centres = ["Centre-1", "Centre-2", "Centre-3"]

        # Personas with specific patterns
        self.personas = {
            "D-001": {
                "name": "Arjun",
                "gender": "M",
                "age": 35,
                "language": "Kannada",
                "bp_trend": "rising",  # 128 -> 148, deferred
            },
            "D-002": {
                "name": "Meera",
                "gender": "F",
                "age": 28,
                "language": "Tamil",
                "hb_low": 11.8,  # deferred
            },
            "D-017": {
                "name": "Urgent Case",
                "gender": "M",
                "age": 42,
                "language": "Kannada",
                "bp_emergency": True,  # 184/118
            },
            "D-033": {
                "name": "Reactive Flag",
                "gender": "M",
                "age": 30,
                "language": "Hindi",
                "tti_reactive": True,  # counselling required
            },
            "D-050": {
                "name": "Informational",
                "gender": "M",
                "age": 38,
                "language": "English",
                "bp_rising_trend": True,  # trending up, passed
            },
        }

        self.donors = []
        self.donations = []
        self.observations = []
        self.lab_reports = []
        self.findings = []

    def generate_donors(self, count: int = 300) -> List[Dict]:
        """Generate donor profiles."""
        print(f"Generating {count} donors...")
        for i in range(1, count + 1):
            donor_id = f"D-{i:03d}"

            # Check if this is a persona
            if donor_id in self.personas:
                persona = self.personas[donor_id]
                gender = persona["gender"]
                age = persona["age"]
                language = persona["language"]
            else:
                # Random gender (85% M, 15% F)
                gender = "M" if random.random() < 0.85 else "F"
                # Concentrated 22-40, typical donors
                age = max(18, min(60, int(random.gauss(32, 6))))
                # Language distribution for Bengaluru
                language = random.choices(self.languages, weights=self.language_distribution)[0]

            donor = {
                "resourceType": "Patient",
                "id": donor_id,
                "identifier": [{"system": "TraceDrop", "value": donor_id}],
                "name": [{"text": self.personas.get(donor_id, {}).get("name", f"Donor {i}")}],
                "gender": gender.lower(),
                "birthDate": (datetime.now() - timedelta(days=age * 365.25)).strftime("%Y-%m-%d"),
                "telecom": [{"system": "phone", "value": f"+91-{random.randint(6000000000, 9999999999)}"}],
                "address": [{"city": "Bengaluru", "state": "KA", "country": "IN"}],
                "language": {"coding": [{"code": language, "system": "urn:ietf:bcp:47"}]},
                "contact": [{"relationship": [{"coding": [{"code": "FAMMEMB"}]}]}],
            }
            self.donors.append(donor)

        return self.donors

    def generate_donations(self, donors_count: int = 300) -> List[Dict]:
        """Generate donation events (3 per donor, spread over 3 years)."""
        print(f"Generating {donors_count * 3} donations...")
        base_date = datetime.now() - timedelta(days=1095)  # 3 years ago

        for i in range(1, donors_count + 1):
            donor_id = f"D-{i:03d}"
            for donation_num in range(1, 4):
                donation_id = f"{donor_id}-DON-{donation_num}"

                # Spread donations across 3 years
                donation_date = base_date + timedelta(days=random.randint(0, 1095))

                # ~15% deferrals
                is_deferred = random.random() < 0.15 or (donor_id in self.personas and "deferred" in str(self.personas[donor_id]))

                donation = {
                    "resourceType": "Procedure",
                    "id": donation_id,
                    "identifier": [{"system": "TraceDrop", "value": donation_id}],
                    "status": "completed" if not is_deferred else "stopped",
                    "code": {
                        "coding": [{"system": "SNOMED-CT", "code": "81281000205102", "display": "Blood donation"}]
                    },
                    "subject": {"reference": f"Patient/{donor_id}"},
                    "performedDateTime": donation_date.isoformat() + "Z",
                    "location": {"display": random.choice(self.blood_centres)},
                    "reasonCode": [
                        {
                            "coding": [
                                {
                                    "system": "SNOMED-CT",
                                    "code": "P0001" if not is_deferred else "D0001",
                                    "display": "Routine donation" if not is_deferred else "Deferred",
                                }
                            ]
                        }
                    ],
                }
                self.donations.append(donation)

        return self.donations

    def generate_observations(self, donors_count: int = 300) -> List[Dict]:
        """Generate vital observations (3 per donation = 9 per donor = 2700 total)."""
        print(f"Generating {donors_count * 9} observations...")
        observation_counter = 0

        for i in range(1, donors_count + 1):
            donor_id = f"D-{i:03d}"
            donor = next((d for d in self.donors if d["id"] == donor_id), {})
            gender = donor.get("gender", "male")

            # Generate BP history for trend analysis
            bp_history = []

            for donation_num in range(1, 4):
                donation_id = f"{donor_id}-DON-{donation_num}"
                donation_date = next(
                    (d["performedDateTime"] for d in self.donations if d["id"] == donation_id), ""
                )

                # Persona-specific patterns
                if donor_id == "D-001":  # Arjun: BP trending 128->148
                    bp_values = [128, 134, 148]
                    sbp, dbp = bp_values[donation_num - 1], 70 + donation_num * 2
                elif donor_id == "D-017":  # Urgent: 184/118
                    sbp, dbp = 184, 118
                elif donor_id == "D-050":  # Rising trend but passed
                    bp_values = [128, 135, 138]
                    sbp, dbp = bp_values[donation_num - 1], 75 + donation_num * 1.5
                else:
                    # Normal distribution: typically 120-140 systolic
                    sbp = max(95, min(180, int(random.gauss(128, 12))))
                    dbp = max(60, min(120, int(random.gauss(78, 8))))

                bp_history.append({"sbp": sbp, "dbp": dbp, "date": donation_date})

                # BP Observation
                bp_obs = {
                    "resourceType": "Observation",
                    "id": f"OBS-BP-{donation_id}",
                    "status": "final",
                    "code": {
                        "coding": [
                            {
                                "system": "LOINC",
                                "code": "85354-9",
                                "display": "Blood pressure systolic and diastolic",
                            }
                        ]
                    },
                    "subject": {"reference": f"Patient/{donor_id}"},
                    "effectiveDateTime": donation_date,
                    "component": [
                        {
                            "code": {"coding": [{"system": "LOINC", "code": "8480-6", "display": "Systolic BP"}]},
                            "valueQuantity": {"value": sbp, "unit": "mm[Hg]"},
                        },
                        {
                            "code": {"coding": [{"system": "LOINC", "code": "8462-4", "display": "Diastolic BP"}]},
                            "valueQuantity": {"value": dbp, "unit": "mm[Hg]"},
                        },
                    ],
                }
                self.observations.append(bp_obs)
                observation_counter += 1

                # Hb Observation (gender-specific distributions)
                if donor_id == "D-002":  # Meera: 11.8
                    hb_value = 11.8
                else:
                    if gender == "female":
                        hb_value = max(8.0, min(15.0, random.gauss(13.0, 0.8)))
                    else:
                        hb_value = max(8.5, min(17.0, random.gauss(14.0, 0.9)))

                hb_obs = {
                    "resourceType": "Observation",
                    "id": f"OBS-HB-{donation_id}",
                    "status": "final",
                    "code": {
                        "coding": [
                            {"system": "LOINC", "code": "718-7", "display": "Hemoglobin [Mass/volume] in Blood"}
                        ]
                    },
                    "subject": {"reference": f"Patient/{donor_id}"},
                    "effectiveDateTime": donation_date,
                    "valueQuantity": {"value": round(hb_value, 1), "unit": "g/dL"},
                }
                self.observations.append(hb_obs)
                observation_counter += 1

                # RBC Count Observation (synthetic)
                rbc_value = 4.5 + random.gauss(0, 0.5)
                rbc_obs = {
                    "resourceType": "Observation",
                    "id": f"OBS-RBC-{donation_id}",
                    "status": "final",
                    "code": {
                        "coding": [{"system": "LOINC", "code": "789-8", "display": "Red blood cell count"}]
                    },
                    "subject": {"reference": f"Patient/{donor_id}"},
                    "effectiveDateTime": donation_date,
                    "valueQuantity": {"value": round(rbc_value, 2), "unit": "10*6/uL"},
                }
                self.observations.append(rbc_obs)
                observation_counter += 1

            # Generate findings based on observations
            self._generate_findings_for_donor(donor_id, bp_history)

        return self.observations

    def _generate_findings_for_donor(self, donor_id: str, bp_history: List[Dict]) -> None:
        """Generate findings based on protocol rules."""
        # Extract latest reading for current donation
        if not bp_history:
            return

        latest_reading = bp_history[-1]
        sbp, dbp = latest_reading["sbp"], latest_reading["dbp"]

        donor_data = next((d for d in self.donors if d["id"] == donor_id), {})
        gender = donor_data.get("gender", "male")

        # Persona-specific findings
        if donor_id == "D-017":  # Urgent case: RF-BP-2
            self.findings.append({
                "id": f"FIND-{donor_id}-BP-URGENCY",
                "donor_id": donor_id,
                "type": "BP_URGENCY",
                "urgency": "Same day",
                "description": "Blood pressure reading of 184/118 detected",
                "protocol_rule": "RF-BP-2",
            })

        elif donor_id == "D-002":  # Meera: HB-DEF
            self.findings.append({
                "id": f"FIND-{donor_id}-HB-DEF",
                "donor_id": donor_id,
                "type": "HB_BELOW_DONOR",
                "urgency": "Within 2-4 weeks",
                "description": "Hemoglobin below donor threshold (11.8 g/dL < 12.5 g/dL)",
                "protocol_rule": "HB-DEF",
            })

        elif donor_id == "D-001":  # Arjun: BP-G1 with trend
            self.findings.append({
                "id": f"FIND-{donor_id}-BP-G1",
                "donor_id": donor_id,
                "type": "BP_GRADE1",
                "urgency": "Within 2-4 weeks",
                "description": "Blood pressure Grade 1: Systolic 140-159 or Diastolic 90-99",
                "protocol_rule": "BP-G1",
            })

        elif donor_id == "D-033":  # Reactive flag: TTI-FLAG
            self.findings.append({
                "id": f"FIND-{donor_id}-TTI-FLAG",
                "donor_id": donor_id,
                "type": "COUNSELLING_REQUIRED",
                "urgency": "Within 1 week",
                "description": "Counselling required",
                "protocol_rule": "TTI-FLAG",
            })

        elif donor_id == "D-050":  # Rising trend but passed: BP-TREND
            if len(bp_history) >= 3:
                self.findings.append({
                    "id": f"FIND-{donor_id}-BP-TREND",
                    "donor_id": donor_id,
                    "type": "BP_RISING",
                    "urgency": "Routine",
                    "description": "Rising blood pressure trend detected (3+ readings)",
                    "protocol_rule": "BP-TREND",
                })

        # Generic protocol-based findings
        if sbp >= 180 or dbp >= 120:
            self.findings.append({
                "id": f"FIND-{donor_id}-BP-HYPER",
                "donor_id": donor_id,
                "type": "BP_URGENCY",
                "urgency": "Same day",
                "description": f"Hypertensive urgency: {sbp}/{dbp}",
                "protocol_rule": "RF-BP-2",
            })

        if 160 <= sbp < 180 or 100 <= dbp < 120:
            self.findings.append({
                "id": f"FIND-{donor_id}-BP-G2",
                "donor_id": donor_id,
                "type": "BP_GRADE2",
                "urgency": "Within 1 week",
                "description": f"Blood pressure Grade 2: {sbp}/{dbp}",
                "protocol_rule": "BP-G2",
            })

    def generate_lab_reports(self, count: int = 20) -> List[Dict]:
        """Generate synthetic lab reports with different formats."""
        print(f"Generating {count} lab reports...")

        lab_report_formats = [
            {"name": "CBC", "tests": ["Hb", "WBC", "Platelets"]},
            {"name": "HbA1c Profile", "tests": ["HbA1c", "FPG"]},
            {"name": "Lipid Profile", "tests": ["Total Cholesterol", "HDL", "LDL", "Triglycerides"]},
            {"name": "Thyroid Screen", "tests": ["TSH", "T3", "T4"]},
            {"name": "Liver Function", "tests": ["ALT", "AST", "Bilirubin"]},
            {"name": "Renal Function", "tests": ["Creatinine", "BUN"]},
        ]

        reference_ranges = {
            "Hb": {"M": "13.5-17.5 g/dL", "F": "12.0-15.5 g/dL"},
            "WBC": "4.5-11.0 K/uL",
            "Platelets": "150-400 K/uL",
            "HbA1c": "<5.7%",
            "FPG": "70-100 mg/dL",
            "Total Cholesterol": "<200 mg/dL",
            "HDL": ">40 mg/dL",
            "LDL": "<100 mg/dL",
            "Triglycerides": "<150 mg/dL",
            "TSH": "0.4-4.0 mIU/L",
            "T3": "80-200 ng/dL",
            "T4": "4.5-12.0 µg/dL",
            "ALT": "7-56 U/L",
            "AST": "10-40 U/L",
            "Bilirubin": "0.1-1.2 mg/dL",
            "Creatinine": "0.7-1.3 mg/dL",
            "BUN": "7-20 mg/dL",
        }

        for i in range(count):
            report_format = random.choice(lab_report_formats)
            report_id = f"LAB-{i+1:03d}"
            report_date = datetime.now() - timedelta(days=random.randint(1, 180))

            tests_data = []
            for test in report_format["tests"]:
                tests_data.append({
                    "name": test,
                    "value": round(random.gauss(100, 15), 1),
                    "unit": "varies",
                    "reference_range": reference_ranges.get(test, "N/A"),
                    "status": "Normal" if random.random() > 0.1 else "Abnormal",
                })

            lab_report = {
                "id": report_id,
                "format": report_format["name"],
                "issued": report_date.isoformat(),
                "tests": tests_data,
            }
            self.lab_reports.append(lab_report)

        return self.lab_reports

    def generate_fhir_bundles(self) -> None:
        """Generate FHIR bundles (1 per donor) and save to JSONL."""
        print(f"Generating FHIR bundles for {len(self.donors)} donors...")
        bundle_path = self.output_dir / "fhir-bundles.jsonl"

        with open(bundle_path, "w") as f:
            for donor in self.donors:
                donor_id = donor["id"]

                # Get all related data for this donor
                donor_donations = [d for d in self.donations if donor_id in d.get("subject", {}).get("reference", "")]
                donor_observations = [o for o in self.observations if donor_id in o.get("subject", {}).get("reference", "")]
                donor_findings = [f for f in self.findings if f.get("donor_id") == donor_id]

                # Create FHIR bundle
                bundle = {
                    "resourceType": "Bundle",
                    "type": "collection",
                    "id": f"bundle-{donor_id}",
                    "timestamp": datetime.now().isoformat(),
                    "total": 1 + len(donor_donations) + len(donor_observations) + len(donor_findings),
                    "entry": [
                        {
                            "resource": donor,
                            "fullUrl": f"urn:uuid:{uuid.uuid4()}",
                        }
                    ],
                }

                # Add donations to bundle
                for donation in donor_donations:
                    bundle["entry"].append({
                        "resource": donation,
                        "fullUrl": f"urn:uuid:{uuid.uuid4()}",
                    })

                # Add observations to bundle
                for observation in donor_observations:
                    bundle["entry"].append({
                        "resource": observation,
                        "fullUrl": f"urn:uuid:{uuid.uuid4()}",
                    })

                # Add findings to bundle
                for finding in donor_findings:
                    bundle["entry"].append({
                        "resource": {
                            "resourceType": "Observation",
                            "id": finding["id"],
                            "status": "final",
                            "code": {"coding": [{"code": finding["type"], "system": "TraceDrop"}]},
                            "subject": {"reference": f"Patient/{donor_id}"},
                            "value": {"string": finding["description"]},
                        },
                        "fullUrl": f"urn:uuid:{uuid.uuid4()}",
                    })

                # Write bundle as JSONL (one per line)
                f.write(json.dumps(bundle, separators=(",", ":")) + "\n")

        print(f"FHIR bundles saved to {bundle_path}")

    def save_json_files(self) -> None:
        """Save individual JSON files."""
        print("Saving JSON files...")

        # Save donors
        donors_path = self.output_dir / "donors.json"
        with open(donors_path, "w") as f:
            json.dump(self.donors, f, indent=2)
        print(f"Donors saved to {donors_path}")

        # Save donations
        donations_path = self.output_dir / "donations.json"
        with open(donations_path, "w") as f:
            json.dump(self.donations, f, indent=2)
        print(f"Donations saved to {donations_path}")

        # Save observations
        observations_path = self.output_dir / "observations.json"
        with open(observations_path, "w") as f:
            json.dump(self.observations, f, indent=2)
        print(f"Observations saved to {observations_path}")

        # Save lab reports
        lab_reports_path = self.output_dir / "lab_reports.json"
        with open(lab_reports_path, "w") as f:
            json.dump(self.lab_reports, f, indent=2)
        print(f"Lab reports saved to {lab_reports_path}")

        # Save findings
        findings_path = self.output_dir / "findings.json"
        with open(findings_path, "w") as f:
            json.dump(self.findings, f, indent=2)
        print(f"Findings saved to {findings_path}")

    def generate_ground_truth(self) -> None:
        """Generate ground truth data for accuracy testing."""
        print("Generating ground truth data...")

        ground_truth = {
            "metadata": {
                "seed": self.seed,
                "generated_at": datetime.now().isoformat(),
                "total_donors": len(self.donors),
                "total_donations": len(self.donations),
                "total_observations": len(self.observations),
                "total_findings": len(self.findings),
                "total_lab_reports": len(self.lab_reports),
            },
            "personas": self.personas,
            "expected_patterns": {
                "D-001": {"pattern": "BP trending up", "expected_finding": "BP_GRADE1"},
                "D-002": {"pattern": "Low Hb female", "expected_finding": "HB_BELOW_DONOR"},
                "D-017": {"pattern": "BP urgent", "expected_finding": "BP_URGENCY"},
                "D-033": {"pattern": "TTI reactive", "expected_finding": "COUNSELLING_REQUIRED"},
                "D-050": {"pattern": "BP rising but passed", "expected_finding": "BP_RISING"},
            },
            "statistics": {
                "female_donors": sum(1 for d in self.donors if d["gender"] == "female"),
                "male_donors": sum(1 for d in self.donors if d["gender"] == "male"),
                "deferred_donations": sum(1 for d in self.donations if d["status"] == "stopped"),
                "completed_donations": sum(1 for d in self.donations if d["status"] == "completed"),
                "findings_by_type": {},
            },
        }

        # Count findings by type
        for finding in self.findings:
            ftype = finding["type"]
            ground_truth["statistics"]["findings_by_type"][ftype] = (
                ground_truth["statistics"]["findings_by_type"].get(ftype, 0) + 1
            )

        ground_truth_path = self.output_dir / "ground-truth.json"
        with open(ground_truth_path, "w") as f:
            json.dump(ground_truth, f, indent=2)
        print(f"Ground truth saved to {ground_truth_path}")

    def run(self, donors: int = 300) -> None:
        """Run the complete generation pipeline."""
        print(f"\nTraceDrop Synthetic Data Generator (seed={self.seed})")
        print(f"Output directory: {self.output_dir}")
        print("=" * 60)

        start_time = datetime.now()

        # Generate data
        self.generate_donors(donors)
        self.generate_donations(donors)
        self.generate_observations(donors)
        self.generate_lab_reports()

        # Save outputs
        self.save_json_files()
        self.generate_fhir_bundles()
        self.generate_ground_truth()

        elapsed = (datetime.now() - start_time).total_seconds()
        print("=" * 60)
        print(f"Generation complete in {elapsed:.2f} seconds")
        print(f"\nGenerated data:")
        print(f"  - {len(self.donors)} donors")
        print(f"  - {len(self.donations)} donations")
        print(f"  - {len(self.observations)} observations")
        print(f"  - {len(self.lab_reports)} lab reports")
        print(f"  - {len(self.findings)} findings")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Generate synthetic medical data for TraceDrop Phase 1"
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--output", default="data/synthetic", help="Output directory")
    parser.add_argument("--donors", type=int, default=300, help="Number of donors to generate")

    args = parser.parse_args()

    generator = SyntheticDataGenerator(seed=args.seed, output_dir=args.output)
    generator.run(donors=args.donors)


if __name__ == "__main__":
    main()
