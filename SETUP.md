# VoiceChatAI Setup Guide

## Initial Setup

When you first deploy VoiceChatAI, you'll need to complete the initial setup to create your super admin account.

### Automatic Setup Flow

1. **First Visit**: When you visit the application for the first time, you'll be automatically redirected to `/setup`
2. **Setup Form**: Fill out the setup form with:
   - **Company Name**: Your organization's name
   - **Email**: Your admin email address
   - **Password**: A secure password (minimum 8 characters)
   - **Confirm Password**: Confirm your password
3. **Account Creation**: The system will create:
   - Your super admin account with full platform access
   - A default tenant with premium trial (14 days)
   - Default plans (Free and Premium)
   - A default support bot agent

### After Setup

Once setup is complete, you'll be automatically logged in and redirected to the dashboard where you can:

- Manage all tenants and their subscriptions
- Configure platform settings
- Monitor trial statuses
- Create and manage user accounts

## Environment Variables

Make sure you have the following environment variables configured:

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=your_database_name
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

### Optional Environment Variables

- `BYPASS_SETUP=true` - Skip the setup process (development only)

## Security Notes

- **Production Deployment**: The hardcoded demo credentials have been removed for security
- **Setup Protection**: The setup endpoint is rate-limited and only works when no users exist
- **Password Security**: All passwords are hashed using bcrypt
- **JWT Security**: Sessions use secure JWT tokens with configurable expiration

## User Management

### Super Admin Capabilities

As a super admin, you can:

- **Trial Management**: Extend, expire, or override trial periods
- **User Control**: Create, modify, and delete user accounts
- **Plan Management**: Configure subscription plans and pricing
- **Feature Control**: Reset user features and enforce plan limits
- **Bulk Operations**: Perform bulk actions on multiple tenants

### Creating Additional Users

After initial setup, you can create additional users through:

1. **Registration Page**: `/register` - For new tenant admins
2. **Super Admin Dashboard**: Direct user creation and management

## Troubleshooting

### Setup Issues

- **Setup Already Completed**: If you see this message, the system already has users. Use `/login` instead
- **Database Connection**: Ensure your MongoDB connection string is correct
- **Rate Limiting**: Setup endpoint is heavily rate-limited for security

### Login Issues

- **No Demo Credentials**: Demo credentials have been removed for security
- **Forgot Password**: Contact your super admin or use database recovery methods
- **Account Locked**: Check rate limiting and try again after the timeout period

## Development

For development purposes, you can:

1. Set `BYPASS_SETUP=true` to skip the setup process
2. Manually create users in the database
3. Use the registration endpoint to create test accounts

## Production Deployment

1. **Remove Demo Data**: Ensure no demo credentials are in the codebase
2. **Secure Environment**: Use strong JWT secrets and secure database connections
3. **HTTPS Only**: Always use HTTPS in production
4. **Rate Limiting**: Configure appropriate rate limits for your use case
5. **Monitoring**: Set up monitoring for failed login attempts and security events

## Support

For technical support or questions about the setup process, please refer to the documentation or contact your system administrator.
