/**
 * GitHub Repository Analyzer
 * Fetches and analyzes key files from GitHub repos for LLM evaluation
 */

interface GitHubFile {
  name: string;
  content: string;
  size: number;
}

interface GitHubAnalysis {
  repo_exists: boolean;
  repo_stats: {
    stars: number;
    forks: number;
    open_issues: number;
    language: string | null;
    created_at: string;
    updated_at: string;
    description: string | null;
  } | null;
  files_found: {
    readme: boolean;
    package_json: boolean;
    requirements_txt: boolean;
    main_source: boolean;
    tests: boolean;
    env_example: boolean;
    license: boolean;
  };
  file_contents: {
    readme?: string;
    package_json?: string;
    requirements_txt?: string;
    main_source?: string;
    tests?: string;
    env_example?: string;
    license?: string;
  };
  analysis_summary: string;
  error?: string;
}

/**
 * Extract owner and repo from GitHub URL
 * Supports: https://github.com/owner/repo, github.com/owner/repo, etc.
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    // Remove trailing slashes and .git
    const cleaned = url.replace(/\.git$/, '').replace(/\/$/, '');
    
    // Match: github.com/owner/repo
    const match = cleaned.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch file content from GitHub (raw)
 * Uses public API - no auth needed for public repos
 */
async function fetchGitHubFile(
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  try {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      // Try 'master' branch if 'main' doesn't exist
      const masterUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/${path}`;
      const masterResponse = await fetch(masterUrl);
      if (!masterResponse.ok) return null;
      return await masterResponse.text();
    }
    
    const content = await response.text();
    
    // Limit size to prevent huge files
    const MAX_SIZE = 10000; // ~10KB
    if (content.length > MAX_SIZE) {
      return content.substring(0, MAX_SIZE) + '\n\n[... truncated for length]';
    }
    
    return content;
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    return null;
  }
}

/**
 * Fetch repository metadata from GitHub API
 */
async function fetchRepoMetadata(owner: string, repo: string) {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'EliteBuilders-Platform',
      },
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      stars: data.stargazers_count || 0,
      forks: data.forks_count || 0,
      open_issues: data.open_issues_count || 0,
      language: data.language,
      created_at: data.created_at,
      updated_at: data.updated_at,
      description: data.description,
    };
  } catch (error) {
    console.error('Error fetching repo metadata:', error);
    return null;
  }
}

/**
 * Find main source file based on language
 */
async function findMainSourceFile(
  owner: string,
  repo: string,
  language: string | null
): Promise<{ path: string; content: string } | null> {
  const possibleFiles = [
    // Python
    'main.py', 'app.py', 'run.py', 'server.py', 'api.py', 'src/main.py', 'src/app.py',
    // JavaScript/TypeScript
    'index.js', 'app.js', 'server.js', 'main.js', 'src/index.js', 'src/app.js',
    'index.ts', 'app.ts', 'server.ts', 'main.ts', 'src/index.ts', 'src/app.ts',
    // Next.js
    'pages/index.tsx', 'pages/index.js', 'app/page.tsx', 'app/page.js',
    // React
    'src/App.tsx', 'src/App.jsx', 'src/App.js',
    // Java
    'Main.java', 'App.java', 'src/main/java/Main.java',
    // Go
    'main.go', 'cmd/main.go',
    // Rust
    'main.rs', 'src/main.rs',
  ];
  
  for (const path of possibleFiles) {
    const content = await fetchGitHubFile(owner, repo, path);
    if (content) {
      return { path, content };
    }
  }
  
  return null;
}

/**
 * Find test files
 */
async function findTestFile(
  owner: string,
  repo: string
): Promise<string | null> {
  const possibleFiles = [
    'test.py', 'test_main.py', 'tests/test_main.py', 'tests/test_app.py',
    'test.js', 'test.ts', 'app.test.js', 'app.test.ts',
    'src/App.test.tsx', 'src/App.test.jsx',
    '__tests__/index.test.js', '__tests__/app.test.js',
  ];
  
  for (const path of possibleFiles) {
    const content = await fetchGitHubFile(owner, repo, path);
    if (content) return content;
  }
  
  return null;
}

/**
 * Analyze a GitHub repository and extract key information
 */
export async function analyzeGitHubRepository(
  repoUrl: string
): Promise<GitHubAnalysis> {
  console.log('[GitHub Analyzer] Starting analysis for:', repoUrl);
  
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    return {
      repo_exists: false,
      repo_stats: null,
      files_found: {
        readme: false,
        package_json: false,
        requirements_txt: false,
        main_source: false,
        tests: false,
        env_example: false,
        license: false,
      },
      file_contents: {},
      analysis_summary: 'Invalid GitHub URL format',
      error: 'Could not parse GitHub URL',
    };
  }
  
  const { owner, repo } = parsed;
  console.log(`[GitHub Analyzer] Parsed: ${owner}/${repo}`);
  
  try {
    // Fetch repository metadata
    const repoStats = await fetchRepoMetadata(owner, repo);
    
    if (!repoStats) {
      return {
        repo_exists: false,
        repo_stats: null,
        files_found: {
          readme: false,
          package_json: false,
          requirements_txt: false,
          main_source: false,
          tests: false,
          env_example: false,
          license: false,
        },
        file_contents: {},
        analysis_summary: 'Repository not found or not public',
        error: 'Repository not accessible',
      };
    }
    
    console.log('[GitHub Analyzer] Repository exists, fetching files...');
    
    // Fetch key files in parallel
    const [
      readme,
      packageJson,
      requirementsTxt,
      mainSource,
      tests,
      envExample,
      license,
    ] = await Promise.all([
      fetchGitHubFile(owner, repo, 'README.md'),
      fetchGitHubFile(owner, repo, 'package.json'),
      fetchGitHubFile(owner, repo, 'requirements.txt'),
      findMainSourceFile(owner, repo, repoStats.language),
      findTestFile(owner, repo),
      fetchGitHubFile(owner, repo, '.env.example'),
      fetchGitHubFile(owner, repo, 'LICENSE'),
    ]);
    
    const filesFound = {
      readme: !!readme,
      package_json: !!packageJson,
      requirements_txt: !!requirementsTxt,
      main_source: !!mainSource,
      tests: !!tests,
      env_example: !!envExample,
      license: !!license,
    };
    
    const fileContents: any = {};
    if (readme) fileContents.readme = readme;
    if (packageJson) fileContents.package_json = packageJson;
    if (requirementsTxt) fileContents.requirements_txt = requirementsTxt;
    if (mainSource) fileContents.main_source = `// File: ${mainSource.path}\n\n${mainSource.content}`;
    if (tests) fileContents.tests = tests;
    if (envExample) fileContents.env_example = envExample;
    if (license) fileContents.license = license;
    
    // Generate summary
    const foundCount = Object.values(filesFound).filter(Boolean).length;
    const techStack = packageJson 
      ? 'JavaScript/TypeScript (Node.js)' 
      : requirementsTxt 
      ? 'Python'
      : repoStats.language || 'Unknown';
    
    const summary = `Repository analyzed successfully. Found ${foundCount}/7 key files. Tech stack: ${techStack}. Last updated: ${new Date(repoStats.updated_at).toLocaleDateString()}.`;
    
    console.log('[GitHub Analyzer] ✅ Analysis complete:', summary);
    
    return {
      repo_exists: true,
      repo_stats: repoStats,
      files_found: filesFound,
      file_contents: fileContents,
      analysis_summary: summary,
    };
  } catch (error) {
    console.error('[GitHub Analyzer] Error:', error);
    return {
      repo_exists: false,
      repo_stats: null,
      files_found: {
        readme: false,
        package_json: false,
        requirements_txt: false,
        main_source: false,
        tests: false,
        env_example: false,
        license: false,
      },
      file_contents: {},
      analysis_summary: 'Error analyzing repository',
      error: (error as Error).message,
    };
  }
}

