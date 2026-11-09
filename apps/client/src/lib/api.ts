import { healthResponseSchema, type HealthResponse } from '@ping-pong-gw/shared';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${apiUrl}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }
  return healthResponseSchema.parse(await response.json());
}
