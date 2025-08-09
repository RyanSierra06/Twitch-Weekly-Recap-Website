# Twitch Weekly Recap Website - Backend

This is the production-ready backend for the Twitch Weekly Recap Website. It's designed to handle multiple users simultaneously and scale efficiently.

## 🚀 Production Features

- **MongoDB Session Store**: Replaces memory store to prevent memory leaks
- **Rate Limiting**: Protects against abuse and DDoS attacks
- **Security Headers**: Helmet.js for enhanced security
- **Compression**: Gzip compression for better performance
- **Graceful Shutdown**: Proper cleanup on server shutdown
- **Error Handling**: Comprehensive error handling and logging
- **Database Connection Pooling**: Optimized MongoDB connections
- **Session Management**: Secure session storage with automatic cleanup

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB database (MongoDB Atlas recommended for production)
- Twitch Developer Account

## 🔧 Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database Configuration
MONGO_URI=mongodb+srv://ryansierra06:<db_password>@maincluster.kpi6ki1.mongodb.net/?retryWrites=true&w=majority&appName=MainCluster

# Session Configuration
SESSION_SECRET=your-super-secure-session-secret-here

# Twitch API Configuration
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_SECRET=your-twitch-secret
TWITCH_CALLBACK_URL=http://localhost:4000/auth/twitch/callback

# Frontend Configuration
FRONTEND_BASE_URL=http://localhost:5173

# Server Configuration
PORT=4000
NODE_ENV=development
```

### Environment Variable Details

- **MONGO_URI**: Your MongoDB connection string (replace `<db_password>` with your actual password)
- **SESSION_SECRET**: A secure random string for session encryption
- **TWITCH_CLIENT_ID**: Your Twitch application client ID
- **TWITCH_SECRET**: Your Twitch application secret
- **TWITCH_CALLBACK_URL**: The callback URL for Twitch OAuth
- **FRONTEND_BASE_URL**: Your frontend application URL
- **PORT**: The port your server will run on (default: 4000)
- **NODE_ENV**: Environment mode (development/production)

## 🛠️ Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see above)

3. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## 🏗️ Architecture

### Session Management
- Uses MongoDB as session store instead of memory store
- Automatic session cleanup (7-day TTL)
- Secure cookie configuration
- Session encryption with environment variable

### Database
- MongoDB with Mongoose ODM
- Connection pooling for better performance
- Automatic reconnection handling
- Graceful shutdown support

### Security
- Helmet.js for security headers
- Rate limiting (100 requests per 15 minutes per IP)
- CORS configuration
- Secure cookie settings
- Input validation

### Performance
- Gzip compression
- Database connection pooling
- Efficient session storage
- Optimized queries with indexes

## 🔄 Production Deployment

### Vercel Deployment
The backend is configured for Vercel deployment with the `vercel.json` file.

### Environment Variables for Production
Make sure to set all environment variables in your production environment:

1. **Vercel Dashboard**: Go to your project settings and add environment variables
2. **MongoDB Atlas**: Ensure your MongoDB cluster is accessible from your production environment
3. **Twitch App**: Update your Twitch app's redirect URI for production

### Production Checklist
- [ ] All environment variables are set
- [ ] MongoDB connection is working
- [ ] Session store is configured
- [ ] Rate limiting is enabled
- [ ] Security headers are configured
- [ ] Error handling is in place
- [ ] Logging is configured
- [ ] SSL/TLS is enabled (if applicable)

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check if MONGO_URI is correctly set
   - Ensure MongoDB cluster is accessible
   - Verify network connectivity

2. **Session Store Error**
   - Check if MONGO_URI is accessible
   - Verify SESSION_SECRET is set
   - Ensure MongoDB is running

3. **Rate Limiting**
   - Adjust rate limit settings in `index.js` if needed
   - Check if requests are being blocked

4. **CORS Issues**
   - Verify FRONTEND_BASE_URL is correctly set
   - Check if frontend URL matches CORS configuration

## 📊 Monitoring

The application includes comprehensive logging for:
- Database connections
- Session management
- Error handling
- Server startup/shutdown
- Rate limiting

## 🔒 Security Considerations

- All sensitive data is stored in environment variables
- Sessions are encrypted and stored securely
- Rate limiting prevents abuse
- Security headers are enabled
- CORS is properly configured
- Input validation is implemented

## 📈 Scaling

The application is designed to scale horizontally:
- Stateless session management
- Database connection pooling
- Efficient resource usage
- Graceful shutdown handling

For high-traffic applications, consider:
- Load balancing
- Database sharding
- Redis for caching
- CDN for static assets