/**
 * Format GitHub analysis for LLM prompt
 */
export function formatGitHubAnalysisForLLM(analysis: GitHubAnalysis): string {
  if (!analysis.repo_exists) {
    return `\n⚠️ GITHUB REPOSITORY: Not accessible or invalid URL\nNote: Scoring will be based primarily on the writeup.\n`;
  }
  
  let formatted = '\n=== GITHUB REPOSITORY ANALYSIS ===\n\n';
  
  // Repository stats
  if (analysis.repo_stats) {
    formatted += `Repository Stats:\n`;
    formatted += `- Language: ${analysis.repo_stats.language || 'Not specified'}\n`;
    formatted += `- Stars: ${analysis.repo_stats.stars}\n`;
    formatted += `- Last Updated: ${new Date(analysis.repo_stats.updated_at).toLocaleDateString()}\n`;
    if (analysis.repo_stats.description) {
      formatted += `- Description: ${analysis.repo_stats.description}\n`;
    }
    formatted += '\n';
  }
  
  // Files found summary
  formatted += 'Files Found:\n';
  formatted += `✓ README.md: ${analysis.files_found.readme ? 'Yes' : 'No'}\n`;
  formatted += `✓ package.json/requirements.txt: ${analysis.files_found.package_json || analysis.files_found.requirements_txt ? 'Yes' : 'No'}\n`;
  formatted += `✓ Main source file: ${analysis.files_found.main_source ? 'Yes' : 'No'}\n`;
  formatted += `✓ Tests: ${analysis.files_found.tests ? 'Yes' : 'No'}\n`;
  formatted += `✓ .env.example: ${analysis.files_found.env_example ? 'Yes' : 'No'}\n`;
  formatted += `✓ LICENSE: ${analysis.files_found.license ? 'Yes' : 'No'}\n\n`;
  
  // File contents
  if (analysis.file_contents.readme) {
    formatted += '--- README.md ---\n';
    formatted += analysis.file_contents.readme + '\n\n';
  }
  
  if (analysis.file_contents.package_json) {
    formatted += '--- package.json (dependencies) ---\n';
    try {
      const pkg = JSON.parse(analysis.file_contents.package_json);
      formatted += `Dependencies: ${Object.keys(pkg.dependencies || {}).join(', ') || 'None'}\n`;
      formatted += `Dev Dependencies: ${Object.keys(pkg.devDependencies || {}).join(', ') || 'None'}\n\n`;
    } catch {
      formatted += analysis.file_contents.package_json + '\n\n';
    }
  }
  
  if (analysis.file_contents.requirements_txt) {
    formatted += '--- requirements.txt ---\n';
    formatted += analysis.file_contents.requirements_txt + '\n\n';
  }
  
  if (analysis.file_contents.main_source) {
    formatted += '--- Main Source File (excerpt) ---\n';
    formatted += analysis.file_contents.main_source + '\n\n';
  }
  
  if (analysis.file_contents.tests) {
    formatted += '✅ Tests found - Project has test coverage\n\n';
  }
  
  if (analysis.file_contents.env_example) {
    formatted += '✅ .env.example found - Good configuration practices\n\n';
  }
  
  if (analysis.file_contents.license) {
    formatted += '✅ LICENSE found - Proper open source licensing\n\n';
  }
  
  formatted += '=== END GITHUB ANALYSIS ===\n';
  
  return formatted;
}
