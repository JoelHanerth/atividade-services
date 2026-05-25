import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, switchMap, throwError } from 'rxjs';

export interface ResultadoCidade {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

interface RespostaGeocodificacao {
  results?: ResultadoCidade[];
}

interface RespostaPrevisao {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
}

export interface PrevisaoDiaria {
  date: string;
  label: string;
  max: number;
  min: number;
  precipitationProbability: number;
  condition: string;
}

export interface RelatorioClima {
  city: ResultadoCidade;
  updatedAt: string;
  current: {
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
    condition: string;
  };
  daily: PrevisaoDiaria[];
}

@Injectable({
  providedIn: 'root',
})
export class PrevisaoTempo {
  private readonly geocodingUrl = 'https://geocoding-api.open-meteo.com/v1/search';
  private readonly forecastUrl = 'https://api.open-meteo.com/v1/forecast';

  constructor(private readonly http: HttpClient) {}

  buscarClimaPorCidade(cityName: string) {
    const searchParams = new HttpParams()
      .set('name', cityName.trim())
      .set('count', 1)
      .set('language', 'pt')
      .set('format', 'json');

    return this.http.get<RespostaGeocodificacao>(this.geocodingUrl, { params: searchParams }).pipe(
      switchMap((response) => {
        const city = response.results?.[0];

        if (!city) {
          return throwError(() => new Error('Cidade não encontrada. Tente informar cidade e estado.'));
        }

        const forecastParams = new HttpParams()
          .set('latitude', city.latitude)
          .set('longitude', city.longitude)
          .set(
            'current',
            [
              'temperature_2m',
              'relative_humidity_2m',
              'apparent_temperature',
              'precipitation',
              'weather_code',
              'wind_speed_10m',
            ].join(','),
          )
          .set(
            'daily',
            [
              'weather_code',
              'temperature_2m_max',
              'temperature_2m_min',
              'precipitation_probability_max',
            ].join(','),
          )
          .set('timezone', 'auto')
          .set('forecast_days', 5);

        return this.http.get<RespostaPrevisao>(this.forecastUrl, { params: forecastParams }).pipe(
          map((forecast) => ({
            city,
            updatedAt: forecast.current.time,
            current: {
              temperature: forecast.current.temperature_2m,
              apparentTemperature: forecast.current.apparent_temperature,
              humidity: forecast.current.relative_humidity_2m,
              precipitation: forecast.current.precipitation,
              windSpeed: forecast.current.wind_speed_10m,
              condition: this.getCondition(forecast.current.weather_code),
            },
            daily: forecast.daily.time.map((date, index) => ({
              date,
              label: this.formatDay(date, index),
              max: forecast.daily.temperature_2m_max[index],
              min: forecast.daily.temperature_2m_min[index],
              precipitationProbability: forecast.daily.precipitation_probability_max[index],
              condition: this.getCondition(forecast.daily.weather_code[index]),
            })),
          })),
        );
      }),
    );
  }

  private formatDay(date: string, index: number): string {
    if (index === 0) {
      return 'Hoje';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    }).format(new Date(`${date}T12:00:00`));
  }

  private getCondition(code: number): string {
    const conditions: Record<number, string> = {
      0: 'Céu limpo',
      1: 'Principalmente limpo',
      2: 'Parcialmente nublado',
      3: 'Nublado',
      45: 'Nevoeiro',
      48: 'Nevoeiro com geada',
      51: 'Garoa fraca',
      53: 'Garoa moderada',
      55: 'Garoa forte',
      61: 'Chuva fraca',
      63: 'Chuva moderada',
      65: 'Chuva forte',
      71: 'Neve fraca',
      73: 'Neve moderada',
      75: 'Neve forte',
      80: 'Pancadas fracas',
      81: 'Pancadas moderadas',
      82: 'Pancadas fortes',
      95: 'Trovoadas',
      96: 'Trovoadas com granizo',
      99: 'Trovoadas fortes',
    };

    return conditions[code] ?? 'Condição variável';
  }
}
