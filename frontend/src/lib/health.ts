const HEALTH_API_PATH = '/api/v1/health';

export interface HealthStatus {
  status: 'ready' | 'unavailable';
  message: string;
  setup_steps?: string[];
}

export const fetchHealthStatus = async (): Promise<HealthStatus> => {
  try {
    const response = await fetch(HEALTH_API_PATH);
    const healthStatus = (await response.json()) as HealthStatus;

    if (!response.ok) {
      return {
        status: 'unavailable',
        message: healthStatus.message || 'The database is not ready.',
        setup_steps: healthStatus.setup_steps,
      };
    }

    return healthStatus;
  } catch {
    return {
      status: 'unavailable',
      message: 'The backend server or database is not ready.',
    };
  }
};
