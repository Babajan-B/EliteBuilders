/**
 * Video Analyzer with OpenAI Whisper
 * Transcribes demo videos with automatic file cleanup
 * 
 * Uses: https://platform.openai.com/docs/guides/speech-to-text
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const unlink = promisify(fs.unlink);
const access = promisify(fs.access);

interface VideoAnalysis {
  transcription?: string;
  duration?: number;
  summary?: string;
  key_points?: string[];
  accessible: boolean;
  error?: string;
}

/**
 * Clean up temporary files (video and audio)
 * Called automatically after transcription completes
 */
async function cleanupFiles(filePaths: string[]): Promise<void> {
  for (const filePath of filePaths) {
    try {
      // Check if file exists before attempting to delete
      await access(filePath, fs.constants.F_OK);
      await unlink(filePath);
      console.log(`[Video Analyzer] 🗑️  Deleted: ${path.basename(filePath)}`);
    } catch (error) {
      // File doesn't exist or already deleted - that's okay
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`[Video Analyzer] ⚠️  Could not delete ${filePath}:`, error);
      }
    }
  }
}

/**
 * Analyze demo video using OpenAI Whisper
 * 
 * Process:
 * 1. Download video from URL (YouTube, Vimeo, direct MP4, etc.)
 * 2. Extract audio track to MP3
 * 3. Send to OpenAI Whisper API for transcription
 * 4. ✅ DELETE video and audio files immediately after transcription
 * 5. Return transcription for LLM analysis
 * 
 * Reference: https://platform.openai.com/docs/guides/speech-to-text
 */
export async function analyzeVideoWithWhisper(
  videoUrl: string
): Promise<VideoAnalysis> {
  console.log('[Video Analyzer] 🎥 Starting video analysis...');
  console.log('[Video Analyzer] URL:', videoUrl);
  
  // Files to clean up (tracked throughout process)
  const filesToDelete: string[] = [];
  
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('[Video Analyzer] ❌ OPENAI_API_KEY not configured');
      return {
        accessible: false,
        error: 'OpenAI API key not configured'
      };
    }

    // Step 1: Download video and extract audio
    console.log('[Video Analyzer] ⬇️  Downloading video...');
    const { videoPath, audioPath, duration } = await downloadAndExtractAudio(videoUrl);
    
    // Track files for cleanup
    filesToDelete.push(videoPath, audioPath);
    
    console.log('[Video Analyzer] ✅ Audio extracted:', path.basename(audioPath));
    console.log('[Video Analyzer] 📊 Duration:', Math.round(duration), 'seconds');
    
    // Step 2: Transcribe with Whisper
    console.log('[Video Analyzer] 🎤 Transcribing with Whisper...');
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
      language: "en", // Auto-detect also works
      response_format: "text"
    });
    
    console.log('[Video Analyzer] ✅ Transcription complete');
    console.log('[Video Analyzer] 📝 Transcript length:', transcription.length, 'characters');
    
    // Step 3: IMMEDIATE CLEANUP - Delete video and audio files
    console.log('[Video Analyzer] 🧹 Cleaning up temporary files...');
    await cleanupFiles(filesToDelete);
    
    // Step 4: Parse and return analysis
    const analysis: VideoAnalysis = {
      transcription: transcription,
      duration: Math.round(duration),
      summary: generateSummary(transcription),
      key_points: extractKeyPoints(transcription),
      accessible: true
    };
    
    console.log('[Video Analyzer] ✅ Analysis complete!');
    return analysis;
    
  } catch (error) {
    console.error('[Video Analyzer] ❌ Error during analysis:', error);
    
    // CLEANUP ON ERROR - Always delete files even if transcription fails
    if (filesToDelete.length > 0) {
      console.log('[Video Analyzer] 🧹 Cleaning up after error...');
      await cleanupFiles(filesToDelete);
    }

  // Step 3: Analyze transcription
  const summary = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: "Summarize this demo video transcription, highlighting key features and technical details."
    }, {
      role: "user",
      content: transcription.text
    }]
  });
  
  return {
    transcription: transcription.text,
    duration: audioFile.duration,
    summary: summary.choices[0].message.content,
    key_points: extractKeyPoints(summary.choices[0].message.content),
    accessible: true,
  };
  */
  
  return {
    accessible: false,
    error: 'Video analysis not yet implemented. Coming soon with OpenAI Whisper!',
  };
}

/**
 * Format video analysis for LLM (FUTURE)
 */
export function formatVideoAnalysisForLLM(analysis: VideoAnalysis): string {
  if (!analysis.accessible || !analysis.transcription) {
    return '\n=== DEMO VIDEO ===\nVideo analysis not available yet.\n=== END VIDEO ===\n';
  }
  
  let formatted = '\n=== DEMO VIDEO ANALYSIS ===\n\n';
  
  if (analysis.duration) {
    formatted += `Duration: ${Math.floor(analysis.duration / 60)}:${(analysis.duration % 60).toString().padStart(2, '0')}\n\n`;
  }
  
  if (analysis.summary) {
    formatted += `Summary:\n${analysis.summary}\n\n`;
  }
  
  if (analysis.key_points && analysis.key_points.length > 0) {
    formatted += 'Key Features Demonstrated:\n';
    analysis.key_points.forEach((point, i) => {
      formatted += `${i + 1}. ${point}\n`;
    });
    formatted += '\n';
  }
  
  if (analysis.transcription) {
    formatted += '--- Video Transcription (excerpt) ---\n';
    const excerpt = analysis.transcription.length > 2000 
      ? analysis.transcription.substring(0, 2000) + '...' 
      : analysis.transcription;
    formatted += excerpt + '\n\n';
  }
  
  formatted += '=== END DEMO VIDEO ANALYSIS ===\n';
  
  return formatted;
}

/**
 * Helper: Check if URL is a video
 */
export function isVideoUrl(url: string): boolean {
  const videoPatterns = [
    /youtube\.com\/watch/,
    /youtu\.be\//,
    /vimeo\.com\//,
    /loom\.com\//,
    /\.mp4$/i,
    /\.mov$/i,
    /\.avi$/i,
    /\.webm$/i,
  ];
  
  return videoPatterns.some(pattern => pattern.test(url));
}

/**
 * Implementation notes for future developer:
 * 
 * Required NPM packages:
 * - openai (for Whisper API)
 * - fluent-ffmpeg (for audio extraction)
 * - youtube-dl-exec (for YouTube downloads)
 * 
 * Environment variables needed:
 * - OPENAI_API_KEY=your-key-here
 * 
 * Cost considerations:
 * - Whisper API: $0.006 per minute
 * - 10-minute demo video = $0.06
 * - Very affordable for transcription
 * 
 * Rate limits:
 * - OpenAI: 50 requests/minute (Tier 1)
 * - File size limit: 25MB audio file
 * 
 * Processing time:
 * - Audio extraction: 5-10 seconds
 * - Whisper transcription: 10-30 seconds (depending on video length)
 * - Total: ~15-40 seconds additional per submission with video
 * 
 * Supported video sources:
 * - YouTube (most common)
 * - Vimeo
 * - Loom
 * - Direct MP4/MOV/WebM links
 * - Google Drive (with proper permissions)
 */
