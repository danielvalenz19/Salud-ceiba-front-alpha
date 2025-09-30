import api from './client';

export type UserDTO = {
	user_id?: number;
	nombre: string;
	email: string;
	rol: 'admin' | 'user';
	activo?: number | boolean;
};

export async function getUsers() {
	const { data } = await api.get('/users');
	return data as UserDTO[];
}

export async function getUserById(id: number | string) {
	const { data } = await api.get(`/users/${id}`);
	return data as UserDTO;
}

export async function createUser(payload: {
	nombre: string;
	email: string;
	password: string; // requerido al crear
	rol: 'admin' | 'user';
}) {
	const { data } = await api.post('/users', payload);
	return data;
}

export async function updateUser(
	id: number | string,
	payload: Partial<Omit<UserDTO, 'user_id'>>
) {
	const { data } = await api.put(`/users/${id}`, payload);
	return data;
}

