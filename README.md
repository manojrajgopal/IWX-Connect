# IWX Connect

source C:/Users/Manu/anaconda3/Scripts/activate IWX-Connect

Premium social communication platform — chats, connections, feeds, reels, stories, real-time notifications.

```
IWX-Connect/
├── backend/                       Django 5 + DRF + Channels (ASGI)
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── config/                    Project settings, ASGI, URLs, channel routing
│   │   ├── settings/              base.py / dev.py / prod.py
│   │   ├── asgi.py
│   │   ├── wsgi.py
│   │   ├── urls.py
│   │   └── routing.py
│   └── apps/
│       ├── core/                  shared models, middleware, errors, validators, utils
│       ├── accounts/              users, profiles, preferences
│       ├── security/              sessions, devices, audit log (hash-chained), rate limits, crypto
│       ├── connections/           friend/connection requests, blocks
│       ├── chats/                 conversations, messages, reactions, receipts
│       ├── feeds/                 posts, reels, stories, comments
│       ├── media/                 uploads, thumbnails, signed local URLs
│       ├── notifications/         in-app + Web Push (VAPID)
│       └── realtime/              Channels consumers, presence registry
│   each app:
│       models.py  repositories.py  services.py  serializers.py  views.py  urls.py  permissions.py  consumers.py (where applicable)
│
├── frontend/                      React 19 + Vite + Tailwind + Framer Motion
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── public/
│   │   ├── favicon.ico            (reused)
│   │   ├── logo192.png            (reused)
│   │   ├── logo512.png            (reused)
│   │   ├── startup-sound.mp3      (reused)
│   │   └── manifest.webmanifest
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css              design tokens (light + dark)
│       ├── assets/
│       ├── components/
│       │   ├── startup/           Splash + branded loader
│       │   ├── layout/            AppShell, Sidebar, Topbar, MobileNav
│       │   ├── ui/                Button, Input, Avatar, Skeleton, Toast, Modal
│       │   ├── chat/              ConversationList, MessageThread, Composer, TypingDots
│       │   ├── feed/              PostCard, ReelPlayer, StoryRing
│       │   └── notifications/     NotificationBell, NotificationCenter
│       ├── pages/                 Home, Chats, Requests, Discover, Reels, Stories,
│       │                          Profile, Settings, auth/Login, auth/Signup
│       ├── layouts/               MainLayout, AuthLayout
│       ├── hooks/                 useAuth, useRealtime, useTheme, useMediaQuery
│       ├── stores/                authStore, chatStore, notificationStore (zustand)
│       ├── services/              api client, auth, chats, feeds, notifications
│       ├── realtime/              socket client, event router
│       └── utils/                 formatters, fingerprint, web-push registration
│
└── docker-compose.yml             postgres + redis + backend + frontend (dev)
```

## Run (dev)

```powershell
docker compose up -d postgres redis
cd backend
python -m venv .venv ; .venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py createsuperuser
daphne -b 0.0.0.0 -p 8000 config.asgi:application

cd ..\frontend
npm install
npm run dev
```
