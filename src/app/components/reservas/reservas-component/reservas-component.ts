import { Component } from '@angular/core';

@Component({
  selector: 'app-reservas-component',
  imports: [],
  templateUrl: './reservas-component.html',
  styleUrl: './reservas-component.scss'
})
export class ReservasComponent {

  isUserMenuOpen = false
  /**
  **
   * Funcion para mostrar o ocultar los objetos en el menu
   */
  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen
  }

  /**
   * Funcion para redirigir el usuario al login
   */
  handleLogin(): void {
    window.location.href = '/login'
  }

  /**
   * Funcion para redirigir el usuario al registro
   */
  handleRegister(): void {
    window.location.href = '/register'
  }
}
