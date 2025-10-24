import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Persona } from '../../models/persona';
import { loginRequest } from '../../models/loginRequest';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PersonasService {
  private readonly baseUrl = 'http://localhost:8081/Servicio1/api/personas'

  constructor(private http: HttpClient){}

  autentificate(prop: loginRequest): Observable<Persona> {
    return this.http.post<Persona>(`${this.baseUrl}/login`, prop, {
      withCredentials: true
    })
  }
  
}
