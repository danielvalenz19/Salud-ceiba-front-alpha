import axios from 'axios';
import { getAccessToken } from '../session';

const baseURL =
	(typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
	(typeof process !== 'undefined' && (process as any).env?.NEXT_PUBLIC_API_URL) ||
	'http://localhost:4000/api/v1';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
	const token = getAccessToken();
	if (token) {
		config.headers = config.headers ?? {};
		(config.headers as any).Authorization = `Bearer ${token}`;
	}
	return config;
});

export default api;

