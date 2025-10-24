import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Empleado } from '../../models/empleado';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {
  private readonly Base_Url = 'http://localhost:8081/Servicio1/api/empleados'

  constructor(private http: HttpClient){}

  saveEmpleado(prop: Empleado):Observable<Empleado>{
    return this.http.post<Empleado>(`${this.Base_Url}/save`, prop, { withCredentials: true })
  }

  allEmpleados():Observable<Empleado[]>{
    return this.http.get<Empleado[]>(`${this.Base_Url}/all`, { withCredentials: true })
  }

}
