# CitySync - Smart City Collaborative Dashboard

## Overview
CitySync is a web-based Smart City Collaborative Dashboard (SCCD) designed to enable municipal authorities, various city departments, and citizens to interact and collaborate in real time. This platform acts as a central hub for monitoring, reporting, decision-making, and analytics related to city operations, with an added focus on Augmented Reality (AR) concepts to enhance user interaction and data accuracy.

## Goal
To build a feature-rich, real-time web platform with AI-assisted and AR-conceptualized capabilities, where multiple user roles can manage, monitor, and interact with data relevant to smart city services. The platform aims to be scalable, secure, and user-friendly, with a focus on real-time updates, collaboration, and immersive experiences.

## User Roles and Responsibilities

### 1. Admin
*   **Manage Users**: View all registered users. Activate/deactivate user accounts. Change user roles (Citizen, Official, Admin).
*   **Permissions Control**: Primarily through UI visibility and route protection based on assigned roles. Secure backend operations via Firestore Security Rules.
*   **Full System Analytics**: Access to the Admin Dashboard with comprehensive city data visualizations, KPI cards, and a form for conceptual custom report generation.
*   **Proposal Creation**: Create and manage public proposals for citizen voting.

### 2. Department Officials
*   **Communicate**: Utilize the internal 1-on-1 chat system to coordinate with other officials, admins, and citizens. Share information and attachments.
*   **Issue Management**: View all reported issues. Assign issues to relevant departments (mock data for now). Update issue statuses (Pending, Assigned, In Progress, Resolved, Closed). Add comments and resolution details.
 
### 3. Citizens
*   **Report City Issues**: Submit detailed reports of city issues (e.g., potholes, broken streetlights) via a user-friendly form.
    *   Includes location tagging (manual input, with geolocation API assistance).
    *   Supports descriptions, categories, and media attachments (photos/videos).
*   **Track Updates**: View the real-time status of their reported issues. Receive in-app notifications when their issues are updated (e.g., status change, assignment).
*   **Vote on Proposals**: Participate in public polls and vote on city improvement proposals posted by the Admin. View real-time voting results and deadlines.
*   **AR-Assisted Issue Reporting**: Use their mobile device's camera to capture an image of an issue. The system, using AI (Genkit), attempts to automatically detect the issue category and estimate its severity.

## Core Features Implemented

1.  **Real-Time Issue Reporting & Tracking**:
    *   Citizens report issues via a standard form or an AR-assisted image upload.
    *   AI (Genkit flow `assessIssueSeverity`) analyzes uploaded images to suggest severity and detect issue category.
    *   Issues follow a status pipeline: Pending → Assigned → In Progress → Resolved → Closed.
    *   Department Officials (and Admins) can manage issues: view, assign to departments (mock list), and update statuses.
    *   Citizens can track the status of their reported issues and receive in-app notifications for updates.

2.  **Interactive City Map View**:
    *   Displays active issues and proposals (if they have location data) on an interactive Leaflet map.
    *   Uses marker clustering (`react-leaflet-markercluster`) to group nearby items for better visualization.
    *   Allows users to filter map data by:
        *   Issue Category
        *   Issue Status
        *   Issue Assigned Department (from mock data)
        *   Date Range (for both issues and proposals based on creation date)
    *   Clicking on a map marker displays detailed information about the issue or proposal in a sidebar panel. Custom SVG icons differentiate issues and proposals.

3.  **Admin Dashboard**:
    *   Provides a comprehensive dashboard with:
        *   Charts and graphs (e.g., bar charts for issue counts by status, line graphs for issues reported over time, department performance comparison).
        *   Key Performance Indicators (KPIs) cards for metrics like total issues, pending issues, resolved issues (last 30 days), active proposals, and registered users.
    *   A form for (conceptual) custom report generation.

4.  **Communication Module**:
    *   **Internal Chat System**: Enables real-time 1-on-1 communication between all authenticated users (Admins, Officials, Citizens).
        *   Supports direct messages.
        *   Option to attach files (images primarily, with a 5MB limit) and screenshots.
    *   **In-App Notifications**: A user-specific notification dropdown in the navigation bar.
        *   Displays notifications for updates on their reported issues, new proposals, etc. (Currently, only issue update notifications are actively created by the system).
        *   Shows unread count and allows marking notifications as read.

5.  **Public Polling and Proposal Voting**:
    *   **Proposal Creation**: Admins can create proposals for city improvements or policy changes, including title, description, voting deadline, multiple voting options, optional media (images), and optional location.
    *   **Citizen Voting**: Authenticated users can vote on active proposals. The system prevents multiple votes and voting after the deadline.
    *   **Real-Time Results**: Displays live voting results (counts and percentages) and a countdown to the deadline on each proposal card.
    *   **Transparency**: Voting results are visible to all users.

6.  **User Management (Admin Role)**:
    *   Admins have access to a "User Management" page (`/admin/users`).
    *   Can view a list of all registered users with their current roles and account status.
    *   Can change a user's role between 'citizen', 'official', and 'admin'.
    *   Can activate or deactivate user accounts (an `isActive` flag in Firestore).

## AR Integration

The AR component is primarily focused on enhancing data input and providing conceptual UIs for future field assistance.

