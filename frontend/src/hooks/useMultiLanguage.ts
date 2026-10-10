/**
 * useMultiLanguage Hook
 *
 * Internationalization support for multiple Indian languages.
 * Loads templates from backend and supports variable substitution.
 *
 * Supported languages:
 * - en: English
 * - hi: Hindi
 * - ta: Tamil
 * - te: Telugu
 * - kn: Kannada
 * - ml: Malayalam
 */

import { useState, useEffect, useCallback } from 'react';
import { UseMultiLanguageReturn } from '../types/index';

// ============================================================================
// LANGUAGE CONFIGURATION
// ============================================================================

const SUPPORTED_LANGUAGES = ['en', 'hi', 'ta', 'te', 'kn', 'ml'] as const;
type LanguageCode = typeof SUPPORTED_LANGUAGES[number];

// Fallback translations for common terms
const FALLBACK_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    blood_pressure: 'Blood Pressure',
    hemoglobin: 'Hemoglobin',
    deferred: 'Deferred from donation',
    elevated: 'Elevated',
    normal: 'Normal',
    low: 'Low',
    critical: 'Critical',
    book_appointment: 'Book Appointment',
    view_details: 'View Details',
  },
  hi: {
    blood_pressure: 'रक्त दाब',
    hemoglobin: 'हीमोग्लोबिन',
    deferred: 'दान से स्थगित',
    elevated: 'उच्च',
    normal: 'सामान्य',
    low: 'कम',
    critical: 'गंभीर',
    book_appointment: 'अपॉइंटमेंट बुक करें',
    view_details: 'विवरण देखें',
  },
  ta: {
    blood_pressure: 'இரத்த அழுத்தம்',
    hemoglobin: 'ஹீமோகுளோபின்',
    deferred: 'தான முस்தீட்டை',
    elevated: 'உயர்ந்த',
    normal: 'சாதாரணம்',
    low: 'குறைந்த',
    critical: 'கடுமையான',
    book_appointment: 'நியமனம் முன்பதிவு செய்க',
    view_details: 'விபரங்கள் பார்க்க',
  },
  te: {
    blood_pressure: 'రక్த పీడనం',
    hemoglobin: 'హెమోగ్లోబిన్',
    deferred: 'రక్తదానం నుండి వాయిదా',
    elevated: 'ఎక్కువ',
    normal: 'సాధారణ',
    low: 'తక్కువ',
    critical: 'సంకટం',
    book_appointment: 'నియామకం బుక్ చేయండి',
    view_details: 'వివరాలు చూడండి',
  },
  kn: {
    blood_pressure: 'ರಕ್ತದ ಒತ್ತಡ',
    hemoglobin: 'ಹಿಮೋಗ್ಲೋಬಿನ್',
    deferred: 'ದಾನದಿಂದ ವಿಳಂಬ',
    elevated: 'ಎತ್ತರದ',
    normal: 'ಸಾಮಾನ್ಯ',
    low: 'ಕಡಿಮೆ',
    critical: 'ಗಂಭೀರ',
    book_appointment: 'ನೇಮನೆ ಬುಕ್ ಮಾಡಿ',
    view_details: 'ವಿವರಗಳನ್ನು ನೋಡಿ',
  },
  ml: {
    blood_pressure: 'രക്തസമ്മർദ്ദം',
    hemoglobin: 'ഹീമോഗ്ലോബിൻ',
    deferred: 'രക്തദാനത്തിൽ നിന്ന് കാലതാമസം',
    elevated: 'ഉയർന്ന',
    normal: 'സാധാരണ',
    low: 'കുറഞ്ഞ',
    critical: 'സന്നദ്ധത',
    book_appointment: 'നിയമനം ബുക്ക് ചെയ്യുക',
    view_details: 'വിശദാംശങ്ങൾ കാണുക',
  },
};

// ============================================================================
// TEMPLATE CACHE
// ============================================================================

const templateCache = new Map<string, any>();

async function fetchTemplate(
  templateKey: string,
  language: string
): Promise<any> {
  const cacheKey = `${templateKey}:${language}`;
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey);
  }

  try {
    const response = await fetch(
      `/api/templates?key=${templateKey}&language=${language}`
    );
    if (!response.ok) return null;

    const data = await response.json();
    templateCache.set(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

// ============================================================================
// VARIABLE SUBSTITUTION
// ============================================================================

/**
 * Replace template variables with actual values
 * Variables use {{varName}} syntax
 */
function substituteVariables(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value));
  });
  return result;
}

/**
 * Format date for display in current language
 */
