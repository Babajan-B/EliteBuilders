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
    
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Download video from URL and extract audio track
 * Returns paths to both files and video duration
 */
async function downloadAndExtractAudio(
  videoUrl: string
): Promise<{ videoPath: string; audioPath: string; duration: number }> {
  const ytdlp = (await import('yt-dlp-exec')).default;
  const ffmpeg = (await import('fluent-ffmpeg')).default;
  
  // Generate unique filenames with timestamp
  const timestamp = Date.now();
  const videoId = `video-${timestamp}`;
  const tmpDir = '/tmp';
  const videoPath = path.join(tmpDir, `${videoId}.mp4`);
  const audioPath = path.join(tmpDir, `${videoId}.mp3`);
  
  try {
    // Download video using yt-dlp (supports YouTube, Vimeo, direct URLs, etc.)
    console.log('[Video Analyzer] 📥 Downloading with yt-dlp...');
    await ytdlp(videoUrl, {
      output: videoPath,
      format: 'best[ext=mp4]',
      noPlaylist: true,
      maxFilesize: '500M', // 500MB limit
      quiet: true,
    });
    
    // Extract audio from video
    console.log('[Video Analyzer] 🎵 Extracting audio with ffmpeg...');
    const duration = await new Promise<number>((resolve, reject) => {
      let videoDuration = 0;
      
      ffmpeg(videoPath)
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .format('mp3')
        .on('codecData', (data) => {
          // Parse duration (format: "00:05:23.45")
          const timeParts = data.duration.split(':');
          videoDuration = 
            parseInt(timeParts[0]) * 3600 + // hours
            parseInt(timeParts[1]) * 60 +   // minutes
            parseFloat(timeParts[2]);        // seconds
        })
        .on('end', () => resolve(videoDuration))
        .on('error', (err) => reject(err))
        .save(audioPath);
    });
    
    return { videoPath, audioPath, duration };
    
  } catch (error) {
    // Cleanup on error
    await cleanupFiles([videoPath, audioPath]);
    throw error;
  }
}

/**
 * Generate a concise summary from transcription
 */
function generateSummary(transcription: string): string {
  // Take first 500 characters as summary
  const preview = transcription.slice(0, 500);
  return preview.length < transcription.length 
    ? preview + '...' 
    : preview;
}

/**
 * Extract key points from transcription using simple heuristics
 * (Can be enhanced with GPT-4 for better results)
 */
function extractKeyPoints(transcription: string): string[] {
  const points: string[] = [];
  
  // Look for common demo phrases
  const demoPatterns = [
    /(?:let me |i'll |we can |here's |this is )(.{30,100})/gi,
    /(?:feature|function|capability|component)(?:s)? (?:is|are|includes?) (.{20,80})/gi,
    /(?:demonstrates?|shows?|displays?) (.{20,80})/gi,
  ];
  
  for (const pattern of demoPatterns) {
    const matches = transcription.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && points.length < 5) {
        points.push(match[1].trim());
      }
    }
  }
  
  // Fallback: Split by sentences and take first 3
  if (points.length === 0) {
    const sentences = transcription
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 150)
      .slice(0, 3);
    points.push(...sentences);
  }
  
  return points;
}

/**
 * Format video analysis for LLM
 */
export function formatVideoAnalysisForLLM(analysis: VideoAnalysis): string {
  if (!analysis.accessible || !analysis.transcription) {
    return '\n=== DEMO VIDEO ===\nVideo analysis not available.\n=== END VIDEO ===\n';
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
