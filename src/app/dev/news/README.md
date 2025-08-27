# News Manager Developer Tool

A developer tool for easily editing the "Latest Updates" section on the home page.

## Access

Visit: `/dev/news`

## Features

- ✅ **Add/Edit/Delete Updates**: Full CRUD functionality
- ✅ **Live Preview**: See how updates will look on the homepage
- ✅ **Export Data**: Export updates as JSON
- ✅ **Copy Code**: Generate TypeScript code for `src/lib/updates.ts`
- ✅ **Category Management**: Pre-defined categories for consistency
- ✅ **Homepage Preview**: Shows which updates appear on homepage (top 6)

## Installation

You need to install the Radix Select dependency:

```bash
npm install @radix-ui/react-select
```

## Usage

1. **Navigate to `/dev/news`**
2. **Add/Edit Updates**: Use the form on the left to create or modify updates
3. **Preview Mode**: Toggle preview to see how it looks on homepage
4. **Export**: Click "Export JSON" to save your updates
5. **Update Code**: Click "Copy Code" to get the TypeScript code
6. **Replace updates.ts**: Paste the code into `src/lib/updates.ts`

## Categories

- Product Launch
- Feature Update
- Security
- Developer
- Mobile
- Collaboration
- Data
- Performance
- Bug Fix
- Maintenance

## Fields

- **Title**: Update headline (required)
- **Summary**: Brief description (required) 
- **Category**: Type of update
- **Date**: Publication date (required)
- **Link**: URL for more details (optional)

## Homepage Display

Only the first 6 updates are shown on the homepage. Updates are ordered by creation order in the tool.