import { apiRequest } from '../apiRequest';

export const deleteUser = async (userId: string): Promise<void> => {
  return apiRequest(`/users/${userId}`, {
    method: 'DELETE',
  });
};
