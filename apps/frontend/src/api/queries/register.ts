import { apiRequest } from '../apiRequest';
import { User } from '../types/user';

type RegisterUserRequest = {
  email: string;
  password: string;
  birthYear: number;
  sex: 'male' | 'female';
};

export const registerUser = async (input: RegisterUserRequest): Promise<User> => {
  try {
    return await apiRequest<User>('/users/register', {
      method: 'POST',
      requiresAuth: false,
      body: {
        email: input.email,
        password: input.password,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('409')) {
      throw new Error('Użytkownik o podanym adresie e-mail już istnieje');
    }
    throw new Error('Błąd podczas rejestracji');
  }
};
