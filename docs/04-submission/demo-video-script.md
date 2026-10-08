# Demo video script (under 3:00)

**Rule from the selection guide:** the first minute must show the AI doing real work. Judges see the video first, then open the live link.

**Format:** screen recording of the deployed prototype, picture-in-picture phone mock-ups for WhatsApp, voice-over in English. The donor's messages appear in Hindi with English subtitles. Upload as **public** (YouTube unlisted is not enough if the portal requires public; confirm on the portal).

| Time | On screen | Voice-over |
|---|---|---|
| **0:00–0:08** | Office blood camp (stock photo or simple animation). Nurse's form: "BP 148/94 · Deferred." Arjun walks out. | "Arjun, 34, is turned away at his office blood camp: 'BP 148/94, come back later.'" |
| **0:08–0:15** | The blood centre's register: three past rows highlight 128/82, 134/86, 138/88. | "The blood centre had measured his BP at his last three donations. It rose every time, and nobody connected the readings. He has no symptoms. His father had a stroke at 58." |
| **0:15–0:30** | Phone: WhatsApp message arrives in Hindi (subtitled) with a small trend chart. Arjun taps "What should I do?" | "That evening, TraceDrop messages him in Hindi with his own trend, and explains why high BP with no symptoms still matters." |
| **0:30–0:45** | Arjun photographs last year's company check-up. Split screen: the photo on the left, extracted fields with confidence on the right (HbA1c 6.1%, flagged "prediabetes range, ICMR"). One low-confidence field is asked back. | "He sends a photo of an old check-up. Gemini reads it, from any lab and in any format, into one health record. If it isn't sure of a value, it asks." |
| **0:45–1:00** | Doctor console: plan card with trend, report extract, cited ICMR rule. Dr Rao clicks **Approve** (15 s timer visible). | "Nothing is booked until the blood centre's doctor approves. She sees the evidence and the protocol, and approves in seconds." |
| **1:00–1:12** | Phone: "Booked: free BP & sugar check, Ayushman Arogya Mandir, Saturday 10 am" plus a map. Simulated clock jumps 3 days: reminder; then "How did it go?" | "TraceDrop books free care that already exists, near his home, and follows up until the visit happens." |
| **1:12–1:22** | Timeline: 3 months → "Cleared by doctor" → "Welcome back. You can donate from 14 Feb." → donation logged. | "Three months later he's under care, cleared, and back to donating." |
| **1:22–1:40** | Title card: "Not one donor: the system." Animated funnel: notified 71% → counselled 33% → hepatitis B reached care 28% → hepatitis C contacted 15%. "0 of 235 letters answered." | "Across India, blood donation finds disease in healthy adults, then loses them. Only a third of donors with a reactive screen reach counselling. In Kolkata, only 15% of hepatitis C donors were contacted, though treatment is free." |
| **1:40–1:58** | Counsellor console: "14 donors need a confidential conversation. 11 reached and booked. **3 left to call.**" Hover shows the agent's message ("a confidential conversation about your donation"), never the result. | "For the counsellor, the agent does the reaching, booking and chasing. Results are never in its messages; the counsellor delivers every one." |
| **1:58–2:08** | Red-flag demo: D-017, BP 184/118 → urgent template appears instantly, labelled "Fixed rule · no AI". | "Red flags skip the AI entirely and follow ICMR's urgent rules." |
| **2:08–2:30** | Architecture slide (from the deck), with each block highlighting in turn. | "Under the hood: ADK agents on Cloud Run use Gemini 3.8 Flash to read, reason, explain and act, with the doctor's approval built in through tool confirmation. Records go into a Cloud Healthcare API FHIR store, ready for ABHA. Firebase runs the consoles, and BigQuery measures every step from finding to care." |
| **2:30–2:45** | Evaluation tiles: extraction accuracy on N real reports; 0 of 50 leaks; red flags 100% rule-based; language ratings. | "We tested it: [X]% accuracy on real Indian lab reports, zero result leaks in fifty adversarial tests, and every red flag handled by rules." |
| **2:45–2:58** | Close card: "Every donation is a health check. TraceDrop makes sure it counts." Plus links. | "India runs 1.5 crore of these health checks a year. TraceDrop makes sure every finding reaches care, with Gemini doing the navigation and people staying in charge." |

## Recording checklist

- Record at 1080p. Make the phone mock-up legible: fonts of 16 px or more.
- Use the prototype's replay mode so timing is repeatable. Do one live take of the approval click.
- Subtitle the Hindi.
- Keep each on-screen number on screen for at least 2 seconds.
- Upload a backup copy to Google Drive with public view access.
