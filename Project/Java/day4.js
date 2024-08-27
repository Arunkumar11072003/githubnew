// Define classes as ES Modules

export class MockEmailProvider {
    constructor(shouldFail) {
      this.shouldFail = shouldFail;
    }
  
    async sendEmail(to, subject, body) {
      if (this.shouldFail) {
        throw new Error("Failed to send email");
      }
      return true; // Simulate successful email send
    }
  }
  
  export class EmailService {
    constructor(provider1, provider2, rateLimit) {
      this.providers = [provider1, provider2];
      this.rateLimit = rateLimit * 60 * 1000; // Convert minutes to milliseconds
      this.lastSentTime = Date.now();
    }
  
    async sendWithRetry(provider, to, subject, body, retries = 3) {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          return await provider.sendEmail(to, subject, body);
        } catch (error) {
          if (attempt === retries) throw error;
          await this.exponentialBackoff(attempt);
        }
      }
    }
  
    exponentialBackoff(attempt) {
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      return new Promise(resolve => setTimeout(resolve, delay));
    }
  
    async sendEmail(to, subject, body) {
      const now = Date.now();
      if (now - this.lastSentTime < this.rateLimit) {
        throw new Error("Rate limit exceeded");
      }
  
      for (const provider of this.providers) {
        try {
          await this.sendWithRetry(provider, to, subject, body);
          break; // Exit loop if email sent successfully
        } catch (error) {
          console.error(`Failed to send email with provider`, error);
          // Continue to the next provider if available
        }
      }
  
      this.lastSentTime = now;
    }
  }
  
  // Example usage
  if (typeof window !== 'undefined') { // Check if running in browser environment
    (async () => {
      const { MockEmailProvider, EmailService } = await import('./day4.js');
      
      const provider1 = new MockEmailProvider(true); // Simulate failure
      const provider2 = new MockEmailProvider(false); // Simulate success
      const service = new EmailService(provider1, provider2, 1); // 1 minute rate limit
  
      try {
        await service.sendEmail('test@example.com', 'Subject', 'Body');
        console.log('Email sent successfully');
      } catch (error) {
        console.error('Failed to send email', error);
      }
    })();
  }
  