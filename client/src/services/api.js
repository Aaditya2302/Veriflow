import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const uploadCSV = (formData) =>
  axios.post(`${BASE_URL}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const detectColumns = (formData) =>
  axios.post(`${BASE_URL}/upload/detect`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const getHistory = () => axios.get(`${BASE_URL}/history`);
export const getUploadDetail = (id) => axios.get(`${BASE_URL}/history/${id}`);