function formatDateForLanguage(
  date: string | Date,
  language: LanguageCode
): string {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const localeMap: Record<LanguageCode, string> = {
    en: 'en-US',
    hi: 'hi-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    kn: 'kn-IN',
    ml: 'ml-IN',
  };

  return new Intl.DateTimeFormat(localeMap[language], options).format(d);
}

/**
 * Format time of day with language-aware greeting
 */
function getTimeOfDayGreeting(language: LanguageCode): string {
  const hour = new Date().getHours();

  const greetings: Record<LanguageCode, Record<string, string>> = {
    en: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
    },
    hi: {
      morning: 'सुप्रभात',
      afternoon: 'नमस्ते',
      evening: 'शुभ संध्या',
    },
    ta: {
      morning: 'நல்லை கால',
      afternoon: 'நல்ல பகல்',
      evening: 'நல்ல சாயंకாலம்',
    },
    te: {
      morning: 'శుభోదయం',
      afternoon: 'నమస్తే',
      evening: 'శుభసాయంత్రం',
    },
    kn: {
      morning: 'ಸುಪ್ರಭಾತ',
      afternoon: 'ನಮಸ್ತೆ',
      evening: 'ಶುಭಸಂಧ್ಯ',
    },
    ml: {
      morning: 'പ്രഭാതം',
      afternoon: 'നമസ്കാരം',
      evening: 'സാന്ധ്യം',
    },
  };

  const timeOfDay =
    hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  return greetings[language][timeOfDay];
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * useMultiLanguage Hook
 *
 * Usage:
 * const { translate } = useMultiLanguage('hi');
 * const msg = translate('bp_grade1_message', { value: 148, date: new Date() });
 */
