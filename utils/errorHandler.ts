import { AxiosError } from 'axios';

export function handleApiError(error: AxiosError): never {
  if (error.response) {
    const errorMessage = `API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
    throw new Error(errorMessage);
  } else if (error.request) {
    throw new Error('API Error: No response received');
  } else {
    throw new Error(`API Error: ${error.message}`);
  }
}
