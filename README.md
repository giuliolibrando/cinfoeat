# CinfoEat - Lunch Reservation System

<div align="center">
  <img src="docs/images/logo_black.png" alt="CinfoEat Logo" width="200"/>
</div>

CinfoEat is a web application for managing and reserving meals at the Office and at University.

## Main Features

  

### Menu and Order Management
- Daily menu creation and management
- Custom dish addition capability
- Meal reservation system with customizable quantities
- Real-time order visualization
- Menu availability date management
 

### Payment System
- PayPal integration for online payments
- Payment tracking
- Balance and pending payments overview
- Transaction management with detailed history
  
### User Management
- LDAP authentication
- Role management (admin/user)
- Customizable push notifications for users
 
### Administrative Features
- Complete administrative dashboard
- Admin permission management
- Feature toggles
- Custom notification sending to users
- PayPal configuration management

### Integrations and Customizations
- Multilanguage (English, Italian)
- External menu support via links
- User-visible notes system in home page
- Push notification customization
- Flexible system settings configuration



## System Requirements

- Docker and Docker Compose
- Node.js 18+ (for development)

## Initial Setup

Before starting the application, you need to set up the configuration files:

1. Edit ldap config in .env file
2. Edit server_name in nginx/default.conf
3. Edit admins in db/init.sql

Start all containers:
```bash
docker-compose up -d --build
```

## Project Structure

```
cinfoeat/
├── new-app/
│   ├── frontend/     # React Application
│   └── backend/      # Node.js API
├── nginx/           # Nginx Configurations
└── db/             # Database Initialization Scripts
```

## Local Development

### HTTPS Configuration with Reverse Proxy

The application is configured to work with HTTPS through an Nginx reverse proxy, which improves security and allows the use of push notifications even in the development environment.

#### How to access the application

- **Main URL**: http://localhost:3080/
- **Backend API**: http://localhost:3080/api/
- **Adminer (DB Management)**: http://localhost:8080/

#### Docker Container Structure

The application consists of 5 Docker containers:
1. **cinfoeat-db**: MariaDB Database
2. **cinfoeat-backend**: Node.js API
3. **cinfoeat-frontend**: React Frontend
4. **cinfoeat-nginx**: Nginx Reverse Proxy
5. **cinfoeat-adminer**: Web Interface for Database Management

#### Exposed Ports

- **3080**: HTTP (frontend and API)
- **8080**: Adminer (database management)
- **3306**: MariaDB Database (for direct DB access)
``

### Environment Variables

The following environment variables must be configured in the `.env` file:

- `DB_HOST`: Database host (default: db)
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `LDAP_URL`: LDAP server URL
- `LDAP_BIND_DN`: LDAP authentication DN
- `LDAP_BIND_CREDENTIALS`: LDAP credentials
- `LDAP_SEARCH_BASE`: LDAP search base DN
- `PUBLIC_VAPID_KEY`: VAPID public key for notifications
- `PRIVATE_VAPID_KEY`: VAPID private key for notifications

## TODO:
- [ ] Complete push notifications implementation