-   **AR-Based Issue Reporting (Citizens)**:
    *   Citizens can upload an image when reporting an issue (via the "AR Report" tab).
    *   The AI (Genkit flow `assessIssueSeverity`) analyzes this image to:
        *   Detect the issue category (e.g., Pothole, Fallen Tree).
        *   Estimate its severity (low, medium, high).
        *   Provide a justification for the assessment.
    *   This information pre-fills parts of the issue report form.
    *   Location data is captured via user input or the browser's geolocation API. True AR positioning for precise location is a future enhancement.

## Technical Stack

-   **Frontend**: Next.js (v15+ with App Router), React (v18+), TypeScript
-   **UI Framework**: ShadCN UI (built on Radix UI and Tailwind CSS)
-   **CSS**: Tailwind CSS
-   **State Management**: React Context API (for Authentication), `useState` / `useEffect` for component-level state.
-   **AI/Generative Features**: Firebase Genkit (using Google's Gemini models via `@genkit-ai/googleai`)
    *   `assessIssueSeverity` flow: For analyzing images from AR issue reports.
    *   `autoAssignFieldWorker` flow: For AI-driven task assignment logic.
-   **Backend & Database**: Firebase
    *   **Firestore**: NoSQL database for storing issues, proposals, users, chat messages, notifications.
    *   **Firebase Authentication**: For user sign-up/sign-in (Email/Password and Google).
    *   **Firebase Storage**: For storing user-uploaded media (issue attachments, proposal media, chat attachments).
-   **Mapping**:
    *   Leaflet
    *   React-Leaflet (wrapper for using Leaflet with React)
    *   React-Leaflet-Markercluster (for clustering map markers)
-   **Forms**: React Hook Form with Zod for validation.
-   **Date Handling**: `date-fns`
-   **Linting/Formatting**: Default Next.js setup (ESLint, Prettier implicitly).

## Setup Instructions

### Prerequisites
*   Node.js (v18 or later recommended)
*   npm (or yarn/pnpm)
*   A Firebase Account and a Firebase Project

### 1. Clone the Repository
```bash
git clone https://github.com/WaqarAhmad321/smart-city-sol
cd citysync-dashboard 
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Firebase
1.  Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project (or use an existing one).
2.  Enable **Authentication**, **Firestore Database**, and **Storage**:

### 4. Environment Variables
Create a `.env.local` file in the root of your project and add your Firebase configuration:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY_FROM_FIREBASE_CONFIG"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN_FROM_FIREBASE_CONFIG"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID_FROM_FIREBASE_CONFIG"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET_FROM_FIREBASE_CONFIG"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID_FROM_FIREBASE_CONFIG"
NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID_FROM_FIREBASE_CONFIG"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID_FROM_FIREBASE_CONFIG"

# For Genkit (Google AI Studio API Key or Google Cloud Project with Gemini API enabled)
# Ensure you have enabled the Gemini API in your Google Cloud project
# and generated an API key, or use an AI Studio key for development.
GOOGLE_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
```
**Important**: The `GOOGLE_API_KEY` is used by Genkit. For development, `.env.local` is fine. For production, this key should be managed securely as an environment variable on your hosting platform.

### 5. Run the Development Servers
The application uses Next.js for the frontend and Genkit for AI flows. You'll typically run them separately in development.

**Start Next.js Frontend:**
```bash
npm run dev
```
This will start the Next.js development server, usually at `http://localhost:9002`.

**Start Genkit Development Server (in a separate terminal):**
```bash
npm run genkit:dev
```
This starts the Genkit development flow server, usually on `http://localhost:3400`. The Next.js app will make requests to this server for AI functionalities.

### 6. Initial Admin User Setup
1.  Open the application in your browser (e.g., `http://localhost:9002`).
2.  Sign up a new user using the Email/Password. This user will be created with the default 'citizen' role.
3.  Go to your Firebase Console -> Firestore Database.
4.  Find the `users` collection and locate the document for the user you just created (the document ID will be their Firebase Auth UID).
5.  Manually edit the `role` field in this user's document from `"citizen"` to `"admin"`.
6.  Refresh the application. The user should now have admin privileges.
7.  You can now navigate to the "User Management" page (`/admin/users`) to manage other users' roles and activate/deactivate accounts.

## Future Enhancements
*   **Full Backend Notification System**: Implement Firebase Functions to trigger push and email notifications for events like issue updates, new proposals, and voting deadlines.
*   **Advanced Admin UI**: Create a more detailed admin interface for defining roles, granular permissions, and possibly inviting users directly.
*   **Deeper AR Integrations**:
    *   Live AR overlays for field assistance (e.g., using WebXR if feasible, or native mobile integration).
    *   3D AR data visualizations for admins.
    *   More precise AR-based location tagging for issue reporting.
*   **Group Chat Functionality**: Expand the communication module to support department-wide or custom group chats.
*   **Assigning Issues to Specific Officials**: Allow assignment of issues directly to individual 'official' users, not just departments.
*   **Comprehensive Testing**: Add unit, integration, and end-to-end tests.
*   **Scalability & Performance Optimizations**: For larger datasets, implement server-side pagination, more efficient Firestore queries (geoqueries for map), and potentially data denormalization strategies.
*   **Accessibility (a11y)**: Conduct thorough accessibility audits and improvements.
ments, and citizens to interact and collaborate in real time. This platform acts as a central hub for monitoring, reporting, decision-making, and analytics related to city operations, with an added focus on Augmented Reality (AR) concepts to enhance user interaction and data accuracy.
