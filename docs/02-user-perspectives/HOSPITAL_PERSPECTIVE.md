# Hospital & AAM (Ayushman Arogya Mandir) Perspective

## Stakeholder Profile
Hospitals and Ayushman Arogya Mandirs (AAMs) are the primary caregiving facilities that receive referred donors flagged for follow-up care. They need to provide preventive care, manage chronic conditions, and track health outcomes for a population they may not have any prior relationship with.

## Primary Goals
1. **Ensure 80%+ appointment attendance** - Reduce no-show rates that currently plague outpatient programs
2. **Capture and act on health findings** - Transform isolated lab reports into coordinated care pathways
3. **Track health outcomes at scale** - Demonstrate program impact to stakeholders and improve population health

## Key Needs
- **Pre-screened, actionable patient lists** - Know who's coming, why they're coming, what was found
- **Confirmed appointments with reminders** - SMS/WhatsApp confirmation flow that increases compliance
- **Integrated patient history** - See donor's blood donation context, prior donations, patterns
- **Simple outcome recording** - How to document findings, treatments, referrals in workflow time
- **Compliance with HMIS/state reporting** - Export data in required format without manual work
- **No integration overhead** - Works with existing paper systems or minimal IT burden

## Concerns & Risks
- **No-shows waste resources** - Staff scheduled, supplies ready, capacity unused
- **Data quality issues** - Incomplete donor contact info, wrong phone numbers, no way to reach people
- **Integration burden** - Hospital IT already maxed out; can't absorb complex new system
- **Privacy & regulatory** - Must comply with HIPAA-equivalent (India's privacy norms), audit trails for ABHA integration
- **Liability for missed diagnoses** - If we refer someone but they don't follow up, is the hospital responsible?
- **Conflicting IT standards** - Donor's HMIS record vs. AAM's local system vs. state mandate

## Success Metrics
- **Appointment attendance rate ≥80%** (vs. typical 40-50% for outpatient programs)
- **Health findings documented within 48 hours of visit** (vs. weeks of delay)
- **Zero compliance gaps in HMIS reporting** - 100% of flagged donors logged in state system
- **Average time to outcome recording ≤ 10 minutes per visit** - Not a bottleneck
- **Repeat visit rate for follow-up** - Ability to schedule and track continuity of care
- **Referral completion rate ≥75%** - If referred to specialist, track whether they went

## What Kills It
- **Another IT system to log into** - Staff won't use it if it adds friction vs. paper
- **Delays in showing appointment list** - If list is stale or incomplete, staff loses confidence
- **No outcome tracking for referred cases** - Can't see if referral actually helped
- **Breaks during low connectivity** - Many AAMs have unreliable internet; system must work offline
- **Requires new staff training** - If it's not intuitive, adoption stalls
- **False/missing contact info leads to ghost patients** - Donors flagged but unreachable
- **Integration that breaks HMIS compliance** - If our data export doesn't match state format, we're liable

## Priority Features
1. **Appointment list with pre-filled donor context** - Show name, phone, why they're referred, prior H2S findings
2. **SMS/WhatsApp appointment confirmation** - Automated, with one-click rescheduling
3. **Simple visit form** - Checkbox for findings, simple outcome recording, referral tracking
4. **Offline-first visit capture** - Record findings on paper or offline app, sync when connected
5. **HMIS export at end-of-month** - One-click compliance reporting in state format
6. **Dashboard: Attendance, outcomes, referral completion** - Show hospital leadership the impact
7. **Bulk reschedule if no-show** - Auto-reschedule no-shows for specific slot with fresh SMS

## Integration Points
- **Receives patient list** from Blood Bank (donor ID, phone, name, care plan)
- **Links to HMIS** for state-level outcome reporting and compliance
- **Coordinates with Labs** for test results and interpretation
- **Reports outcomes to Government** for aggregation (anonymized)
- **Coordinates with Counsellors** if psychiatric/social support is needed
- **Works with Insurers** if eligible for coverage/pooling

## Nice-to-Have Features
- **Multi-language interface** - Hindi, regional languages to match AAM staff
- **Photo of donor** - Helps staff match person to record during busy clinic
- **Clinical decision support** - "For H2S case with X finding, consider Y care pathway"
- **Integration with hospital pharmacy/billing** - Auto-log visit, capture costs for reimbursement
- **Bulk messaging for preventive campaigns** - "If you were screened >6 months ago, get retested"
- **Staff performance dashboard** - Track individual staff's documentation quality, attendance rates

## Collaboration with Others
- **Works with Blood Bank** - Receives referral list, sends back visit confirmations and no-shows
- **Works with Counsellors** - Refers complex cases (psychiatric disclosure, social determinants) for counselling
- **Coordinated with Labs** - Shares result context with lab when ordering follow-up testing
- **Reported to Government** - Sends anonymized outcome data to state health ministry for HMIS
- **Coordinates with Insurers** - May eventually enable claims processing or group insurance pooling
- **Escalates to Specialists** - Refers complex cases (cardiologist for H2S with high BP, infectious disease for H2S with comorbidity)
