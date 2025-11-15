import { Component, type OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Persona } from '../../../models/persona'
import { AuthService } from '../../../services/auth/auth-service'
import { Vuelo } from '../../../models/vuelo'
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms'
import { ReservasSave } from '../../reservas/reservas-save/reservas-save/reservas-save'
import { Reserva } from '../../../models/reserva'
import { VueloService } from '../../../services/vuelos/vuelo-service'
import { ReservaService } from '../../../services/reservas/reserva-service'


// Interfaz para los datos del gráfico de destinos/aerolíneas
interface ChartData {
  name: string
  count: number
  percentage: number
}

@Component({
  selector: 'app-vuelos-component',
  standalone: true,
  imports: [CommonModule, FormsModule, ReservasSave],
  templateUrl: './vuelos-component.html',
  styleUrls: ['./vuelos-component.scss'],
})
export class VuelosComponent implements OnInit {
  // 🔹 Propiedades de la barra lateral y usuario (Mantenidas)
  usuario: Persona | null = null
  isAdmin = false
  isUserRegistered = false
  isUserMenuOpen = false
  isEmpleado = false


  // 🔹 Propiedades para el Dashboard de Vuelos Disponibles (Nuevas/Actualizadas)
  totalVuelosDisponibles = 0
  vuelosEnOferta = 0
  destinosUnicos = 0
  vuelosProximos = 0

  // Lista de vuelos disponibles para la tabla
  vuelosDisponibles: Vuelo[] = []

  // Datos para gráfico de destinos
  destinations: ChartData[] = []

  mostrarModalSaveReserva = false;
  reservaSeleccionada: Reserva | null = null;
  vueloSeleccionadoParaReserva: Vuelo | null = null;

  constructor(private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private vueloService: VueloService,
    private reservaService: ReservaService
  ) { }

  ngOnInit(): void {
    // 🔹 Obtener usuario autenticado
    this.authService.getUsuarioActual().subscribe({
      next: usuario => {
        this.usuario = usuario;
        this.isUserRegistered = !!usuario;
        this.isAdmin = usuario?.rol === 'Admin';
        this.isEmpleado = usuario?.rol === 'Empleado';
        this.cdr.detectChanges();
      },
      error: err => {
        this.usuario = null;
        this.isUserRegistered = false;
        this.isAdmin = false;
        this.cdr.detectChanges();
      }
    });

    // 🔹 Lógica de carga de datos
    this.loadVuelosData();
  }

