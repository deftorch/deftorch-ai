import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWeather } from '@/lib/ai/tools/get-weather';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('getWeather Tool', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should return error if no arguments are provided', async () => {
    // Calling the execute function of the tool directly
    // @ts-ignore - bypassing specific context types for simple unit test
    const result = await getWeather.execute({}, { toolCallId: '1', messages: [] });
    expect(result).toEqual({ 
      error: "Please provide either a city name or both latitude and longitude coordinates." 
    });
  });

  it('should geocode city and fetch weather', async () => {
    // 1st call: Mock geocoding response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [{ latitude: 40.71, longitude: -74.01 }] })
    });

    // 2nd call: Mock weather response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ current: { temperature_2m: 25 } })
    });

    // @ts-ignore
    const result = await getWeather.execute({ city: 'New York' }, { toolCallId: '2', messages: [] });
    
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      current: { temperature_2m: 25 },
      cityName: 'New York'
    });
  });

  it('should fetch weather directly with coordinates', async () => {
    // 1st call: Mock weather response directly
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ current: { temperature_2m: 30 } })
    });

    // @ts-ignore
    const result = await getWeather.execute({ latitude: 10, longitude: 20 }, { toolCallId: '3', messages: [] });
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      current: { temperature_2m: 30 }
    });
  });
});
