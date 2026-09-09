# Google Sign-In Debugging Guide

## Steps to Test and Capture Logs:

1. **Open Developer Console in Browser:**
   - Press `F12` or `Ctrl+Shift+I`
   - Go to the **Console** tab
   - Keep it open while testing

2. **Go to Booking Page:**
   - Navigate to http://localhost:5173
   - Click "Book Now"
   - Fill in event details and click "Continue to Payment"
   - You should see the "Sign in to Continue" screen

3. **Attempt Google Sign-In:**
   - Click the Google sign-in button
   - Look at the **browser console** for logs starting with 🔐, ✅, ❌
   - Look at the **terminal** running the server for backend logs

4. **Capture All Logs:**
   - Screenshot or note all console logs
   - Screenshot the server terminal output
   - This will show us exactly where the failure occurs

## What the Logs Mean:

**Frontend Logs (Browser Console):**
- 🔐 Sending Google credential = Frontend is sending the request
- ❌ Google verification failed = Backend returned an error
- Network error = CORS or connectivity issue

**Backend Logs (Server Terminal):**
- 🔐 Verifying Google token = Token verification starting
- ❌ GOOGLE_CLIENT_ID not configured = Missing env var
- 👤 Google user = Token was valid
- 🔍 Looking up customer = Querying database
- 📝 Creating new customer = New customer being created
- ❌ Google auth error = Something failed

## Common Issues:

1. **"Google OAuth not configured"** = GOOGLE_CLIENT_ID missing in Server/.env
2. **"Invalid Google token"** = Client ID mismatch
3. **Database error** = Schema or query issue
4. **CORS error** = Browser blocked the request
5. **Network error** = Can't reach the server

Please run through these steps and share the logs you see!
