# Choice Legacy Theme

A modern, feature-rich Shopify theme designed for optimal user experience and merchant customization.

## Technology Stack

- **Frontend**
  - Liquid (Shopify templating language)
  - JavaScript (ES6+)
  - CSS3
  - HTML5
- **Build Tools**
  - Shopify CLI 3.x
  - Node.js (for local development)
- **Version Control**
  - Git

## Pre-requisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Shopify CLI 3.x
- Shopify Partner account
- Git

## Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/BrainStation-23/choice-legacy-theme
   cd choice-legacy-theme
   ```

2. **Install Shopify CLI**

   ```bash
   npm install -g @shopify/cli @shopify/theme
   ```

3. **Authentication**

   ```bash
   shopify auth login --store your-store-name.myshopify.com
   ```

4. **Development Commands**

   ```bash
   # Start development server
   shopify theme dev

   # Deploy theme
   shopify theme push

   # Pull theme changes
   shopify theme pull

   # List themes
   shopify theme list
   ```

## Project Structure

```
choice-legacy-theme/
├── assets/           # Static files (JS, CSS, images)
├── config/           # Theme settings and configurations
├── layout/          # Main theme templates
├── locales/         # Translation files
├── sections/        # Modular, reusable page sections
├── snippets/        # Reusable code fragments
└── templates/       # Page templates
    └── customers/   # Customer account templates
```

## Architecture

- **Templates**: Define page structure and layout
- **Sections**: Modular, customizable components
- **Snippets**: Reusable code blocks for DRY principle
- **Assets**: Client-side resources organized by functionality
- **Config**: Centralized theme settings and configurations

## Coding Standards

### JavaScript

- Use ES6+ features
- Follow meaningful naming conventions
- Implement error handling
- Use async/await for asynchronous operations

### CSS

- Follow BEM methodology
- Use CSS custom properties for theming
- Maintain mobile-first approach
- Organize by components

### Liquid

- Keep logic minimal
- Use snippets for reusability
- Follow Shopify's best practices

## Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Proper error handling implemented
- [ ] Mobile responsiveness verified
- [ ] Performance impact considered
- [ ] Browser compatibility checked
- [ ] Accessibility standards met
- [ ] Documentation updated
- [ ] No console errors
- [ ] Theme editor settings working

## Git Workflow

### Branching Strategy

```
main
├── develop
│   ├── feature/*
│   ├── bugfix/*
│   └── hotfix/*
└── release/*
```

### Branch Naming Convention

```
feature#TASK-123-brief-description
bugfix#TASK-124-bug-description
hotfix#TASK-125-critical-fix
release#v1.2.3
```

### Commit Guidelines

- Use conventional commits
- Format: `type(scope): description`
- Types: feat, fix, docs, style, refactor, test, chore

## Deployment Guidelines

1. **Development**

   - Work on feature branches
   - Test locally using `shopify theme dev`
   - Push to development theme

2. **Staging**

   - Merge to develop branch
   - Deploy to staging theme
   - Perform QA testing

3. **Production**

   - Create release branch
   - Final QA approval
   - Deploy to production theme

   ```bash
   shopify theme push -t production
   ```

4. **Post-deployment**
   - Monitor for issues
   - Update documentation
   - Tag release version

## Support

For issues and feature requests, please use the GitHub issue tracker or contact the development team.
