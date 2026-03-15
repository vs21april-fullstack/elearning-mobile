/**
 * Profile API
 * API functions for user profile management
 */

import api from '../../app/axios';

const API_BASE = '/profile';

/**
 * Get current user profile
 */
export const fetchProfile = async () => {
    const res = await api.get(`${API_BASE}/me`);
    return res.data.data;
};

/**
 * Update user profile
 */
export const updateProfile = async (profileData) => {
    const res = await api.put(`${API_BASE}/me`, profileData);
    return res.data.data;
};

/**
 * Change password
 */
export const changePassword = async (passwordData) => {
    const res = await api.post(`${API_BASE}/change-password`, passwordData);
    return res.data;
};
