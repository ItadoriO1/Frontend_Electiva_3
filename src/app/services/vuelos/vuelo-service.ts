import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Vuelo } from '../../models/vuelo';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VueloService {
  
  private readonly baseUrl = 'http://localhost:8080/ServiceVuelos/api/vuelos'

  constructor(private http: HttpClient){}

  getAllVuelos():Observable<Vuelo[]>{
    return this.http.get<Vuelo[]>(`${this.baseUrl}`, { withCredentials: true })
  }
}
