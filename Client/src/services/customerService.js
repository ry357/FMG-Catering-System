import axios from 'axios';

function getAuthHeader() {
  const token = localStorage.getItem('customerToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const customerService = {
  // Fetch profile
  async getProfile() {
    const res = await axios.get('/api/customer/profile', {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  // Update profile (name, phone, address)
  async updateProfile(profileData) {
    const res = await axios.put('/api/customer/profile', profileData, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  // Fetch bookings (events and orders history)
  async getBookings() {
    const res = await axios.get('/api/customer/bookings', {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  // Save new delivery address
  async addAddress(addressData) {
    const res = await axios.post('/api/customer/addresses', addressData, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  // Update existing saved address
  async updateAddress(addressId, addressData) {
    const res = await axios.put(`/api/customer/addresses/${addressId}`, addressData, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  // Delete saved address
  async deleteAddress(addressId) {
    const res = await axios.delete(`/api/customer/addresses/${addressId}`, {
      headers: getAuthHeader(),
    });
    return res.data;
  },

  // Set default address
  async setDefaultAddress(addressId) {
    const res = await axios.patch(`/api/customer/addresses/${addressId}/default`, {}, {
      headers: getAuthHeader(),
    });
    return res.data;
  },
};
