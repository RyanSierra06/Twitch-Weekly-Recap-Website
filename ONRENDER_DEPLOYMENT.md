# OnRender Deployment Guide

This guide will help you deploy your Twitch Weekly Recap Website backend to OnRender.

## 🚀 Quick Deploy

1. **Fork/Clone this repository** to your GitHub account
2. **Connect to OnRender**:
   - Go to [OnRender.com](https://onrender.com)
   - Sign up/Login with GitHub
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

3. **Configure the service**:
   - **Name**: `twitch-weekly-recap-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid if you need more resources)

## 🔧 Environment Variables

Set these environment variables in your OnRender dashboard:

### Required Variables:
```env
MONGO_URI=mongodb+srv://ryansierra06:<your_actual_password>@maincluster.kpi6ki1.mongodb.net/?retryWrites=true&w=majority&appName=MainCluster
SESSION_SECRET=your-super-secure-session-secret-here
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_SECRET=your-twitch-secret
TWITCH_CALLBACK_URL=https://your-app-name.onrender.com/auth/twitch/callback
FRONTEND_BASE_URL=https://your-frontend-url.com
NODE_ENV=production
```

### Optional Variables:
```env
PORT=10000
```

## 📁 Project Structure for Deployment

The deployment uses these key files:
- `render-deploy.js` - Main deployment entry point
- `package.json` - Root dependencies
- `utils/` - Utility functions
- `backend/routes/` - API routes
- `backend/models/` - Database models

## 🔍 Troubleshooting

### Common Issues:

1. **Module not found errors**:
   - Ensure all dependencies are in the root `package.json`
   - Check that import paths are correct

2. **MongoDB connection issues**:
   - Verify `MONGO_URI` is correct
   - Check if MongoDB Atlas allows connections from OnRender IPs
   - Ensure database user has proper permissions

3. **Environment variable errors**:
   - All required variables must be set in OnRender dashboard
   - Check for typos in variable names

4. **Port binding issues**:
   - OnRender automatically sets the `PORT` environment variable
   - Don't hardcode port numbers

### Debug Steps:

1. **Check build logs** in OnRender dashboard
2. **Verify environment variables** are set correctly
3. **Test MongoDB connection** locally first
4. **Check import paths** in `render-deploy.js`

## 🚀 After Deployment

1. **Test your endpoints**:
   - Health check: `https://your-app.onrender.com/`
   - API endpoints: `https://your-app.onrender.com/api/`

2. **Update Twitch App**:
   - Go to [Twitch Developer Console](https://dev.twitch.tv/console)
   - Update your app's redirect URI to: `https://your-app-name.onrender.com/auth/twitch/callback`

3. **Test authentication flow**:
   - Try logging in with Twitch
   - Verify sessions are stored in MongoDB

## 📊 Monitoring

- **OnRender Dashboard**: Monitor logs, performance, and errors
- **MongoDB Atlas**: Check database connections and performance
- **Application Logs**: View console output in OnRender dashboard

## 🔒 Security Notes

- All sensitive data is stored in environment variables
- Sessions are encrypted and stored in MongoDB
- Rate limiting is enabled (100 requests per 15 minutes per IP)
- Security headers are configured with Helmet.js
- CORS is properly configured for production

## 🆘 Support

If you encounter issues:
1. Check the OnRender documentation
2. Review the build and runtime logs
3. Verify all environment variables are set
4. Test the application locally first

## 🎯 Success Checklist

- [ ] Repository connected to OnRender
- [ ] All environment variables set
- [ ] Build completes successfully
- [ ] Application starts without errors
- [ ] MongoDB connection established
- [ ] Twitch authentication working
- [ ] Sessions stored in database
- [ ] API endpoints responding correctly
