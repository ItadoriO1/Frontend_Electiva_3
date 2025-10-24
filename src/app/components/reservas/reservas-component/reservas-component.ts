import { Component } from '@angular/core';
import { Persona } from '../../../models/persona';
import { AuthService } from '../../../services/auth/auth-service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-reservas-component',
  imports: [CommonModule],
  templateUrl: './reservas-component.html',
  styleUrl: './reservas-component.scss'
})
export class ReservasComponent {

  constructor(private authService: AuthService,
    private cdr: ChangeDetectorRef
  ){}

  isUserMenuOpen = false
  usuario: Persona|null = null
  isAdmin = false
  isUserRegistered = false
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
  }
}
