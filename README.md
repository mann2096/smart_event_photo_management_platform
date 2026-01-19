# 📸 SensePic — Event-Based Smart Photo Gallery

SensePic is a **full-stack, event-centric photo management platform** built for colleges, clubs, photographers, and event coordinators.  
It enables secure photo uploads, structured event galleries, real-time interaction, and role-based access control.

> **Think Google Photos × Event Management**, with strict permissions, real-time notifications, and EXIF-aware uploads.

---

## 📖 Table of Contents

- [The Core Idea](#-the-core-idea)
- [Architecture Overview](#-architecture-overview)
- [Data Models](#-data-models)
- [Backend Features](#-key-backend-features)
- [Frontend Features](#-frontend-features)
- [Real-Time Notifications](#-real-time-notifications)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Security & Access Control](#-security--access-control)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🧠 The Core Idea

Traditional photo galleries store all photos in a single, unstructured feed.  
**SensePic is event-first.**

Each photo belongs to **exactly one Event**, and users can only interact with photos inside events they are authorized to access.

```

┌───────────────────────────────────────────────┐
│                    EVENT                      │
│          (e.g. "Tech Fest 2025")              │
│                                               │
│   📸📸📸📸📸  Event Photo Stream            │
│                                               │
│   • EXIF-aware uploads                        │
│   • Likes / Comments / Replies                │
│   • User tagging                              │
│   • Role-based permissions                    │
└───────────────────────────────────────────────┘

```

No albums.  
No ambiguity.  
Clean ownership and predictable access control.

---

## 🏗 Architecture Overview

```

┌───────────────────────────────────────────────────────────┐
│                         FRONTEND                          │
│            React + TypeScript + Redux Toolkit             │
│                 Tailwind CSS + Vite                       │
│                                                           │
│  Pages | Components | RTK Query | WebSocket Hook          │
└───────────────┬───────────────────────────────────────────┘
│
▼
┌───────────────────────────────────────────────────────────┐
│                REST API + WebSocket Layer                 │
│             JWT Authentication (SimpleJWT)                │
└───────────────┬───────────────────────────┬───────────────┘
│                           │
▼                           ▼
┌─────────────────────────────┐   ┌─────────────────────────┐
│        DJANGO REST API      │   │     DJANGO CHANNELS     │
│         (DRF ViewSets)      │   │   WebSocket Consumers   │
│                             │   │                         │
│  • Events                   │   │  • Per-user groups      │
│  • Photos                   │   │  • JWT auth middleware  │
│  • Comments / Likes         │   │  • Live notifications   │
│  • Roles & Permissions      │   │                         │
└───────────────┬─────────────┘   └─────────────┬───────────┘
│                                 │
▼                                 ▼
┌─────────────────────────────┐   ┌─────────────────────────┐
│        PostgreSQL DB        │   │     Email Service       │
│                             │   │  OTP & notifications    │
│  • Users                    │   └─────────────────────────┘
│  • Events                   │
│  • Photos (EXIF JSON)       │
│  • Notifications            │
└─────────────────────────────┘

````

---

## 📊 Data Models

### 👤 User (`users/models.py`)

Custom email-based authentication with OTP verification.

| Field | Description |
|-----|------------|
| `email` | Primary identifier |
| `user_name` | Display username |
| `provider` | `email` or `omniport` |
| `profile_photo` | Optional avatar |
| `department`, `batch` | Institute metadata |
| `is_active` | Email-verified status |

---

### 📅 Event (`events/models.py`)

Top-level container for photos.

| Field | Description |
|-----|------------|
| `name`, `description` | Event metadata |
| `start_date`, `end_date` | Event duration |
| `visibility` | `public` or `private` |
| `created_by` | Event owner |

---

### 👥 UserEvent (Role Mapping)

Defines **per-event roles**.

| Role | Permissions |
|----|------------|
| Coordinator | Manage event, roles, invite users |
| Photographer | Upload & manage own photos |
| Member | View, like, comment |
| Superuser | Full system access |

---

### 📸 Photo (`photos/models.py`)

| Field | Description |
|----|------------|
| `image` | Original uploaded photo |
| `event` | Parent event |
| `uploaded_by` | Photographer |
| `exif_data` | Camera, ISO, location, timestamp |
| `views` | View counter |
| `likes_count` | Cached likes |
| `watermarked` | Download protection |

---

### 💬 Interaction Models

- **Like** (one per user per photo)
- **Comment** (nested replies supported)
- **Favourite**
- **Tagged Users**

---

### 🔔 Notification

Generic, extensible notification system.

| Field | Description |
|----|------------|
| `user` | Recipient |
| `type` | `comment`, `like`, `tagged`, `bulk_upload`, etc. |
| `payload` | JSON context |
| `is_read` | Read state |
| `created_at` | Timestamp |

---

## 🚀 Key Backend Features

| Feature | Implementation |
|------|----------------|
| JWT Authentication | SimpleJWT |
| Email OTP Verification | Django Email |
| Role-Based Access | UserEvent + Permissions |
| Bulk Photo Upload | Multipart uploads |
| EXIF Extraction | Pillow |
| Watermarked Downloads | Server-side processing |
| Advanced Filtering | Date, tags, timeline, events |
| Real-Time Notifications | Django Channels |
| Omniport OAuth | Institute SSO |

---

## 🎨 Frontend Features

| Feature | Implementation |
|------|----------------|
| Authentication Flow | JWT + refresh tokens |
| State Management | Redux Toolkit |
| Data Fetching | RTK Query |
| Filters | URL-synced global filters |
| Photo Viewer | Modal with EXIF panel |
| Bulk Upload UI | Drag-and-drop |
| Notifications | WebSocket + REST fallback |
| Role-aware UI | Conditional rendering |

---

## ⚡ Real-Time Notifications

- Authenticated WebSocket connection
- Per-user Channels group
- Instant updates for:
  - Likes
  - Comments & replies
  - User tagging
  - Bulk uploads

REST API fallback supported.

---

## 🛠 Tech Stack

### Backend
- Python 3.10+
- Django 5.x
- Django REST Framework
- Django Channels
- PostgreSQL
- Redis (optional, for scaling)
- SimpleJWT

### Frontend
- React 18+
- TypeScript
- Vite
- Tailwind CSS
- Redux Toolkit
- RTK Query
- Native WebSocket API

---

## ⚡ Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL (or SQLite for development)

---

### 1️⃣ Backend Setup

```bash
git clone https://github.com/mann2096/smart_event_photo_management_platform.git
cd /backend

python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
````

---

### 2️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 🔐 Security & Access Control

* JWT-protected APIs
* Refresh token rotation
* Event-scoped permissions
* Private event isolation
* Download watermarking
* Server-validated roles (not UI-only)

---


