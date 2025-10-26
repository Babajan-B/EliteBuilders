/**
 * Demo URL Analyzer
 * Verifies if demo websites are live and working
 */

interface DemoAnalysis {
  accessible: boolean;
  status_code?: number;
  response_time?: number;
  is_live: boolean;
  tech_hints?: string[];
  screenshot_url?: string;
  error?: string;
}

/**
 * Check if demo URL is accessible and extract basic info
 */
export async function analyzeDemoUrl(demoUrl: string): Promise<DemoAnalysis> {
  console.log('[Demo Analyzer] Checking demo URL:', demoUrl);
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(demoUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EliteBuilders-Bot/1.0)',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    const statusCode = response.status;
    
    console.log(`[Demo Analyzer] Response: ${statusCode} (${responseTime}ms)`);
    
    if (!response.ok) {
      return {
        accessible: false,
        status_code: statusCode,
        response_time: responseTime,
        is_live: false,
        error: `HTTP ${statusCode}`,
      };
    }
    
    // Extract tech stack hints from headers
    const techHints: string[] = [];
    
    const server = response.headers.get('server');
    if (server) techHints.push(`Server: ${server}`);
    
    const poweredBy = response.headers.get('x-powered-by');
    if (poweredBy) techHints.push(`Powered by: ${poweredBy}`);
    
    const framework = response.headers.get('x-framework');
    if (framework) techHints.push(`Framework: ${framework}`);
    
    // Try to read HTML for meta tags (limited)
    try {
      const html = await response.text();
      const limitedHtml = html.substring(0, 2000); // First 2KB only
      
      // Look for common framework indicators
      if (limitedHtml.includes('next.js') || limitedHtml.includes('Next.js')) {
        techHints.push('Framework: Next.js');
      }
      if (limitedHtml.includes('react')) {
        techHints.push('Library: React');
      }
      if (limitedHtml.includes('vue')) {
        techHints.push('Framework: Vue.js');
      }
      if (limitedHtml.includes('vercel')) {
        techHints.push('Hosting: Vercel');
      }
      if (limitedHtml.includes('netlify')) {
        techHints.push('Hosting: Netlify');
      }
    } catch {
      // HTML parsing failed, skip
    }
    
    return {
      accessible: true,
      status_code: statusCode,
      response_time: responseTime,
      is_live: true,
      tech_hints: techHints.length > 0 ? techHints : undefined,
    };
  } catch (error) {
    console.error('[Demo Analyzer] Error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        accessible: false,
        is_live: false,
        error: 'Timeout (>10s)',
      };
    }
    
    return {
      accessible: false,
      is_live: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Format demo analysis for LLM
 */
export function formatDemoAnalysisForLLM(analysis: DemoAnalysis): string {
  let formatted = '\n=== DEMO WEBSITE ANALYSIS ===\n\n';
  
  if (analysis.is_live) {
    formatted += `✓ Demo is LIVE and accessible\n`;
    formatted += `- Status: HTTP ${analysis.status_code}\n`;
    formatted += `- Response Time: ${analysis.response_time}ms\n`;
    
    if (analysis.tech_hints && analysis.tech_hints.length > 0) {
      formatted += `\nTech Stack Detected:\n`;
      analysis.tech_hints.forEach(hint => {
        formatted += `- ${hint}\n`;
      });
    }
    
    formatted += `\nNote: The project has a live, working demo, which demonstrates practical implementation.\n`;
  } else {
    formatted += `✗ Demo is NOT accessible\n`;
    if (analysis.error) {
      formatted += `- Error: ${analysis.error}\n`;
    }
    if (analysis.status_code) {
      formatted += `- Status Code: ${analysis.status_code}\n`;
    }
    formatted += `\nNote: Demo may be down, private, or URL is incorrect. Score accordingly.\n`;
  }
  
  formatted += '\n=== END DEMO ANALYSIS ===\n';
  
  return formatted;
}
