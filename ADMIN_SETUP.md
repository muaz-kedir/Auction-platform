# Admin Account Setup

This guide explains how to create admin accounts for the auction platform.

## Creating Admin Accounts

Run the following command in the backend directory to create the default admin accounts:

```bash
cd backend
npm run seed:admins
```

This will create two admin accounts in your MongoDB database:

### Super Admin Account
- **Email**: superadmine@gmail.com
- **Password**: superadmine123
- **Role**: super_admin
- **Access**: Full access to all dashboard features

### Admin Account
- **Email**: admin@gmail.com
- **Password**: admin123
- **Role**: admin
- **Access**: Full access to all dashboard features

## Login Process

1. Go to the login page: `http://localhost:3000/login`
2. Enter the admin credentials
3. Click "Login"
4. You will be redirected to the admin dashboard

## Access Control

- Only users with `admin` or `super_admin` role can access the dashboard
- Regular users (buyers/sellers) will see an "Access Denied" message
- The navigation menu is filtered based on user role

## User Roles

The system supports the following roles:

- **super_admin**: Full system access
- **admin**: Full system access
- **seller**: Can create auctions and manage their listings
- **buyer**: Can bid on auctions and manage their bids

## Security Notes

⚠️ **Important**: Change these default passwords in production!

For production deployment:
1. Create strong, unique passwords
2. Store credentials securely
3. Enable two-factor authentication if available
4. Regularly rotate passwords