  /**
   * Función genérica para calcular datos para los gráficos.
   * @param property 'destino' o 'aerolinea', la propiedad del objeto Vuelo a agrupar.
   * @returns Un array de objetos ChartData para usar en las gráficas.
   */
  private calculateChartData(property: keyof Vuelo): ChartData[] {
    const total = this.vuelosDisponibles.length;
    if (total === 0) return [];

    const counts = this.vuelosDisponibles.reduce((acc, vuelo) => {
      // Usamos 'as string' para asegurar que la clave es un string, aunque en Vuelo
      // 'destino' y 'aerolinea' ya son string.
      const key = vuelo[property] as string;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Convertimos el objeto de conteos a un array con el formato requerido
    return Object.keys(counts).map(key => ({
      name: key,
      count: counts[key],
      percentage: parseFloat(((counts[key] / total) * 100).toFixed(2)) // Redondea a 2 decimales
    }));
  }

  /**
   * Resetea todas las estadísticas a cero.
   */
  private resetStatistics(): void {
    this.totalVuelosDisponibles = 0;
    this.vuelosEnOferta = 0;
    this.destinosUnicos = 0;
    this.vuelosProximos = 0;
    this.destinations = [];
  }

  // 🔹 Método refactorizado para cargar datos del dashboard de forma dinámica
  loadVuelosData(): void {
    this.vueloService.getAllVuelos().subscribe((data: Vuelo[]) => {
      this.vuelosDisponibles = data;

      // Si no llegan datos, resetea las estadísticas
      if (!data || data.length === 0) {
        this.resetStatistics();
        this.cdr.detectChanges();
        return;
      }

      // --- 1. Cálculo de Estadísticas Dinámicas ---
      this.totalVuelosDisponibles = this.vuelosDisponibles.length;

      // Filtra vuelos por estado 'Oferta' (asumo que el estado 'Oferta' se usa para vuelos en oferta)
      this.vuelosEnOferta = this.vuelosDisponibles.filter(v => v.estado.toLowerCase() === 'oferta').length;

      // Calcula destinos únicos
      const destinos = new Set(this.vuelosDisponibles.map(v => v.destino));
      this.destinosUnicos = destinos.size;

      // Filtra vuelos cuya fecha está en los próximos 7 días
      const ahora = new Date();
      const unaSemanaDespues = new Date();
      unaSemanaDespues.setDate(ahora.getDate() + 7);

      this.vuelosProximos = this.vuelosDisponibles.filter(v => {
        // Convertir la fecha del vuelo a objeto Date para la comparación
        // Nota: Asumo que v.fecha es un string que Date puede parsear o ya es un objeto Date.
        // Si es un string, asegúrate de que el formato sea ISO 8601 (YYYY-MM-DD) para evitar problemas de zona horaria.
        const fechaVuelo = new Date(v.fecha);
        // Compara solo la parte de la fecha, ignorando la hora para simplificar
        fechaVuelo.setHours(0, 0, 0, 0);
        ahora.setHours(0, 0, 0, 0);
        unaSemanaDespues.setHours(0, 0, 0, 0);

        return fechaVuelo >= ahora && fechaVuelo <= unaSemanaDespues;
      }).length;


      // --- 2. Generación de Datos para Gráficos ---
      this.destinations = this.calculateChartData('destino');

      // Notifica a Angular para que actualice la vista
      this.cdr.detectChanges();
    });
  }

  // 🔹 Método para iniciar la reserva (Mantenido)
  iniciarReserva(vuelo: Vuelo): void {
    // 1. Crear un objeto Reserva inicial con los datos del Vuelo y el usuario
    // Asumo que tienes una interfaz Reserva con las propiedades necesarias
    const nuevaReserva: Reserva = {
      id: null, // Se genera automáticamente
      usuario: this.usuario?.email || 'Invitado', // O el ID real del usuario
      vuelo: vuelo.codigoVuelo, // Usamos el código de vuelo
      estado: 'PENDIENTE', // Estado inicial
      numasiento: '', // Se llenará en el modal
    };
    // 2. Asignar la reserva inicial a la variable que el modal espera
    this.reservaSeleccionada = nuevaReserva;
    this.reservaSeleccionada.usuario = this.usuario?.email ?? "";
    // 3. Abrir el modal
    this.mostrarModalSaveReserva = true;
  }

  // 🔹 Métodos para el modal (Mantenidos)
  cerrarModalSaveReserva(): void {
    this.mostrarModalSaveReserva = false;
    this.reservaSeleccionada = null;
  }

  // 🔹 Mostrar/ocultar menú de usuario (Mantenido)
  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen
  }

  // 🔹 Acciones del menú (Mantenidas)
  handleLogin(): void {
    window.location.href = '/login'
    this.isUserMenuOpen = false
  }

  handleRegister(): void {
    window.location.href = '/register'
    this.isUserMenuOpen = false
  }

  handleEditProfile(): void {
    window.location.href = '/edit'
    this.isUserMenuOpen = false
  }

  GuardarReserva(reserva:Reserva): void{
    this.reservaService.crearReserva(reserva).subscribe({
      next: () => {
        alert('Reserva guardada con exito')
        this.cerrarModalSaveReserva()
        this.loadVuelosData()
      },
      error: () => alert('Error al guardar la reserva')
    })
  }

  editarVuelo(vuelo:Vuelo){}

  eliminarVuelo(vuelo:Vuelo){}

  agregarVuelo(){}
}
