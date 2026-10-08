/**
 * Message Formatter - Platform-specific Message Formatting
 * Formats agent output for different channels: WhatsApp, SMS, Email, Web
 */

import { FormattedMessage, FormattingOptions } from '../types/agents';

export class MessageFormatter {
  /**
   * Format message for WhatsApp
   * Supports markdown-style links, emoji, multiline
   */
  static formatForWhatsApp(message: string, metadata?: Record<string, any>): FormattedMessage {
    // WhatsApp supports:
    // - *bold* for bold
    // - _italic_ for italic
    // - ~strikethrough~
    // - ```code```
    // - Links: [Text](URL)
    // Max length: ~4096 chars

    let formatted = message
      .replace(/\*\*(.*?)\*\*/g, '*$1*') // Convert **bold** to *bold*
      .replace(/__(.*?)__/g, '_$1_') // Convert __italic__ to _italic_
      .trim();

    if (formatted.length > 4096) {
      formatted = formatted.substring(0, 4093) + '...';
    }

    return {
      raw: message,
      formatted,
      platform: 'whatsapp',
      metadata: {
        ...metadata,
        characterLimit: 4096,
        supportedFeatures: ['bold', 'italic', 'strikethrough', 'code', 'links', 'emoji'],
      },
    };
  }

  /**
   * Format message for SMS
   * Plain text, 160 characters per SMS
   */
  static formatForSMS(message: string, metadata?: Record<string, any>): FormattedMessage {
    // Remove markdown, formatting, emoji
    let formatted = message
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
      .replace(/__(.*?)__/g, '$1') // Remove __italic__
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert [text](url) to text
      .replace(/[^\w\s.,!?'-]/g, '') // Remove special chars and emoji
      .trim();

    // SMS character limit is 160 (or 153 if using GSM 7-bit encoding)
    if (formatted.length > 160) {
      formatted = formatted.substring(0, 157) + '...';
    }

    // Split into multiple SMS if needed
    const smsCount = Math.ceil(formatted.length / 160);

    return {
      raw: message,
      formatted,
      platform: 'sms',
      metadata: {
        ...metadata,
        characterLimit: 160,
        smsCount,
        supportedFeatures: ['plain_text'],
      },
    };
  }

  /**
   * Format message for Email
   * HTML format with rich styling
   */
  static formatForEmail(message: string, subject?: string, metadata?: Record<string, any>): FormattedMessage {
    // Convert markdown to HTML
    let html = message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>')
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');

    // Wrap in email template
    const template = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #007bff; color: white; padding: 20px; border-radius: 5px; }
    .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; }
    a { color: #007bff; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${subject || 'TraceDrop Health Alert'}</h2>
    </div>
    <div class="content">
      ${html}
    </div>
    <div class="footer">
      <p>This is an automated message from TraceDrop Health Monitoring System.</p>
      <p>If you did not request this, please contact support.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return {
      raw: message,
      formatted: template,
      platform: 'email',
      metadata: {
        ...metadata,
        subject: subject || 'TraceDrop Health Alert',
        supportedFeatures: ['html', 'formatting', 'links', 'attachments'],
      },
    };
  }

  /**
   * Format message for Web/App
   * HTML with inline CSS for app display
   */
  static formatForWeb(message: string, urgencyLevel: number = 0, metadata?: Record<string, any>): FormattedMessage {
    // Convert markdown to HTML
    let html = message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');

    // Add urgency styling
    let urgencyClass = 'info';
    let urgencyColor = '#17a2b8';
    if (urgencyLevel >= 4) {
      urgencyClass = 'critical';
      urgencyColor = '#dc3545';
    } else if (urgencyLevel >= 3) {
      urgencyClass = 'warning';
      urgencyColor = '#ffc107';
    } else if (urgencyLevel >= 2) {
      urgencyClass = 'caution';
      urgencyColor = '#ff9800';
    }

    const styledHtml = `
<div class="alert alert-${urgencyClass}" style="
  border-left: 4px solid ${urgencyColor};
  padding: 15px;
  margin: 10px 0;
  background-color: rgba(0,0,0,0.05);
  border-radius: 4px;
">
  ${html}
</div>
    `.trim();

    return {
      raw: message,
      formatted: styledHtml,
      platform: 'web',
      metadata: {
        ...metadata,
        urgencyLevel,
        urgencyClass,
        supportedFeatures: ['html', 'formatting', 'styling', 'interactive'],
      },
    };
  }

  /**
   * Auto-detect platform and format appropriately
   */
  static formatByPlatform(
    message: string,
    platform: 'whatsapp' | 'sms' | 'email' | 'web',
    options?: Partial<FormattingOptions>
  ): FormattedMessage {
    switch (platform) {
      case 'whatsapp':
        return this.formatForWhatsApp(message, options);
      case 'sms':
        return this.formatForSMS(message, options);
      case 'email':
        return this.formatForEmail(message, undefined, options);
      case 'web':
        return this.formatForWeb(message, 0, options);
      default:
        return { raw: message, formatted: message, platform: 'unknown', metadata: {} };
    }
  }

  /**
   * Extract plain text from formatted message
   */
  static stripFormatting(message: string): string {
    return message
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/<[^>]+>/g, '')
      .trim();
  }
}
