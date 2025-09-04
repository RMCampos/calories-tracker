# 🍽️ Calories Tracker

A modern, responsive web application for tracking daily food intake, calories, and nutritional information. Built with TypeScript, Vite, and Appwrite for a seamless food logging experience.

![Calories Tracker](https://img.shields.io/badge/status-active-brightgreen) ![Version](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-ISC-orange)

## ✨ Features

### 🔐 User Authentication
- **User Registration & Login**: Secure authentication powered by Appwrite
- **Session Management**: Persistent login sessions with automatic logout
- **User Profiles**: Personalized experience for each user

### 🍎 Food Tracking
- **Smart Food Search**: Real-time search through comprehensive food database
- **Nutritional Information**: Track calories, protein, fat, carbs, and fiber
- **Custom Portions**: Add foods with custom gram amounts
- **Food Categories**: Organized by food types (proteins, carbs, fats, dairy, etc.)
- **Alkaline Tracking**: Monitor alkaline vs acidic food balance

### 📊 Nutrition Goals
- **Personalized Goals**: Set daily targets for calories and macronutrients
- **Progress Tracking**: Visual progress indicators for daily goals
- **Goal Management**: Update and modify nutritional goals anytime

### 🗓️ Calendar View
- **Date Selection**: Navigate through different dates
- **Daily Overview**: View food entries for any selected date
- **Monthly Navigation**: Browse through months to track progress

### ⚡ User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Instant feedback and live nutritional calculations
- **Keyboard Navigation**: Full keyboard support for power users
- **Food Editing**: Edit or delete previously logged food entries

## 🛠️ Technologies Used

### Frontend
- **TypeScript**: Type-safe JavaScript for better development experience
- **Vite**: Fast build tool and development server
- **HTML5 & CSS3**: Modern web standards for UI/UX
- **SweetAlert**: Beautiful and responsive popup alerts

### Backend & Database
- **Appwrite**: Backend-as-a-Service for authentication and database
  - User authentication and session management
  - Document database for food entries and user settings
  - Real-time data synchronization

### Development Tools
- **NPM**: Package management
- **Git**: Version control

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- NPM or Yarn package manager
- Appwrite server instance (cloud or self-hosted)

### Environment Variables
Create a `.env` file in the root directory with:
```env
VITE_APPWRITE_ENDPOINT=your_appwrite_endpoint
VITE_APPWRITE_DBID=your_database_id
VITE_APPWRITE_FOODENTRIESID=your_food_entries_collection_id
VITE_APPWRITE_USERSETTINGSID=your_user_settings_collection_id
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/calories-tracker.git
   cd calories-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Configure your Appwrite credentials

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Navigate to `http://localhost:5173`

### Building for Production

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

## 📁 Project Structure

```
calories-tracker/
├── src/
│   ├── index.ts           # Main application entry point
│   ├── types.ts           # TypeScript type definitions
│   ├── appwrite.ts        # Appwrite client and database functions
│   ├── foodDatabase.ts    # Local food database
│   └── HtmlUtil.ts        # DOM utility functions
├── assets/
│   └── manifest.json      # PWA manifest
├── vite.config.js         # Vite configuration
├── package.json           # Project dependencies and scripts
└── README.md              # Project documentation
```

## 🍎 Food Database

The application includes a comprehensive local food database featuring:
- **Categories**: Proteins, carbs (high/low), fats, dairy, fruits, leaves
- **Nutritional Data**: Calories, protein, fat, carbs, fiber per 100g
- **Alkaline Classification**: Foods marked as alkaline or acidic
- **Search Functionality**: Name and category-based search with accent support

## 🎯 Core Functionality

### Authentication Flow
1. User registers or logs in through Appwrite
2. Session management maintains login state
3. All food entries are tied to authenticated users

### Food Entry Process
1. Search for food items in real-time
2. Select desired food from search results
3. Enter custom portion size (grams)
4. Preview nutritional information
5. Add to daily food log

### Data Management
- **Food Entries**: Stored with date, time, and user association
- **User Settings**: Personalized nutritional goals
- **Real-time Sync**: All data synchronized with Appwrite backend

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full-featured interface with keyboard shortcuts
- **Tablet**: Touch-optimized controls and layouts
- **Mobile**: Streamlined mobile experience

## 🔒 Security & Privacy

- **Secure Authentication**: Appwrite handles all authentication securely
- **Data Privacy**: User data is isolated and protected
- **Session Management**: Automatic logout and session validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🎯 Future Enhancements

- **Barcode Scanning**: Add foods by scanning barcodes
- **Meal Planning**: Plan meals in advance
- **Export Data**: Export nutritional data to CSV/PDF
- **Social Features**: Share progress with friends
- **Recipe Database**: Create and track custom recipes
- **Weight Tracking**: Monitor weight alongside nutrition

---

Built with ❤️ for healthy living and mindful eating.
