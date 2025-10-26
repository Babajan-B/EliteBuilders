/**
 * Pitch Deck Analyzer
 * Extracts and analyzes content from pitch decks (Google Docs, PDFs, etc.)
 */

interface PitchDeckAnalysis {
  accessible: boolean;
  type: 'google_docs' | 'pdf' | 'slides' | 'other' | 'unknown';
  content_extracted: boolean;
  summary: string;
  text_content?: string;
  error?: string;
}

/**
 * Detect pitch deck type from URL
 */
function detectDeckType(url: string): PitchDeckAnalysis['type'] {
  if (url.includes('docs.google.com')) return 'google_docs';
  if (url.includes('drive.google.com')) return 'google_docs';
  if (url.includes('slides.google.com')) return 'slides';
  if (url.includes('.pdf')) return 'pdf';
  return 'other';
}

/**
 * Extract content from Google Docs/Slides
 * Uses the export API to get plain text
 */
async function extractGoogleDocsContent(url: string): Promise<string | null> {
  try {
    // Extract document ID from URL
    const docIdMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!docIdMatch) {
      console.log('[Deck Analyzer] Could not extract Google Docs ID');
      return null;
    }
    
    const docId = docIdMatch[1];
    
    // Try to fetch as plain text (works for public docs)
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
    const response = await fetch(exportUrl, {
      headers: {
        'User-Agent': 'EliteBuilders-Platform',
      },
    });
    
    if (!response.ok) {
      // Try presentation export if document fails
      const slidesUrl = `https://docs.google.com/presentation/d/${docId}/export/txt`;
      const slidesResponse = await fetch(slidesUrl);
      
      if (!slidesResponse.ok) {
        console.log('[Deck Analyzer] Could not access Google Docs (may be private)');
        return null;
      }
      
      const text = await slidesResponse.text();
      return text.substring(0, 5000); // Limit to ~5KB
    }
    
    const text = await response.text();
    
    // Limit size
    if (text.length > 5000) {
      return text.substring(0, 5000) + '\n\n[... truncated for length]';
    }
    
    return text;
  } catch (error) {
    console.error('[Deck Analyzer] Error extracting Google Docs:', error);
    return null;
  }
}

/**
 * Fetch and analyze PDF content
 * Note: Full PDF parsing requires external library, so we just verify accessibility
 */
async function analyzePDFDeck(url: string): Promise<{ accessible: boolean; size?: number }> {
  try {
    const response = await fetch(url, {
      method: 'HEAD', // Just check headers, don't download
      headers: {
        'User-Agent': 'EliteBuilders-Platform',
      },
    });
    
    if (!response.ok) return { accessible: false };
    
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    return {
      accessible: contentType?.includes('pdf') || false,
      size: contentLength ? parseInt(contentLength) : undefined,
    };
  } catch (error) {
    console.error('[Deck Analyzer] Error checking PDF:', error);
    return { accessible: false };
  }
}

/**
 * Analyze pitch deck and extract content
 */
export async function analyzePitchDeck(deckUrl: string): Promise<PitchDeckAnalysis> {
  console.log('[Deck Analyzer] Starting analysis for:', deckUrl);
  
  const type = detectDeckType(deckUrl);
  console.log('[Deck Analyzer] Detected type:', type);
  
  try {
    switch (type) {
      case 'google_docs':
      case 'slides': {
        const content = await extractGoogleDocsContent(deckUrl);
        
        if (content) {
          return {
            accessible: true,
            type,
            content_extracted: true,
            summary: `Successfully extracted ${content.length} characters from ${type === 'slides' ? 'presentation' : 'document'}`,
            text_content: content,
          };
        } else {
          return {
            accessible: false,
            type,
            content_extracted: false,
            summary: 'Document may be private or sharing settings restrict access',
            error: 'Could not access document',
          };
        }
      }
      
      case 'pdf': {
        const pdfInfo = await analyzePDFDeck(deckUrl);
        
        if (pdfInfo.accessible) {
          return {
            accessible: true,
            type,
            content_extracted: false, // Can't extract text without library
            summary: `PDF accessible (${pdfInfo.size ? Math.round(pdfInfo.size / 1024) + 'KB' : 'unknown size'}). Note: Text extraction not available for PDFs.`,
          };
        } else {
          return {
            accessible: false,
            type,
            content_extracted: false,
            summary: 'PDF not accessible or invalid URL',
            error: 'Could not access PDF',
          };
        }
      }
      
      default: {
        // Try to fetch as generic URL
        const response = await fetch(deckUrl, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'EliteBuilders-Platform',
          },
        });
        
        if (response.ok) {
          return {
            accessible: true,
            type: 'other',
            content_extracted: false,
            summary: 'Pitch deck URL is accessible',
          };
        } else {
          return {
            accessible: false,
            type: 'other',
            content_extracted: false,
            summary: 'Could not access pitch deck',
            error: `HTTP ${response.status}`,
          };
        }
      }
    }
  } catch (error) {
    console.error('[Deck Analyzer] Error:', error);
    return {
      accessible: false,
      type,
      content_extracted: false,
      summary: 'Error analyzing pitch deck',
      error: (error as Error).message,
    };
  }
}

/**
 * Format pitch deck analysis for LLM
 */
export function formatPitchDeckForLLM(analysis: PitchDeckAnalysis): string {
  let formatted = '\n=== PITCH DECK ANALYSIS ===\n\n';
  
  formatted += `Type: ${analysis.type.replace('_', ' ').toUpperCase()}\n`;
  formatted += `Accessible: ${analysis.accessible ? 'Yes ✓' : 'No ✗'}\n`;
  
  if (analysis.text_content) {
    formatted += `\n--- Pitch Deck Content ---\n`;
    formatted += analysis.text_content + '\n';
  } else if (analysis.accessible) {
    formatted += `\nNote: Pitch deck is accessible but text extraction not available for this format.\n`;
    formatted += `The project has provided a pitch deck, which shows professional presentation skills.\n`;
  } else {
    formatted += `\n⚠️ Pitch deck not accessible: ${analysis.error || 'Unknown error'}\n`;
  }
  
  formatted += '\n=== END PITCH DECK ANALYSIS ===\n';
  
  return formatted;
}
