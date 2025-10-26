# EliteBuilders - Competitive Coding Platform

A modern, professional competitive coding platform built with Next.js 14+, TypeScript, Tailwind CSS, and shadcn/ui. EliteBuilders enables developers to participate in coding competitions, submit their work, and compete for prizes.

## Features

### For Builders (Participants)
- Browse active, upcoming, and completed competitions
- View detailed competition information with challenges and prize pools
- Submit entries with GitHub repository and demo links
- Track submission status and receive judge feedback
- View personal submission history
- Compete on the global leaderboard

### For Judges
- Comprehensive judge console dashboard
- Review submissions with detailed information
- Score submissions (0-100 points)
- Provide detailed feedback to participants
- Filter submissions by status (pending, approved, rejected)
- Track review statistics

### For Sponsors
- Organization dashboard with competition analytics
- View all sponsored competitions
- Track submission statistics and participant engagement
- See top performers across competitions
- Monitor competition progress and metrics

### Public Features
- Browse all competitions without authentication
- View leaderboard rankings
- Explore competition details and challenges
- Responsive design for all devices

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Authentication**: Supabase Auth (ready for integration)
- **Database**: Supabase (ready for integration)

## Design System

### Color Palette
- **Primary**: Vibrant Orange (#FF5722) - energetic and engaging
- **Background**: Clean White (#FFFFFF)
- **Foreground**: Dark Gray (#1A1A1A)
- **Muted**: Light Gray (#F5F5F5)
- **Accent**: Complementary colors for status indicators

### Typography
- **Font Family**: Geist Sans (primary), Geist Mono (code)
- **Headings**: Bold, large sizes with proper hierarchy
- **Body**: 16px base with 1.5 line-height for readability

### Design Principles
- Clean, bright interface inspired by modern SaaS platforms
- Generous whitespace for breathing room
- Rounded corners (rounded-2xl) for friendly feel
- Soft shadows for subtle depth
- High contrast for accessibility
- Smooth transitions and hover states

## Project Structure

\`\`\`
elitebuilders/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── callback/route.ts
│   │   │   └── signout/route.ts
│   │   ├── judge/
│   │   │   └── review/route.ts
│   │   └── submissions/
│   │       └── route.ts
│   ├── auth/
│   │   ├── signin/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── competitions/
│   │   └── [id]/
│   │       └── page.tsx
│   ├── judge/
│   │   └── page.tsx
│   ├── my-submissions/
│   │   └── page.tsx
│   ├── sponsor/
│   │   ├── page.tsx
│   │   └── competitions/
│   │       └── [id]/page.tsx
│   ├── submit/
│   │   └── [competitionId]/
│   │       └── page.tsx
│   ├── leaderboard/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── auth/
│   │   └── auth-provider.tsx
│   ├── competitions/
│   │   └── competition-card.tsx
│   ├── judge/
│   │   └── submission-review-card.tsx
│   ├── layout/
│   │   └── header.tsx
│   ├── submissions/
│   │   └── submission-form.tsx
│   └── ui/
│       └── [shadcn components]
├── lib/
│   ├── auth.ts
│   ├── mock-data.ts
│   ├── utils.ts
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── middleware.ts
└── package.json
\`\`\`

## Pages Overview

### Public Pages
- **/** - Homepage with hero section, features, and competition listings
- **/competitions/[id]** - Detailed competition view with challenges and stats
- **/leaderboard** - Global leaderboard showing top performers
- **/auth/signin** - Sign in page
- **/auth/signup** - Sign up page

### Builder Pages (Auth Required)
- **/my-submissions** - View all personal submissions with status
- **/submit/[competitionId]** - Submit entry for a competition

### Judge Pages (Auth Required)
- **/judge** - Judge console with submission review interface

### Sponsor Pages (Auth Required)
- **/sponsor** - Sponsor dashboard with competition analytics
- **/sponsor/competitions/[id]** - Detailed competition analytics

## Current Status

### Frontend Complete ✅
All UI components and pages are fully implemented with mock data for preview purposes.

### Database Integration Pending ⏳
The application is currently using mock data from `lib/mock-data.ts`. To integrate with your Supabase database:

1. **Set Environment Variables**:
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
   \`\`\`

2. **Enable Middleware**:
   Uncomment the Supabase client code in `middleware.ts`

3. **Update Pages**:
   Replace mock data imports with actual Supabase queries in:
   - `app/page.tsx`
   - `app/competitions/[id]/page.tsx`
   - `app/leaderboard/page.tsx`
   - `app/my-submissions/page.tsx`
   - `app/judge/page.tsx`
   - `app/sponsor/page.tsx`
   - `app/sponsor/competitions/[id]/page.tsx`
   - `app/submit/[competitionId]/page.tsx`

4. **Database Schema**:
   Required tables:
   - `users` (id, email, name, role, total_points, organization_id)
   - `organizations` (id, name)
   - `competitions` (id, title, description, status, start_date, end_date, prize_pool, sponsor_id)
   - `challenges` (id, competition_id, title, description, points)
   - `submissions` (id, user_id, competition_id, challenge_id, status, score, feedback, github_url, demo_url, submitted_at, reviewed_at)

## Getting Started

### Installation

\`\`\`bash
# Install dependencies
npm install
# or
pnpm install
# or
yarn install
\`\`\`

### Development

\`\`\`bash
# Run development server
npm run dev
# or
pnpm dev
# or
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production

\`\`\`bash
# Build the application
npm run build

# Start production server
npm start
\`\`\`

## Key Components

### Header Component
- Responsive navigation with mobile support
- Role-based menu items
- User authentication state
- Dropdown menu for user actions

### Competition Card
- Status badges (active, upcoming, completed)
- Prize pool display
- Participant count
- Date information
- Hover effects and transitions

### Submission Form
- GitHub URL validation
- Demo URL (optional)
- Rich text description
- Challenge selection
- Form validation

### Judge Review Card
- Submission details display
- Inline review dialog
- Score input (0-100)
- Feedback textarea
- Status update actions

## Authentication Roles

- **builder**: Can submit entries and view personal submissions
- **judge**: Can review and score submissions
- **sponsor**: Can view sponsored competition analytics
- **admin**: Full access to all features

## Mock Data

The application currently uses mock data for demonstration:
- 4 sample competitions (active, upcoming, completed)
- 5 leaderboard entries
- 3 sample submissions
- Mock users for each role

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
\`\`\`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Accessibility

- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- High contrast colors
- Focus indicators

## Performance

- Server-side rendering with Next.js
- Optimized images
- Code splitting
- Lazy loading
- Minimal bundle size

## Future Enhancements

- Real-time submission updates
- Email notifications
- Advanced filtering and search
- Competition categories
- Team competitions
- Achievement badges
- Social sharing
- API documentation
- Admin panel for competition management

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues or questions, please open an issue on GitHub or contact the development team.

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS
