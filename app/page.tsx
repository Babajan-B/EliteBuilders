export default function HomePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>EliteBuilders API</h1>
      <p>Backend API is running. Visit the API endpoints:</p>
      <ul>
        <li><a href="/api/challenges">/api/challenges</a> - List all challenges</li>
        <li><a href="/api/leaderboard?challenge_id=1">/api/leaderboard</a> - View leaderboard</li>
        <li><a href="/api/health/db">/api/health/db</a> - Database health check</li>
      </ul>
    </div>
  );
}
