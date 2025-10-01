# Vulnerability Dashboard

A modern, production-ready Next.js dashboard for monitoring security vulnerabilities across multiple package ecosystems including NPM, Maven, and NuGet.

## 🚀 Features

- **Multi-Ecosystem Support**: Monitor vulnerabilities from NPM, Maven, and NuGet packages
- **Real-time Dashboard**: View vulnerability statistics and trends
- **Advanced Filtering**: Filter by ecosystem, severity, status, and search terms
- **Cache Management**: API endpoints to refresh vulnerability data with intelligent caching
- **Performance Monitoring**: Built-in Core Web Vitals tracking and performance analytics
- **Error Handling**: Comprehensive error boundaries and global error handling
- **Security**: Production-ready security headers and CSP configuration
- **Responsive Design**: Modern Bootstrap UI that works on desktop and mobile
- **TypeScript**: Full type safety throughout the application
- **Production Ready**: Docker support, health checks, and deployment configurations

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Bootstrap 5 + React Bootstrap
- **Icons**: Bootstrap Icons
- **HTTP Client**: Axios
- **Performance**: Built-in analytics and monitoring
- **Deployment**: Docker + Docker Compose

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (optional, for containerized deployment)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vul_dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
# Edit .env.local with your configuration
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run analyze` - Analyze bundle size
- `npm run build:production` - Build with production optimizations

## API Endpoints

### GET /api/vulnerabilities
Retrieve a paginated list of vulnerabilities with optional filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `ecosystem` (string): Filter by ecosystem (npm, maven, nuget)
- `severity` (string): Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)
- `status` (string): Filter by status (ACTIVE, RESOLVED, MITIGATED)
- `search` (string): Search in title, description, package name, or CVE ID

**Example:**
```
GET /api/vulnerabilities?ecosystem=npm&severity=HIGH&page=1&limit=10
```

### POST /api/cache
Refresh the vulnerability cache with latest data.

**Response:**
```json
{
  "message": "Cache refreshed successfully",
  "cacheInfo": {
    "lastUpdate": "2023-12-01T10:00:00Z",
    "totalVulnerabilities": 150
  }
}
```

### GET /api/cache
Get cache information and statistics.

**Response:**
```json
{
  "cacheInfo": {
    "lastUpdate": "2023-12-01T10:00:00Z",
    "totalVulnerabilities": 150
  },
  "ecosystemStats": {
    "npm": 75,
    "maven": 50,
    "nuget": 25
  },
  "severityStats": {
    "CRITICAL": 10,
    "HIGH": 30,
    "MEDIUM": 80,
    "LOW": 30
  }
}
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── vulnerabilities/
│   │   │   └── route.ts          # Vulnerabilities API endpoint
│   │   └── cache/
│   │       └── route.ts          # Cache management API
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Dashboard page
├── components/
│   ├── VulnerabilityCard.tsx     # Individual vulnerability card
│   ├── VulnerabilityFilters.tsx  # Filtering component
│   └── StatsCards.tsx            # Statistics display
├── lib/
│   └── vulnerabilityService.ts   # Vulnerability data service
└── types/
    └── vulnerability.ts          # TypeScript type definitions
```

## Data Model

### Vulnerability
```typescript
interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ecosystem: 'npm' | 'maven' | 'nuget';
  packageName: string;
  packageVersion: string;
  cveId?: string;
  publishedDate: string;
  lastModified: string;
  affectedVersions: string[];
  references: string[];
  cvssScore?: number;
  status: 'ACTIVE' | 'RESOLVED' | 'MITIGATED';
}
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Ecosystems

To add support for a new package ecosystem:

1. Update the `ecosystem` type in `src/types/vulnerability.ts`
2. Add ecosystem colors in `src/components/VulnerabilityCard.tsx`
3. Update the filter options in `src/components/VulnerabilityFilters.tsx`
4. Extend the `VulnerabilityService` to fetch data from the new ecosystem

### Customizing the UI

The dashboard uses Tailwind CSS for styling. Key customization points:

- Colors: Update the color scheme in `tailwind.config.ts`
- Components: Modify individual components in `src/components/`
- Layout: Update the main dashboard layout in `src/app/page.tsx`

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. Build and start the application:
```bash
docker-compose up --build
```

2. The application will be available at `http://localhost:3000`

### Using Docker directly

1. Build the Docker image:
```bash
docker build -t vul-dashboard .
```

2. Run the container:
```bash
docker run -p 3000:3000 vul-dashboard
```

## 🚀 Production Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Production Build

1. Build the application:
```bash
npm run build:production
```

2. Start the production server:
```bash
npm run start:production
```

## 🔧 Performance Optimizations

### Built-in Optimizations

- **Bundle Splitting**: Automatic code splitting for optimal loading
- **Image Optimization**: Next.js Image component with WebP/AVIF support
- **Caching**: Intelligent API caching with ETags and conditional requests
- **Compression**: Gzip compression enabled
- **Security Headers**: Comprehensive security headers and CSP
- **Core Web Vitals**: Built-in performance monitoring

### Performance Monitoring

The application includes a built-in performance monitor that tracks:
- **LCP (Largest Contentful Paint)**: Loading performance
- **FID (First Input Delay)**: Interactivity
- **CLS (Cumulative Layout Shift)**: Visual stability

Access the performance monitor via the floating button in the bottom-right corner.

## 🔒 Security Features

- **Content Security Policy (CSP)**: Prevents XSS attacks
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **HTTPS Enforcement**: Strict Transport Security headers
- **Input Validation**: Type-safe API endpoints
- **Error Handling**: Secure error messages in production

## 📊 Monitoring & Analytics

### Health Checks

- **Health Endpoint**: `/api/health` - Application health status
- **Performance Metrics**: Built-in Core Web Vitals tracking
- **Error Tracking**: Comprehensive error boundaries and logging

### Analytics Integration

The application is ready for integration with:
- Google Analytics
- Sentry (error tracking)
- Custom analytics services

Configure in your `.env.local` file.

## 🧪 Development

### Bundle Analysis

Analyze your bundle size:
```bash
npm run analyze
```

This will generate a detailed bundle analysis report.

### Type Checking

Run TypeScript type checking:
```bash
npm run type-check
```

### Linting

Run ESLint:
```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
