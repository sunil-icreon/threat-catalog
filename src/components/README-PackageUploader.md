# PackageUploader Component

A comprehensive React component for analyzing package configuration files from various ecosystems. Users can upload files or paste content directly to extract package dependencies and project information.

## Features

- **Multi-format Support**: Supports package.json, package-lock.json, pom.xml, build.gradle, .csproj, and packages.config
- **Dual Input Methods**: File upload and text area paste options
- **Ecosystem Detection**: Automatically detects the package ecosystem (npm, maven, gradle, nuget)
- **Project Information Extraction**: Extracts project name, version, and dependency list
- **Modern UI**: Built with React Bootstrap for responsive design
- **Error Handling**: Comprehensive error handling with user-friendly messages

## Supported File Formats

### JavaScript/Node.js
- `package.json` - NPM package configuration
- `package-lock.json` - NPM lock file

### Java
- `pom.xml` - Maven project configuration
- `build.gradle` - Gradle build configuration

### .NET
- `.csproj` - .NET Core/5+ project files
- `packages.config` - Legacy NuGet configuration

## Usage

### Basic Usage

```tsx
import PackageUploader from '@/components/PackageUploader';

function MyComponent() {
  const handleProjectAnalyzed = (projectInfo) => {
    console.log('Project analyzed:', projectInfo);
  };

  const handleError = (error) => {
    console.error('Analysis error:', error);
  };

  return (
    <PackageUploader
      onProjectAnalyzed={handleProjectAnalyzed}
      onError={handleError}
    />
  );
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onProjectAnalyzed` | `(projectInfo: ProjectInfo) => void` | No | Callback fired when project analysis is complete |
| `onError` | `(error: string) => void` | No | Callback fired when an error occurs during analysis |

### ProjectInfo Interface

```typescript
interface ProjectInfo {
  name: string;           // Project name
  version: string;        // Project version
  ecosystem: string;      // Package ecosystem (npm, maven, gradle, nuget)
  packages: PackageInfo[]; // Array of package dependencies
}

interface PackageInfo {
  name: string;           // Package name
  version: string;        // Package version
  ecosystem: string;      // Package ecosystem
}
```

## Component Structure

The component is organized into two main tabs:

### 1. Upload File Tab
- File input with drag-and-drop support
- Accepts multiple file formats
- Automatic analysis on file selection

### 2. Paste Content Tab
- Large text area for pasting file content
- Manual analysis trigger
- Support for all supported formats

## Analysis Results

When analysis is complete, the component displays:

- **Project Information**: Name, version, ecosystem
- **Package Dependencies**: Complete list with versions
- **Export Options**: Download results as JSON
- **Reset Functionality**: Clear and start over

## Error Handling

The component handles various error scenarios:

- Invalid file formats
- Malformed JSON/XML content
- Unsupported ecosystems
- Network errors (for future API integration)

## Styling

The component uses Bootstrap classes and custom CSS for:

- Responsive design
- Modern card-based layout
- Loading states and animations
- Error and success states
- Mobile-friendly interface

## Examples

### Example 1: Basic Integration

```tsx
import React, { useState } from 'react';
import PackageUploader, { ProjectInfo } from '@/components/PackageUploader';

function App() {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);

  const handleProjectAnalyzed = (project: ProjectInfo) => {
    setProjects(prev => [...prev, project]);
  };

  return (
    <div>
      <h1>Package Analyzer</h1>
      <PackageUploader onProjectAnalyzed={handleProjectAnalyzed} />
      
      {projects.length > 0 && (
        <div>
          <h2>Analyzed Projects</h2>
          {projects.map((project, index) => (
            <div key={index}>
              <h3>{project.name} ({project.ecosystem})</h3>
              <p>Version: {project.version}</p>
              <p>Dependencies: {project.packages.length}</p>
            </div>
          )))}
        </div>
      )}
    </div>
  );
}
```

### Example 2: With Error Handling

```tsx
import React, { useState } from 'react';
import { Alert } from 'react-bootstrap';
import PackageUploader from '@/components/PackageUploader';

function App() {
  const [error, setError] = useState<string>('');

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div>
      <PackageUploader onError={handleError} />
      
      {error && (
        <Alert variant="danger">
          <strong>Error:</strong> {error}
        </Alert>
      )}
    </div>
  );
}
```

## Future Enhancements

- API integration for vulnerability scanning
- Batch file processing
- Export to various formats (CSV, JSON, XML)
- Integration with security databases
- Real-time vulnerability checking
- Package update recommendations

