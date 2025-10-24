import { Component, OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { AuthService } from "../../../services/auth/auth-service"
import { Empleado } from "../../../models/empleado"
import { Persona } from "../../../models/persona"
import { EmpleadosService } from "../../../services/empleados/empleados-service"
import { ChangeDetectorRef } from '@angular/core';


@Component({
  selector: "app-empleados-component",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./empleados-component.html",
  styleUrl: "./empleados-component.scss",
})
export class EmpleadosComponent implements OnInit {
  // ============================
  // 🔐 Usuario y autenticación
  // ============================
  usuario: Persona | null = null
  isUserMenuOpen = false
  isAdmin = false
  isUserRegistered = false



  constructor(private authService: AuthService, private serviceEmpleado: EmpleadosService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
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
    // Cargar datos de empleados
    this.loadEmpleados()
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen
  }

  handleLogin(): void {
    window.location.href = "/login"
  }

  handleRegister(): void {
    window.location.href = "/register"
  }

  handleProfile(): void {
    window.location.href = "/profile"
  }

  // ============================
  // 👩‍💼 Gestión de empleados
  // ============================
  empleados: Empleado[] = []

  // Estadísticas
  totalEmpleados = 0
  empleadosActivos = 0
  administradores = 0
  salarioPromedio = 0

  // Datos para gráficos
  adminPercentage = 0
  empleadoPercentage = 0
  supervisorPercentage = 0

  cargos: { name: string; count: number; percentage: number }[] = []

  // ============================
  // 📊 Lógica de datos
  // ============================
  loadEmpleados() {
    this.serviceEmpleado.allEmpleados().subscribe({
      next: (response: Empleado[]) => {
        this.empleados = response
        this.calculateStatistics()
        this.calculateChartData()
        this.cdr.detectChanges()
      },
      error: (err) => {
      }
    })
  }

  calculateStatistics() {
    this.totalEmpleados = this.empleados.length
    this.empleadosActivos = this.empleados.length
    // Agrupar empleados por rol
    const rolesMap = new Map<string, number>()
    this.empleados.forEach((e) => {
      const rol = e.rol.trim()
      rolesMap.set(rol, (rolesMap.get(rol) || 0) + 1)
    })
    this.administradores = Array.from(rolesMap.entries())
      .filter(([rol]) => rol.toLowerCase().includes("administrador"))
      .reduce((sum, [, count]) => sum + count, 0)
    const totalSalarios = this.empleados.reduce((sum, emp) => sum + emp.salario, 0)
    this.salarioPromedio = this.totalEmpleados > 0 ? totalSalarios / this.totalEmpleados : 0
  }

  calculateChartData() {
    // Contadores por categorías principales detectadas por palabra clave
    const adminCount = this.empleados.filter((e) =>
      e.rol.toLowerCase().includes("administrador")
    ).length
    const empleadoCount = this.empleados.filter((e) =>
      e.rol.toLowerCase().includes("empleado")
    ).length
    const supervisorCount = this.empleados.filter((e) =>
      e.rol.toLowerCase().includes("supervisor")
    ).length
    // Cálculo de porcentajes
    this.adminPercentage = this.totalEmpleados > 0 ? (adminCount / this.totalEmpleados) * 100 : 0
    this.empleadoPercentage = this.totalEmpleados > 0 ? (empleadoCount / this.totalEmpleados) * 100 : 0
    this.supervisorPercentage = this.totalEmpleados > 0 ? (supervisorCount / this.totalEmpleados) * 100 : 0
    // ---- Agrupación por cargo (sin tocar lo demás) ----
    const cargoMap = new Map<string, number>()
    this.empleados.forEach((emp) => {
      const cargo = emp.cargo || "Sin cargo"
      cargoMap.set(cargo, (cargoMap.get(cargo) || 0) + 1)
    })
    const maxCount = Math.max(...Array.from(cargoMap.values()), 0)
    this.cargos = Array.from(cargoMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: maxCount > 0 ? (count / maxCount) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }


  // ============================
  // ⚙️ Métodos CRUD
  // ============================
  agregarEmpleado() {
    alert("Función para agregar empleado — Implementar formulario")
  }

  editarEmpleado(empleado: Empleado) {
    alert(`Editar empleado: ${empleado.nombre} ${empleado.apellido}`)
  }

  eliminarEmpleado(empleado: Empleado) {
    if (confirm(`¿Está seguro de eliminar a ${empleado.nombre} ${empleado.apellido}?`)) {
      const index = this.empleados.findIndex((e) => e.id === empleado.id)
      if (index !== -1) {
        this.empleados.splice(index, 1)
        this.calculateStatistics()
        this.calculateChartData()
        alert("Empleado eliminado exitosamente")
      }
    }
  }
}