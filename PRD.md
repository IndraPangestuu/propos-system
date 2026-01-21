# Product Requirements Document (PRD) - ProPOS (Web Mockup)

## 1. Introduction
**Project Name:** ProPOS (Professional Point of Sale)
**Purpose:** Create a high-fidelity web prototype that mimics the experience of a professional Android POS application.
**Context:** This is a React-based mockup designed to validate the UI/UX and user flows defined for the original Flutter application request.

## 2. Technical Adaptation (Mockup Mode)
Since this is a web prototype, the original Flutter/BLoC architecture is adapted as follows:

| Original Requirement (Flutter) | Web Mockup Implementation (React) |
|-------------------------------|-----------------------------------|
| **Framework:** Flutter | **Framework:** React + Vite |
| **State Mgmt:** BLoC | **State Mgmt:** Zustand (Global) + React Query (Server State Sim) |
| **Database:** SQLite/Hive | **Data:** In-Memory Mock Data + LocalStorage |
| **Navigation:** go_router | **Navigation:** wouter |
| **Design:** Material Design 3 | **Design:** Tailwind CSS (Custom "Teal" Theme matching MD3) |

## 3. Core Features & Scope

### 3.1 Authentication (Auth BLoC Simulation)
*   [x] **Login Screen:** Email/Password input.
*   [x] **Role Simulation:** Admin vs. Employee toggle (via login credential simulation).
*   [x] **Session State:** Persistent login state with backend sessions.

### 3.2 Cashier Operations (Cashier BLoC Simulation)
*   [x] **Shift Management:** Open/Close shift UI with starting cash input.
*   [x] **Shift Summary:** End-of-day report UI (Total sales, cash count).

### 3.3 Sales & Transactions (Transaction BLoC Simulation)
*   [x] **Product Grid:** Visual grid with images and prices.
*   [x] **Category Filter:** Scrollable pills for filtering.
*   [x] **Cart Management:** Add/Remove items, update quantity, auto-calculate total.
*   [x] **Payment Flow:** Modal for Cash, Card, QRIS, E-Wallet.
*   [x] **Receipt/Invoice:** Printable receipt preview after payment.

### 3.4 Product Management (Product BLoC Simulation)
*   [x] **Product List:** Data table view for Admin.
*   [x] **Add/Edit Product:** Modal or page to manage inventory items.
*   [x] **Stock Mgmt:** Visual indicators for low stock.

### 3.5 Reporting (Report BLoC Simulation)
*   [x] **Dashboard:** Key metrics (Revenue, Transactions).
*   [x] **Visualizations:** Charts for sales trends.
*   [x] **Detailed Reports:** Filterable transaction history list.

### 3.6 Settings & Localization (Settings BLoC Simulation)
*   [x] **Settings UI:** General configuration page.
*   [x] **Language Switcher:** Functional toggle with Indonesian/English translations.
*   [x] **Invoice Template:** UI to customize header/footer of receipts.

## 4. UI/UX Guidelines
*   **Style:** Clean, Professional, "Teal & Slate" theme.
*   **Responsiveness:**
    *   *Desktop:* Sidebar navigation, Dashboard view.
    *   *Mobile/Tablet:* Drawer navigation, Bottom sheet cart, Touch-friendly targets.
*   **Feedback:** Toast notifications for success/error states (Payment success, Login error).

## 5. Implementation Notes
*   **Full Stack:** Complete backend with Express + PostgreSQL (exceeds original mockup scope).
*   **Data Persistence:** All data persisted in PostgreSQL database.
*   **Authentication:** Session-based auth with bcrypt password hashing.
*   **Security:** Authorization checks, stock validation, shift ownership verification.
