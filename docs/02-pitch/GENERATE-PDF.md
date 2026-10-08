# How to Generate the New Pitch-Deck PDF

The `pitch-deck.html` file has been completely updated with the **consumer-centric ecosystem diagram**. Now you need to convert it to PDF.

---

## Quickest Method: Print from Browser (2 minutes)

### Step 1: Open the HTML in Your Browser
```bash
open /Users/u.srinivasan/Documents/Projects_Workshops/H2S-Google\ competition/projects/tracedrop/docs/02-pitch/pitch-deck.html
```

### Step 2: Print to PDF
1. Press `Cmd + P` (Mac) or `Ctrl + P` (Windows)
2. Look for "Save as PDF" or "Print to File"
3. Set:
   - Margins: **Minimal/None**
   - Background graphics: **ON** (important for colors/diagram)
   - Page size: **Landscape 13.333" × 7.5"** (or just use Tabloid)
4. Save as: `pitch-deck.pdf`

### Step 3: Verify
- Check that Slide 2B ecosystem diagram is visible and clear
- Check colors are showing
- Check all text is readable

---

## Alternative Method: Command Line (If you have wkhtmltopdf)

```bash
# Install if you don't have it
brew install wkhtmltopdf

# Convert
wkhtmltopdf --page-size Tabloid --orientation Landscape \
  /Users/u.srinivasan/Documents/Projects_Workshops/H2S-Google\ competition/projects/tracedrop/docs/02-pitch/pitch-deck.html \
  /Users/u.srinivasan/Documents/Projects_Workshops/H2S-Google\ competition/projects/tracedrop/docs/02-pitch/pitch-deck-new.pdf
```

---

## What's Changed in the HTML (So You Know What to Expect in PDF)

### Slide 1: Title
- **NEW tagline:** "Your Health. Your Blood. Your Data."
- Same blue gradient background

### Slide 2: Arjun
- Same as before (BP chart, persona card)

### **Slide 2B: NEW ECOSYSTEM DIAGRAM** ⭐
- **DONOR AT CENTER** (blue circle, prominent)
- **LEFT COLUMN (Green):** Direct benefits
  - Health Visibility
  - Free Care
  - Impact Badge
- **CENTER COLUMN (Blue):** Flywheel
  - Donate → Know → Care → Return
  - (Shows 3-month habit loop)
- **RIGHT COLUMN (Gray):** Institutional benefits
  - Blood centres, Employers, Government
- **KEY MESSAGE:** "All win when donor wins"

### Slide 3: Problem
- **Reframed heading:** "Consumer Problem: Urban workers blind to health"
- Same funnel bars and stats

### Slide 5: Solution
- **Reframed heading:** "Consumer Platform" instead of "Navigator"
- Same four feature cards

### Slide 9: Impact & Scale
- **NEW layout:** Three columns with colors
  - Green = Donor wins
  - Blue = How it sustains
  - Gray = Institution wins

### Slide 10: Close
- **NEW message:** "Your Blood. Your Health. Your Data."
- About incentive alignment

---

## Verification Checklist for PDF

After generating the PDF, check these:

- [ ] **Slide 2B (Ecosystem)** is visible and clear
- [ ] **Donor circle** is at center and blue
- [ ] **Three columns** are color-coded (green/blue/gray)
- [ ] **All text** is readable
- [ ] **Charts and graphs** show colors correctly
- [ ] **PDF opens** without errors
- [ ] **All 10 slides** are there

---

## If You're Using Google Slides or PowerPoint Instead

If you want to recreate this in Google Slides or PowerPoint:

1. Open Google Slides or PowerPoint
2. Create 10 slides matching the structure in `PITCH-DECK-VISUAL-GUIDE.md`
3. **Slide 2B is CRITICAL:** Create a visual with:
   - Large blue circle in center labeled "DONOR"
   - Three boxes left/center/right with respective content
   - Use colors: #e1f5e1 (green), #e8f3ff (blue), #f7f6f3 (gray)
4. Export to PDF

---

## Colors to Use (if recreating)

From the HTML CSS:

```
Green (Donor benefits):     #e1f5e1  or  rgb(225, 245, 225)
Blue (Flywheel):           #e8f3ff  or  rgb(232, 243, 255)
Gray (Institutions):       #f7f6f3  or  rgb(247, 246, 243)
Accent (Headlines):        #184f95  or  rgb(24, 79, 149)
Text Primary:              #0b0b0b  or  black
```

---

## What NOT to Do

❌ Don't use the OLD pitch-deck.pdf  
❌ Don't manually edit the PDF with Preview/Acrobat  
❌ Don't skip the ecosystem diagram slide  
❌ Don't remove background colors

---

## Quick Summary

**HTML file:** Updated ✓  
**What needs to happen:** Convert to PDF  
**Best method:** Print from browser (2 min)  
**Critical element:** Ecosystem diagram (Slide 2B) must be visible and clear  

**DO THIS NOW:**
1. Open `pitch-deck.html` in browser
2. Print to PDF
3. Save as `pitch-deck.pdf` (overwrite old one)
4. Verify ecosystem diagram is visible
5. Share with team

Done. Your pitch deck now shows donors at the center visually.

---

## Troubleshooting

**Problem:** Ecosystem diagram doesn't show colors  
**Solution:** Check "Background graphics" is ON in print settings

**Problem:** Text is too small  
**Solution:** Adjust print margins to Minimal/None

**Problem:** PDF is too large  
**Solution:** This is normal for visual-heavy decks. 5-20MB is fine.

**Problem:** Can't find pitch-deck.html  
**Solution:** Look in: `/docs/02-pitch/pitch-deck.html`

---

**Need help?** See `PITCH-DECK-VISUAL-GUIDE.md` for detailed slide-by-slide breakdown.
