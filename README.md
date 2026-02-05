# VyOS Web UI

A modern web interface for managing VyOS network operating system configurations.

## Project Structure

```
vyos-webui/
├── src/
│   ├── components/          # Reusable UI components
│   ├── services/            # API and service implementations
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── assets/              # Images, icons, styles
│   └── views/               # Page-level components
├── public/
│   └── index.html           # Main HTML template
├── docs/                    # Project documentation
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## Authentication System

The VyOS Web UI includes a complete authentication system with:
- User login and registration
- Role-based access control (RBAC)
- Session management with automatic timeout
- Protected routes
- Secure token handling

For more information, see [Authentication System Documentation](docs/authentication-system.md)

## Getting Started

### Prerequisites

- Node.js 16+ LTS
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This will start the development server at http://localhost:3000

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## Features

- Modern React-based UI
- Responsive design
- TypeScript type safety
- Component-based architecture
- API integration with VyOS
- Complete authentication system

## Architecture

The application follows a clean architecture pattern:
1. **Presentation Layer**: React components and UI logic
2. **Application Layer**: Business logic and service orchestration
3. **Infrastructure Layer**: API client and external integrations

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.