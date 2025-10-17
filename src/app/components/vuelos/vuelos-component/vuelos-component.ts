import { Component } from '@angular/core';

@Component({
  selector: 'app-vuelos-component',
  imports: [],
  templateUrl: './vuelos-component.html',
  styleUrl: './vuelos-component.scss'
})
export class VuelosComponent {
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
