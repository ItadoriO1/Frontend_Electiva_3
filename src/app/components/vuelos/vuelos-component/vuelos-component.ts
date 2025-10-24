import { Component, type OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Persona } from '../../../models/persona'
import { AuthService } from '../../../services/auth/auth-service'
import { Vuelo } from '../../../models/vuelo'
import { ChangeDetectorRef } from '@angular/core';

interface Flight {
  id: number
  number: string
  origin: string
  destination: string
  date: string
  time: string
  status: 'completed' | 'pending' | 'cancelled'
}

interface Destination {
  name: string
  count: number
  percentage: number
}

@Component({
  selector: 'app-vuelos-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vuelos-component.html',
  styleUrls: ['./vuelos-component.scss'],
})
export class VuelosComponent implements OnInit {
  // 🔹 Usuario autenticado
  usuario: Persona | null = null
  isAdmin = false
  isUserRegistered = false
  isUserMenuOpen = false

  // 🔹 Estadísticas de vuelos
  totalFlights = 24
  completedFlights = 15
  pendingFlights = 7
  cancelledFlights = 2

  completedPercentage = 0
  pendingPercentage = 0
  cancelledPercentage = 0

  // 🔹 Datos para gráfico de destinos
  destinations: Destination[] = [
    { name: 'Miami', count: 8, percentage: 33 },
    { name: 'Nueva York', count: 6, percentage: 25 },
    { name: 'Los Ángeles', count: 5, percentage: 21 },
    { name: 'Madrid', count: 3, percentage: 13 },
    { name: 'París', count: 2, percentage: 8 },
  ]

  // 🔹 Lista de vuelos (ejemplo)
  flights: Flight[] = [
    {
      id: 1,
      number: 'AA1234',
      origin: 'Ciudad de México',
      destination: 'Miami',
      date: '2025-01-25',
      time: '08:30',
      status: 'pending',
    },
    {
      id: 2,
      number: 'UA5678',
      origin: 'Guadalajara',
      destination: 'Nueva York',
      date: '2025-01-26',
      time: '14:15',
      status: 'pending',
    },
    {
      id: 3,
      number: 'DL9012',
      origin: 'Monterrey',
      destination: 'Los Ángeles',
      date: '2025-01-27',
      time: '10:45',
      status: 'completed',
    },
    {
      id: 4,
      number: 'IB3456',
      origin: 'Cancún',
      destination: 'Madrid',
      date: '2025-01-28',
      time: '18:00',
      status: 'pending',
    },
    {
      id: 5,
      number: 'AF7890',
      origin: 'Ciudad de México',
      destination: 'París',
      date: '2025-01-29',
      time: '22:30',
      status: 'cancelled',
    },
  ]

  constructor(private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 🔹 Obtener usuario autenticado
    this.authService.getUsuarioActual().subscribe({
      next: usuario => {
        this.usuario = usuario;
        this.isUserRegistered = !!usuario;
        this.isAdmin = usuario?.rol === 'Admin';
        this.cdr.detectChanges();
      },
      error: err => {
        // Por ejemplo, si no hay token o el usuario no está autenticado
        this.usuario = null;
        this.isUserRegistered = false;
        this.isAdmin = false;
        this.cdr.detectChanges();
      }
    });

    // 🔹 Calcular porcentajes al inicializar
    this.calculatePercentages()
  }

  // 🔹 Cálculo de porcentajes
  calculatePercentages(): void {
    this.completedPercentage = Math.round((this.completedFlights / this.totalFlights) * 100)
    this.pendingPercentage = Math.round((this.pendingFlights / this.totalFlights) * 100)
    this.cancelledPercentage = Math.round((this.cancelledFlights / this.totalFlights) * 100)
  }

  // 🔹 Mostrar/ocultar menú de usuario
  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen
  }

  // 🔹 Acciones del menú
  handleLogin(): void {
    window.location.href = '/login'
    this.isUserMenuOpen = false
  }

  handleRegister(): void {
    window.location.href = '/register'
    this.isUserMenuOpen = false
  }

  handleProfile(): void {
    console.log('[v0] Profile clicked')
    this.isUserMenuOpen = false
  }

  // 🔹 Traducción de estados
  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      completed: 'Completado',
      pending: 'Pendiente',
      cancelled: 'Cancelado',
    }
    return labels[status] || status
  }

  // 🔹 Optimización *ngFor
  trackByFlight(index: number, flight: Flight): number {
    return flight.id
  }
}
