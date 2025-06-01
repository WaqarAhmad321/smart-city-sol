# **App Name**: CitySync

## Core Features:

- Interactive Map: Interactive map displaying issues, proposals, and city data using Leaflet, with clustering and filtering. Allows filtering by issue type, status, department, and date range. Clicking on a marker displays detailed information.
- Admin Dashboard: Admin dashboard for visualizing city data using charts, graphs, and heatmaps. Displays KPIs such as average issue resolution time, department response rates, and citizen engagement metrics. Allows custom report generation based on selected metrics and time frames. Includes department performance insights.
- Communication Module: Communication module with real-time chat between officials and push/email notifications for citizens. Supports group chats and direct messages. Includes options to attach files and screenshots. Sends notifications for updates on reported issues, new proposals, and voting deadlines.
- Public Polling: System for creating and voting on city improvement proposals with real-time result tracking. Admins can create proposals with titles, descriptions, voting deadlines, and optional media. Citizens can vote on proposals. Displays live voting results and countdowns to deadlines.
- AR-Based Issue Reporting: Citizens can use their mobile device's camera to capture issues. The AR system should automatically detect the issue type and estimate its severity or size using image recognition.  Location data is captured via GPS and AR positioning.
- AR Field Assistance: Department officials can use AR to view overlays of city data while in the field, such as issue locations and infrastructure details. Provides historical data, maintenance records and step-by-step repair instructions.
- Department Task Automation: Automatically assign a field worker when the number of pending issues in a specific area exceeds a threshold.  Auto-escalate unresolved issues after a set period using a tool that reasons about issue assignment.
- Real-Time Issue Reporting & Tracking: Citizens can report issues via a user-friendly form or through AR, including location, description, category, and media uploads. Each reported issue follows a status pipeline: Pending → Assigned → In Progress → Resolved. Citizens can track the status of their reported issues.

## Style Guidelines:

- Primary color: Desaturated blue (#558bda) evoking trust and reliability.
- Background color: Light gray (#f5f5f5) providing a clean, modern backdrop.
- Accent color: Soft green (#81c784) for highlighting calls to action and important information.
- Body and headline font: 'Inter' (sans-serif) for a modern and objective feel.
- Use clean, modern icons from a set like Material Design Icons to represent different issue types and functionalities.
- Use a grid-based layout for the dashboard to ensure consistency and responsiveness. Utilize Shadcn UI components for a polished look.
- Implement subtle animations for transitions and updates to enhance user experience without being distracting.