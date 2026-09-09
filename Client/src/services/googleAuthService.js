import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const googleAuthService = {
  async verifyCredential(credential) {
    try {
      console.log('🔐 Sending Google credential to verify endpoint...');
      
      if (!credential) {
        console.error('❌ No credential provided');
        throw new Error('No credential provided');
      }

      console.log(`✉️  POST ${API_BASE}/google-auth/verify`);
      
      const response = await axios.post(`${API_BASE}/google-auth/verify`, { credential });
      
      console.log('✅ Google verification successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Google verification failed:');
      if (error.response) {
        console.error('  Status:', error.response.status);
        console.error('  Data:', error.response.data);
      } else if (error.request) {
        console.error('  No response received - network error or CORS issue');
        console.error('  Request:', error.request);
      } else {
        console.error('  Error:', error.message);
      }
      throw error;
    }
  },
};

export default googleAuthService;