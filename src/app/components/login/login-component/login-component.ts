import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.scss'
})
export class LoginComponent {
  email = ""
  password = ""
  rememberMe = false

  // Replace this URL with your own video file (MP4, WebM, etc.)
  videoUrl = 'video.mp4'

  onSubmit(): void {
    console.log("[v0] Login attempt:", {
      email: this.email,
      rememberMe: this.rememberMe,
    })

    // TODO: Implement actual login logic
    // Example: this.authService.login(this.email, this.password)
  }
}
