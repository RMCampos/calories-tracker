# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Setup

Requires environment variables in `.env`:
- `VITE_APPWRITE_ENDPOINT` - Appwrite server endpoint
- `VITE_APPWRITE_DBID` - Database ID
- `VITE_APPWRITE_FOODENTRIESID` - Food entries collection ID
- `VITE_APPWRITE_USERSETTINGSID` - User settings collection ID
- `VITE_APPWRITE_MONTLYCALORIESID` - Monthly calories collection ID

## Architecture Overview

This is a TypeScript/Vite-based calories tracking application with Appwrite backend integration. Key architectural patterns:

### Core Structure
- **Entry Point**: `src/index.ts` - Main application logic and DOM manipulation
- **State Management**: `src/state.ts` - Centralized application state
- **Backend Integration**: `src/appwrite.ts` - Appwrite client and database operations
- **Type Definitions**: `src/types.ts` - TypeScript interfaces for data models

### Data Flow
- User authentication managed through `AppwriteAuth` class
- Food entries stored via `AppwriteDB` class with real-time Appwrite sync
- Local food database in `src/foodDatabase.ts` for searching
- Calendar view tracks daily calorie totals separately from individual entries

### Key Components
- **Authentication**: Login/register forms with session management
- **Food Search**: Real-time search with keyboard navigation and debouncing
- **Food Entry**: Add/edit/delete food items with nutritional calculations
- **Calendar**: Monthly calendar view with daily calorie totals
- **Settings**: User-configurable nutritional goals

### State Management Patterns
- Global app state in `appState` object
- Date-based data loading (selectedDate/currentViewDate)
- Monthly calorie aggregation separate from individual food entries
- Real-time UI updates after database operations

### DOM Manipulation
- Utility functions in `src/DomUtils.ts` for type-safe DOM access
- Event listeners centralized in `setupEventListeners()`
- Dynamic card creation for food entries with collapsible details

### Backend Integration
- All data operations use Appwrite SDK
- User-scoped queries with proper authentication
- Concurrent operations for bulk deletions
- Timezone-aware date handling for cross-timezone consistency

## Code Patterns

### Data Calculations
- All nutrition values calculated from 100g base values in food database
- Proportional scaling based on user-entered grams
- Real-time preview updates during food entry

### Error Handling
- Try-catch blocks with user-friendly SweetAlert notifications
- Loading states during async operations
- Graceful fallbacks for missing data

### Event Management
- Event listener cleanup and re-attachment for dynamic content
- Keyboard navigation support (arrows, enter, escape)
- Click-outside handlers for dropdowns and modals