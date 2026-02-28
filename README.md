# DJ & A-V Equipment Inventory Management System

---

## Project Overview

The DJ & A-V Equipment Inventory Management System (GearTrack) is a full-stack web application designed to manage shared DJ and audio-visual equipment. The system tracks inventory items, equipment availability, borrower information, and complete check-in/check-out history.

The application provides a centralized, structured alternative to spreadsheets or informal tracking methods, improving accountability, accuracy, and visibility of shared equipment usage.

---

## Problem Addressed

Managing shared DJ and A-V equipment using spreadsheets, paper logs, or informal communication makes it difficult to:

- Know which equipment is currently available
- Track who has borrowed equipment and when
- Prevent double bookings or lost equipment
- Maintain accurate historical usage records

This application solves these issues by implementing a structured inventory and checkout system backed by a relational database.

---

## Core Features

- Add, edit, and delete equipment items (Admin)
- View complete inventory with availability status
- Create and manage user (borrower) accounts (Admin)
- Check equipment out (condition required)
- Check equipment back in (return condition required)
- Prevent invalid actions (e.g., double checkout of same item)
- Maintain a historical activity log of all transactions

---

## Technology Stack

The application is built using only course-approved technologies:

- **Backend:** Node.js with Express
- **Database:** SQLite (relational database)
- **Frontend:** HTML, CSS, EJS (server-rendered templates)
- **Version Control:** GitHub
- **Project Management:** Kanban board

---

## Data Model

The system is built around three main relational entities:

### Users
Represents borrowers of equipment.

### Equipment
Represents individual inventory items (controllers, mixers, speakers, lighting, etc.).  
Each item tracks its category, serial number, status, and current condition.

### Checkouts
Represents transaction records connecting Users and Equipment.  
Tracks:
- Checkout timestamp
- Return timestamp
- Checkout condition
- Return condition
- Optional notes

An equipment item may have many historical checkout records, but only one active checkout at a time.

---

## How to Run the Application Locally

### Prerequisites

Make sure the following is installed:

- Node.js (LTS version recommended)
- npm (comes with Node.js)

### Verify installation:

```bash
node -v
npm -v
```

### Clone the Repository

```bash
git clone <repository-url>
cd <repository-folder>
```

### Install Dependencies
```bash
npm install
```

### Start the Server
```bash
npm start
```

### Access the Application
```bash
http://localhost:3000
```
