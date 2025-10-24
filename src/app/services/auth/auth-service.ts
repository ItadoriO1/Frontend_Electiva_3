import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Persona } from '../../models/persona';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {}

  // Obtener el usuario actual directamente desde la cookie JWT
  getUsuarioActual(): Observable<Persona> {
    return this.http.get<Persona>('http://localhost:8081/Servicio1/api/personas/me', { withCredentials: true });
  }
}
