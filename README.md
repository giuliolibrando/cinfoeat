# CinfoEat - Lunch Reservation System

CinfoEat is a web application for managing and reserving meals at the Office.

## System Requirements

- Docker and Docker Compose
- Node.js 18+ (for development)

## Initial Setup

Before starting the application, you need to set up the configuration files:

1. Edit ldap config in .env file

2. Edit server_name in nginx/default.conf

3. Edit admins in db/init.sql

## Project Structure

```
cinfoeat/
├── new-app/
│   ├── frontend/     # React Application
│   └── backend/      # Node.js API
├── nginx/           # Nginx Configurations
├── db/             # Database Initialization Scripts
└── ssl/            # SSL Certificates
```

## Local Development

### HTTPS Configuration with Reverse Proxy

The application is configured to work with HTTPS through an Nginx reverse proxy, which improves security and allows the use of push notifications even in the development environment.

#### How to access the application

- **Main URL**: http://localhost:3080/
- **Backend API**: http://localhost:3080/api/
- **Adminer (DB Management)**: http://localhost:8080/

#### SSL Certificates

SSL certificates are self-signed and are located in the `ssl/` folder:
- `server.key`: private key
- `server.crt`: public certificate

Since the certificates are self-signed, the browser might show a security warning. To proceed, you need to temporarily accept the certificate in your browser.

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

### Useful Commands

Start all containers:
```bash
docker-compose up --build
```

Stop all containers:
```bash
docker-compose down
```

View logs:
```bash
docker logs cinfoeat-frontend  # Frontend logs
docker logs cinfoeat-backend   # Backend logs
docker logs cinfoeat-nginx     # Proxy logs
```

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

### Using Push Notifications

To use push notifications:
1. Access the site
2. Register and log in with an account
3. Go to the profile page and enable notifications
4. Accept the browser's permission request for notifications

Administrators can send notifications from the administration page.

## Troubleshooting

1. **Notification Issues**:
   - Verify that the site is accessible
   - Check if the Service Worker is properly registered
   - Check backend logs for any errors

2. **API Connection Issues**:
   - Verify that all containers are running
   - Check Nginx logs for any proxy errors

3. **Database Access Issues**:
   - Verify that the database container is running
   - Use Adminer (http://localhost:8080) to verify the connection
   - Check credentials in the .env file 