export function useMultiLanguage(
  language: string = 'en'
): UseMultiLanguageReturn {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(
    (language as LanguageCode) || 'en'
  );

  // Validate language
  useEffect(() => {
    if (!SUPPORTED_LANGUAGES.includes(language as LanguageCode)) {
      console.warn(`Language ${language} not supported, using English`);
      setCurrentLanguage('en');
    } else {
      setCurrentLanguage(language as LanguageCode);
    }
  }, [language]);

  const translate = useCallback(
    (key: string, variables: Record<string, any> = {}): string => {
      // Check fallback translations first
      if (FALLBACK_TRANSLATIONS[currentLanguage]?.[key]) {
        return substituteVariables(
          FALLBACK_TRANSLATIONS[currentLanguage][key],
          variables
        );
      }

      // For specific findings (e.g., bp_grade1_message)
      // This would be fetched from backend in production
      const templates: Record<string, Record<string, string>> = {
        en: {
          greeting: `${getTimeOfDayGreeting('en')}, {{name}}`,
          bp_grade1_message: 'Your blood pressure is {{value}} mmHg - this is elevated. Please schedule a clinic visit.',
          bp_grade2_message: 'Your blood pressure is {{value}} mmHg - this is high. Immediate medical attention recommended.',
          hb_low_message: 'Your hemoglobin level is {{value}} g/dL - this is low. Please consult your doctor.',
          last_donation: 'Last donation: {{date}}',
          view_details: 'View Details',
          book_appointment: 'Book Appointment',
          report_issue: 'Report Issue',
        },
        hi: {
          greeting: `${getTimeOfDayGreeting('hi')}, {{name}}`,
          bp_grade1_message: 'आपका रक्त दाब {{value}} mmHg है - यह उच्च है। कृपया एक क्लिनिक विजिट निर्धारित करें।',
          bp_grade2_message: 'आपका रक्त दाब {{value}} mmHg है - यह बहुत अधिक है। तत्काल चिकित्सा ध्यान अनुशंसित है।',
          hb_low_message: 'आपका हीमोग्लोबिन स्तर {{value}} g/dL है - यह कम है। कृपया अपने डॉक्टर से सलाह लें।',
          last_donation: 'अंतिम दान: {{date}}',
          view_details: 'विवरण देखें',
          book_appointment: 'अपॉइंटमेंट बुक करें',
          report_issue: 'समस्या की रिपोर्ट करें',
        },
        ta: {
          greeting: `${getTimeOfDayGreeting('ta')}, {{name}}`,
          bp_grade1_message: 'உங்கள் இரத்த அழுத்தம் {{value}} mmHg - இது உயர்ந்தது. கிளினிக் பார்வையை வரிசைப்படுத்தவும்.',
          bp_grade2_message: 'உங்கள் இரத்த அழுத்தம் {{value}} mmHg - இது மிக அதிகமாக உள்ளது. உடனடி மருத்துவ கவனம் பரிந்துரைக்கப்படுகிறது.',
          hb_low_message: 'உங்கள் ஹீமோகுளோபின் அளவு {{value}} g/dL - இது குறைந்தது. உங்கள் டாக்டரை பரிசாரணை செய்யவும்.',
          last_donation: 'கடைசி தான: {{date}}',
          view_details: 'விபரங்கள் பார்க்க',
          book_appointment: 'நியமனம் முன்பதிவு செய்க',
          report_issue: 'சிக்கலைப் பதிவு செய்க',
        },
        te: {
          greeting: `${getTimeOfDayGreeting('te')}, {{name}}`,
          bp_grade1_message: 'మీ రక్త పీడనం {{value}} mmHg - ఇది ఎక్కువగా ఉంది. దయచేసి క్లినిక్ సందర్శన షెడ్యూల్ చేయండి.',
          bp_grade2_message: 'మీ రక్త పీడనం {{value}} mmHg - ఇది చాలా ఎక్కువ. తక్షణ వైద్య శ్రద్ధ సూచించబడుతుంది.',
          hb_low_message: 'మీ హెమోగ్లోబిన్ స్థాయి {{value}} g/dL - ఇది తక్కువ. దయచేసి మీ డాక్టర్‌ను సంప్రదించండి.',
          last_donation: 'చివరి దానం: {{date}}',
          view_details: 'వివరాలు చూడండి',
          book_appointment: 'నియామకం బుక్ చేయండి',
          report_issue: 'సమస్యను నివేదించండి',
        },
        kn: {
          greeting: `${getTimeOfDayGreeting('kn')}, {{name}}`,
          bp_grade1_message: 'ನಿಮ್ಮ ರಕ್ತದ ಒತ್ತಡ {{value}} mmHg - ಇದು ಎತ್ತರದಲ್ಲಿದೆ. ದಯವಿಟ್ಟು ಕ್ಲಿನಿಕ್ ಭೇಟಿ ನಿಗದಿಪಡಿಸಿ.',
          bp_grade2_message: 'ನಿಮ್ಮ ರಕ್ತದ ಒತ್ತಡ {{value}} mmHg - ಇದು ತುಂಬಾ ಹೆಚ್ಚಾಗಿದೆ. ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಗಮನ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ.',
          hb_low_message: 'ನಿಮ್ಮ ಹಿಮೋಗ್ಲೋಬಿನ್ ಮಟ್ಟ {{value}} g/dL - ಇದು ಕಡಿಮೆಯಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಡಾಕ್ಟರ್ ಅನ್ನು ಸಂಪರ್ಕಿಸಿ.',
          last_donation: 'ಕೊನೆಯ ದಾನ: {{date}}',
          view_details: 'ವಿವರಗಳನ್ನು ನೋಡಿ',
          book_appointment: 'ನೇಮನೆ ಬುಕ್ ಮಾಡಿ',
          report_issue: 'ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ',
        },
        ml: {
          greeting: `${getTimeOfDayGreeting('ml')}, {{name}}`,
          bp_grade1_message: 'നിങ്ങളുടെ രക്തസമ്മർദ്ദം {{value}} mmHg - ഇത് ഉയർന്നതാണ്. കൃപയാ ക്ലിനിക് സന്ദർശനം ബുക്ക് ചെയ്യുക.',
          bp_grade2_message: 'നിങ്ങളുടെ രക്തസമ്മർദ്ദം {{value}} mmHg - ഇത് വളരെ ഉയർന്നതാണ്. ഉടനടി മെഡിക്കൽ ശ്രദ്ധ ശുപാർശ ചെയ്യപ്പെടുന്നു.',
          hb_low_message: 'നിങ്ങളുടെ ഹീമോഗ്ലോബിൻ നില {{value}} g/dL - ഇത് കുറവാണ്. നിങ്ങളുടെ ഡോക്ടറുമായി കൂടിയാലോചിക്കുക.',
          last_donation: 'അവസാന സംഭാവന: {{date}}',
          view_details: 'വിശദാംശങ്ങൾ കാണുക',
          book_appointment: 'നിയമനം ബുക്ക് ചെയ്യുക',
          report_issue: 'പ്രശ്നം റിപ്പോർട്ട് ചെയ്യുക',
        },
      };

      let result = templates[currentLanguage]?.[key] || templates['en'][key] || key;

      // Format date variables if present
      if (variables.date) {
        variables.formattedDate = formatDateForLanguage(
          variables.date,
          currentLanguage
        );
        result = result.replace('{{date}}', variables.formattedDate);
      }

      return substituteVariables(result, variables);
    },
    [currentLanguage]
  );

  return {
    translate,
    currentLanguage,
  };
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export {
  SUPPORTED_LANGUAGES,
  formatDateForLanguage,
  getTimeOfDayGreeting,
};
