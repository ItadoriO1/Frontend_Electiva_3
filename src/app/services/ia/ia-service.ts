import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class IaService {
  private readonly baseUrl = 'http://127.0.0.1:5000/query';

  constructor(private http: HttpClient) {}

  // Envía el mensaje del usuario al microservicio de IA y devuelve el texto de respuesta
  sendMessage(message: string): Observable<string> {
    const payload = { consulta: message };  // coincide con lo que Flask espera
    return this.http.post<{ parametro_recibido: string }>(this.baseUrl, payload)
    .pipe(map(res => res.parametro_recibido));  // coincide con la respuesta del backend
  }
}
