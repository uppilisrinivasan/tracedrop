/**
 * Message Template Fallback System
 * When LLM rate limit exceeded, use templates with variable substitution
 */

import { MessageTemplate, TemplateVariables } from '../types/agents';

export class MessageTemplateService {
  private templates: Map<string, MessageTemplate> = new Map();

  constructor() {
    this.loadDefaultTemplates();
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): MessageTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get best matching template for condition
   */
  getTemplateForCondition(
    category: string,
    language: string = 'en'
  ): MessageTemplate | undefined {
    for (const [, template] of this.templates) {
      if (template.category === category && template.language === language) {
        return template;
      }
    }
    return undefined;
  }

  /**
   * Substitute variables in template
   */
  substitute(template: MessageTemplate, variables: TemplateVariables): string {
    let message = template.template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      message = message.split(placeholder).join(String(value));
    }

    return message;
  }

  /**
   * Load default templates
   */
  private loadDefaultTemplates(): void {
    // BP Grade 1 - English
    this.templates.set('BP_GRADE1_EN', {
      id: 'BP_GRADE1_EN',
      template: 'Your blood pressure is {value} mmHg. This is slightly elevated. Please visit a nearby clinic within 2-4 weeks for checkup. In the meantime, reduce salt intake and increase physical activity.',
      language: 'en',
      category: 'BP_GRADE1',
      variables: ['value'],
      tone: 'supportive',
      urgencyLevel: 2,
    });

    // BP Grade 1 - Hindi
    this.templates.set('BP_GRADE1_HI', {
      id: 'BP_GRADE1_HI',
      template: 'आपका रक्तचाप {value} है। यह थोड़ा बढ़ा हुआ है। कृपया 2-4 हफ्तों में निकटतम क्लिनिक में जांच करवाएं। इस बीच, नमक कम करें और व्यायाम बढ़ाएं।',
      language: 'hi',
      category: 'BP_GRADE1',
      variables: ['value'],
      tone: 'supportive',
      urgencyLevel: 2,
    });

    // BP Grade 2 - English
    this.templates.set('BP_GRADE2_EN', {
      id: 'BP_GRADE2_EN',
      template: 'Your blood pressure is {value} mmHg - this is high. Please visit a doctor within 7 days. This may require medication. Contact us immediately if you have chest pain or shortness of breath.',
      language: 'en',
      category: 'BP_GRADE2',
      variables: ['value'],
      tone: 'urgent',
      urgencyLevel: 3,
    });

    // Hemoglobin Low - English
    this.templates.set('HB_MILD_EN', {
      id: 'HB_MILD_EN',
      template: 'Your hemoglobin level is {value} g/dL - this is below normal. Eat more iron-rich foods: spinach, meat, beans, nuts. Rest well and avoid strenuous work. Schedule a checkup in 2-4 weeks.',
      language: 'en',
      category: 'HB_MILD',
      variables: ['value'],
      tone: 'supportive',
      urgencyLevel: 2,
    });

    // Hemoglobin Severe - English
    this.templates.set('HB_SEVERE_EN', {
      id: 'HB_SEVERE_EN',
      template: 'Your hemoglobin level is {value} g/dL - this is critically low. PLEASE SEEK IMMEDIATE MEDICAL ATTENTION. Go to the nearest hospital or call emergency services.',
      language: 'en',
      category: 'HB_SEVERE',
      variables: ['value'],
      tone: 'urgent',
      urgencyLevel: 5,
    });

    // Diabetes Risk - English
    this.templates.set('FBS_DIABETIC_EN', {
      id: 'FBS_DIABETIC_EN',
      template: 'Your fasting glucose is {value} mg/dL - this indicates diabetes risk. Please consult a doctor within 1 week for proper testing and management. Reduce sugar intake and increase exercise.',
      language: 'en',
      category: 'FBS_DIABETIC',
      variables: ['value'],
      tone: 'urgent',
      urgencyLevel: 3,
    });

    // TTI Reactive - English
    this.templates.set('TTI_REACTIVE_EN', {
      id: 'TTI_REACTIVE_EN',
      template: 'An important health concern was detected in your screening. PLEASE CONTACT US IMMEDIATELY at {phone}. You need to speak with a counselor urgently. Your health and privacy are our priority.',
      language: 'en',
      category: 'TTI_REACTIVE',
      variables: ['phone'],
      tone: 'urgent',
      urgencyLevel: 5,
    });

    // Deferred - English
    this.templates.set('DEFERRED_EN', {
      id: 'DEFERRED_EN',
      template: 'We were unable to proceed with your donation today due to: {reason}. This is temporary and medical. Please follow the advice of our health team. You can return after {timeline} or as advised.',
      language: 'en',
      category: 'DEFERRED',
      variables: ['reason', 'timeline'],
      tone: 'supportive',
      urgencyLevel: 1,
    });

    // Prediabetes - English
    this.templates.set('FBS_PREDIABETIC_EN', {
      id: 'FBS_PREDIABETIC_EN',
      template: 'Your fasting glucose is {value} mg/dL - prediabetic range. You can prevent diabetes with lifestyle changes. Reduce sugar and refined carbs, exercise 30 min daily. Schedule follow-up in 2-4 weeks.',
      language: 'en',
      category: 'FBS_PREDIABETIC',
      variables: ['value'],
      tone: 'informative',
      urgencyLevel: 2,
    });
  }

  /**
   * Get all templates for a language
   */
  getTemplatesByLanguage(language: string): MessageTemplate[] {
    const results: MessageTemplate[] = [];
    for (const [, template] of this.templates) {
      if (template.language === language) {
        results.push(template);
      }
    }
    return results;
  }

  /**
   * Add custom template
   */
  addTemplate(template: MessageTemplate): void {
    this.templates.set(template.id, template);
  }
}

// Singleton instance
let templateService: MessageTemplateService | null = null;

export function getTemplateService(): MessageTemplateService {
  if (!templateService) {
    templateService = new MessageTemplateService();
  }
  return templateService;
}
