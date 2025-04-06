# easyFlags 🚩

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://abadheshkmr.github.io/easyflags/)
[![Version](https://img.shields.io/badge/version-1.0.0-green)](https://github.com/abadheshkmr/easyflags/releases)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> A high-performance, multi-tenant feature flag service built with NestJS, designed for sub-10ms evaluation times and enterprise-grade reliability.

<p align="center">
  <img src="docs/assets/architecture-banner.png" alt="easyFlags Architecture" width="800">
</p>

## ✨ Features

- **🚀 High Performance**: Sub-10ms evaluation times through optimized caching and evaluation strategies
- **🏢 Multi-Tenant Support**: Isolated data and configuration per tenant with comprehensive permission system
- **⚡ Real-time Updates**: WebSocket-based flag updates for instant propagation
- **🎯 Advanced Targeting**: Complex rule-based targeting with multiple conditions
- **📝 Version Control**: Track and manage flag changes with versioning
- **📊 Audit Trail**: Comprehensive audit logging for all flag changes
- **🔒 Enterprise Security**: Role-based access control with fine-grained permissions
- **☁️ Deployment Options**: Self-hosted or managed service (coming soon)

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/abadheshkmr/easyflags.git
cd easyflags

# Start with Docker Compose
docker-compose up -d
```

Once running, access the admin UI at http://localhost:3000

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/abadheshkmr/easyflags.git
cd easyflags

# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the development server
yarn workspace @feature-flag-service/server start:dev
```

## 📚 Documentation

Comprehensive documentation is available at:
- [easyFlags Documentation](https://abadheshkmr.github.io/easyflags/)

### Key Documentation Sections:
- [Getting Started Guide](https://abadheshkmr.github.io/easyflags/getting-started/)
- [API Reference](https://abadheshkmr.github.io/easyflags/api/)
- [SDK Integration](https://abadheshkmr.github.io/easyflags/sdk/)
- [System Architecture](https://abadheshkmr.github.io/easyflags/architecture/)
- [Permission System](https://abadheshkmr.github.io/easyflags/api/permissions/)

## 🧩 SDK Integration Examples

### JavaScript/TypeScript

```typescript
import { EasyFlags } from '@easyflags/js-sdk';

const client = new EasyFlags({
  apiKey: 'your-api-key',
  defaultValues: { 'new-feature': false }
});

// Check if a flag is enabled
const isEnabled = await client.isEnabled('new-feature', {
  userId: '123',
  attributes: { role: 'premium', country: 'US' }
});

if (isEnabled) {
  // Show the new feature
}
```

### React

```tsx
import { EasyFlagsProvider, useFeatureFlag } from '@easyflags/react-sdk';

function App() {
  return (
    <EasyFlagsProvider 
      apiKey="your-api-key"
      defaultValues={{ 'new-ui': false }}
    >
      <MyComponent />
    </EasyFlagsProvider>
  );
}

function MyComponent() {
  // The component will automatically re-render when the flag value changes
  const isNewUIEnabled = useFeatureFlag('new-ui');
  
  return isNewUIEnabled ? <NewUI /> : <CurrentUI />;
}
```

### Node.js

```javascript
const { EasyFlags } = require('@easyflags/node-sdk');

const client = new EasyFlags({
  apiKey: 'your-api-key',
  refreshInterval: 30, // seconds
});

async function handleRequest(req, res) {
  // Evaluate a flag with user context
  const isPremiumEnabled = await client.isEnabled('premium-feature', {
    userId: req.user.id,
    attributes: {
      role: req.user.role,
      plan: req.user.subscription.plan,
      region: req.geoip.country
    }
  });
  
  if (isPremiumEnabled) {
    return res.json({ features: premiumFeatures });
  }
  
  return res.json({ features: standardFeatures });
}
```

## 🏗️ Project Structure

```
easyflags/                          # Main service repository
├── packages/
│   ├── server/                     # Backend service
│   │   ├── src/
│   │   │   ├── auth/               # Authentication & permissions
│   │   │   ├── core/               # Feature flag core logic
│   │   │   ├── admin/              # Admin functionality
│   │   │   └── evaluation/         # Flag evaluation engine
│   ├── admin-ui/                   # Admin web interface (React)
│   ├── sdk-js/                     # JavaScript SDK
│   ├── sdk-node/                   # Node.js SDK
│   ├── sdk-react/                  # React SDK
│   └── common/                     # Shared types and utilities
├── docs/                           # Documentation (MkDocs)
├── docker/                         # Docker configuration
└── scripts/                        # Utility scripts
```

## 🔧 Configuration Options

easyFlags can be configured through environment variables or a configuration file:

| Option | Description | Default |
|--------|-------------|---------|
| `PORT` | Server port | `3000` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `DB_NAME` | Database name | `easyflags` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for JWT tokens | - |
| `LOG_LEVEL` | Logging level | `info` |

## 🔐 Security Features

- **Role-Based Access Control**: Fine-grained permissions for different user types
- **API Key Management**: Secure API key generation and rotation
- **Tenant Isolation**: Data isolation between tenants
- **Audit Logging**: Track all changes for compliance and security

## 🌐 Deployment Options

### Kubernetes

1. Configure your Kubernetes manifests in the `k8s/` directory
2. Deploy using `kubectl`:
```bash
kubectl apply -f k8s/
```

### AWS

Deployment templates for AWS ECS and EKS are available in the `deployments/aws/` directory.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 