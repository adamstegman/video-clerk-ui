# Video Clerk Features Documentation

This directory contains comprehensive feature specifications for Video Clerk. Each document describes a major feature area, including requirements, design decisions, implementation details, and future enhancements.

## Purpose

These specifications serve multiple purposes:

1. **Historical Record**: Document why features were built the way they were
2. **Onboarding**: Help new developers (human or AI) understand the system
3. **Decision Log**: Capture architectural decisions and trade-offs
4. **Future Planning**: Identify enhancement opportunities
5. **Reference**: Quick lookup for implementation details

## Feature Index

### Core Features

1. **[TMDB Search Integration](001-tmdb-search-integration.md)** - Search for movies and TV shows using The Movie Database API
   - Multi-search endpoint
   - Image configuration
   - Genre mapping
   - Debounced search

2. **[Add to List](002-add-to-list.md)** - Save TMDB search results to personal watchlist
   - Save operation flow
   - Runtime fetching
   - Duplicate prevention
   - RPC function implementation

3. **[List View](003-list-view.md)** - Display saved entries in organized list
   - Watched/unwatched sections
   - Compact list layout
   - Sort by date added
   - Floating action button

4. **[Edit Entry](004-edit-entry.md)** - Manage saved entries
   - Mark as watched
   - Tag management
   - Custom tag creation
   - Delete entry
   - Component decomposition

5. **[Watch Page (Card Swiping)](005-watch-page-card-swiping.md)** - Interactive decision-making interface
   - Tinder-style card swiping
   - Like/nope gestures
   - Adaptive like goal
   - Picker mode
   - Winner selection
   - Touch and pointer event handling

### Infrastructure Features

6. **[Group Sharing](006-group-sharing.md)** - Multi-user collaboration
   - Group ownership model
   - Invitation system
   - Group membership management
   - Data scoping
   - RLS policies

7. **[Authentication](007-authentication.md)** - User authentication and session management
   - Supabase Auth integration
   - Email/password authentication
   - Email confirmation
   - Password reset
   - Protected routes
   - Composable auth components

8. **[Mobile-First & PWA](008-mobile-first-pwa.md)** - Progressive Web App features
   - Safe area insets
   - Viewport height handling
   - PWA manifest
   - Home screen installation
   - Touch-friendly interactions
   - Responsive design

## Document Structure

Each feature specification follows a consistent structure:

### Header
- **Status**: Implementation status (Implemented, In Progress, Planned)
- **Date**: When feature was implemented or planned
- **Related PRs**: GitHub pull request references

### Sections
1. **Overview**: Brief summary of the feature
2. **Problem Statement**: What problem does this solve?
3. **Requirements**: Functional and non-functional requirements
4. **Design Decisions**: Key decisions with alternatives and rationale
5. **Implementation Details**: Technical implementation specifics
6. **Testing Strategy**: How the feature is tested
7. **Dependencies**: External dependencies and integrations
8. **Future Enhancements**: Potential improvements and extensions
9. **Notes**: Additional context and edge cases

## Reading Guide

### For New Developers
Start with these features to understand the core application flow:
1. Authentication (007) - How users access the app
2. TMDB Search (001) + Add to List (002) - Content discovery flow
3. List View (003) - Primary content management
4. Watch Page (005) - Core decision-making feature

### For Feature Development
When adding a new feature:
1. Review related existing features for patterns
2. Note design decisions and their rationale
3. Follow established architectural patterns
4. Update relevant specs with new decisions

### For Architecture Understanding
To understand system architecture:
1. Authentication (007) - Auth flow and protected routes
2. Group Sharing (006) - Data model and multi-user architecture
3. Mobile-First & PWA (008) - Platform and UX considerations

### For API Integration
For external API integration patterns:
1. TMDB Search (001) - API client architecture
2. Add to List (002) - RPC function pattern for complex operations

## How Features Were Documented

These specifications were created by:
1. Analyzing git commit history and PR descriptions
2. Reading implementation code and tests
3. Identifying key decision points and alternatives
4. Documenting actual implementation details
5. Capturing future enhancement opportunities

The specs are written "as if planned ahead of time" to provide clear, structured documentation, even though many decisions were made iteratively during development.

## Design Decision Framework

Each feature uses a consistent framework for documenting decisions:

**Format**:
```
### Decision N: [Decision Name]

**Options Considered**:
- A) [Option description]
- B) [Option description]
- C) [Option description]

**Decision**: Option B - [Chosen option]

**Rationale**:
- [Reason 1]
- [Reason 2]
- [Reason 3]
```

This format ensures:
- **Transparency**: Why was this chosen over alternatives?
- **Reversibility**: Enough context to reconsider later
- **Learning**: Understand trade-offs for similar decisions
- **Onboarding**: New developers understand the "why"

## Common Patterns

Several patterns appear across multiple features:

### Architecture Patterns
- **Container/Presenter**: Separation of data fetching and UI
- **RPC Functions**: Complex database operations encapsulated in stored procedures
- **Row-Level Security**: Database-level authorization
- **Composable Components**: Small, focused, reusable components

### Data Patterns
- **Group Scoping**: Most data is scoped to user's group
- **Optimistic Updates**: Update UI before server confirmation
- **Normalization**: Handle Supabase single object vs array inconsistencies

### UX Patterns
- **Loading States**: Show spinners during async operations
- **Error States**: Display clear error messages with retry options
- **Empty States**: Guide users when no data exists
- **Mobile-First**: Design for mobile, enhance for desktop

## Maintenance

### Keeping Specs Current
- Update specs when implementation changes significantly
- Document new design decisions as they're made
- Add to "Future Enhancements" when ideas emerge
- Reference related PRs for traceability

### When to Create New Specs
Create a new feature spec when:
- Adding a major new feature area
- Significant architectural change
- New external integration
- Complex user flow implementation

## Related Documentation

- **[CLAUDE.md](../CLAUDE.md)**: AI assistant guide with codebase overview, conventions, and common tasks
- **[README.md](../README.md)**: Project setup and development guide
- **[/supabase/schemas/](../supabase/schemas/)**: Database schema definitions
- **Code comments**: Implementation-level documentation

## Questions?

If you're looking for information not covered here:
1. Check the main CLAUDE.md for general development guidance
2. Review the specific feature spec for detailed decisions
3. Read the implementation code and tests
4. Check git history for context on specific changes
5. Ask in GitHub issues or discussions

---

**Last Updated**: 2026-01-25
