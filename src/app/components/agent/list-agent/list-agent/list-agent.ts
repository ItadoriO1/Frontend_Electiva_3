import { Component, ViewChild, type ElementRef, type AfterViewChecked } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { SpeechService } from '../../../../services/speech/speech'
import { IaService } from '../../../../services/ia/ia-service'
import { ResponseFormatService } from '../../../../services/response-format/response-format-service'
import { NgZone } from '@angular/core'
import { ChangeDetectorRef } from '@angular/core'
import { Persona } from '../../../../models/persona'
import { AuthService } from '../../../../services/auth/auth-service'

interface Message {
  text: string
  type: "user" | "ai"
  time: string
}

interface DynamicTable {
  title: string
  columns: string[]
  rows: Record<string, any>[]
  timestamp: string
  isReadOnly: boolean
}

@Component({
  selector: "app-list-agent",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./list-agent.html",
  styleUrls: ["./list-agent.scss"],
})
export class ListAgent implements AfterViewChecked {
  @ViewChild("chatArea") chatArea!: ElementRef

  messageText = ""
  messages: Message[] = []
  dynamicTables: DynamicTable[] = []

  isUserMenuOpen = false
  usuario: Persona | null = null
  isAdmin = false

  private readonly formTemplates: Record<string, { title: string; columns: string[] }> = {
    "crear reserva": {
      title: "Formulario de Reserva",
      columns: ["Nombre del Usuario", "Apartamento", "Fecha de Entrada", "Fecha de Salida", "Estado"]
    },
    "crear vuelo": {
      title: "Formulario de Vuelo",
      columns: ["Número de Vuelo", "Origen", "Destino", "Fecha de Salida", "Hora de Salida"]
    },
    "crear empleado": {
      title: "Formulario de Empleado",
      columns: ["Nombre", "Apellido", "Cargo", "Salario", "Correo"]
    },
    "registrarme": {
      title: "Formulario de Registro",
      columns: ["Nombre", "Apellido", "Cédula", "Teléfono", "Correo", "Contraseña", "Confirmar Contraseña"]
    },
    "crear avion": {
      title: "Formulario de Aviones",
      columns: ["Numasiento", "aerolinea", "capacidad", "modelo", "usuario", "vuelo"]
    },
    "crear usuario": {
      title: "Formulario de Usuario",
      columns: ["cedula","nombre", "apellido", "telefono", "email", "contrasenia", "direccion"]
    }
  }

  constructor(
    private speechService: SpeechService,
    private iaService: IaService,
    private responseFormatService: ResponseFormatService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  private shouldScroll = false
  isLoading = false
  errorText: string | null = null
  isUserRegistered = false

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom()
      this.shouldScroll = false
    }
  }

  getCurrentTime(): string {
    const now = new Date()
    return now.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  private detectFormIntent(message: string): { title: string; columns: string[] } | null {
    const normalize = (text: string) =>
      text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/\s+/g, ' ') // collapse spaces
        .trim()

    const normalizedMessage = normalize(message)

    const containsTokensInOrder = (haystack: string, key: string): boolean => {
      const tokens = normalize(key).split(' ').filter(Boolean)
      let startIndex = 0
      for (const token of tokens) {
        const idx = haystack.indexOf(token, startIndex)
        if (idx === -1) return false
        startIndex = idx + token.length
      }
      return true
    }

    for (const [key, template] of Object.entries(this.formTemplates)) {
      if (containsTokensInOrder(normalizedMessage, key)) {
        return template
      }
    }
    return null
  }

  private addDynamicTable(title: string, columns: string[], rows: Record<string, any>[], options?: { isReadOnly?: boolean }): void {
    const newTable: DynamicTable = {
      title,
      columns,
      rows,
      timestamp: this.getCurrentTime(),
      isReadOnly: options?.isReadOnly ?? false,
    }
    this.dynamicTables.push(newTable)
    console.log("[v0] 📊 Tabla dinámica agregada:", title, "con", rows.length, "filas")
  }

  removeTable(index: number): void {
    if (index >= 0 && index < this.dynamicTables.length) {
      const removedTable = this.dynamicTables.splice(index, 1)[0]
      console.log("[v0] 🗑️ Tabla eliminada:", removedTable.title)
    }
  }

  /**
   * 🚀 Cambio clave: sendMessage ahora solo genera tabla si detecta intención de formulario
   */
  sendMessage(): void {
    const message = this.messageText.trim()
    if (message === "" || this.isLoading) return

    this.messages.push({
      text: message,
      type: "user",
      time: this.getCurrentTime(),
    })

    this.messageText = ""
    this.shouldScroll = true
    this.cdr.detectChanges()

    this.isLoading = true
    this.errorText = null

    // Detectar si el mensaje es para crear un formulario
    const formIntent = this.detectFormIntent(message)
    if (formIntent) {
      // Crear tabla inicial con fila vacía
      const rows = [Object.fromEntries(formIntent.columns.map(c => [c, ""]))]
      this.addDynamicTable(formIntent.title, formIntent.columns, rows)

      this.isLoading = false // Ya no está cargando
      this.cdr.detectChanges()
      console.log("[sendMessage] 🧾 Formulario detectado:", formIntent.title)
      return // NO enviar mensaje a la IA todavía
    }

    // Si NO es formulario, sí enviar mensaje a la IA
    this.iaService.sendMessage(message).subscribe({
      next: (reply: unknown) => {
        this.ngZone.run(() => {
          try {
            const formatted = this.responseFormatService.formatResponse(reply)
            const replyText = formatted.text?.trim()

            if (!replyText) {
              if (!formatted.table) {
                throw new Error('Respuesta vacía del formateador')
              }
              this.messages.push({
                text: '📊 Se generó una tabla con los resultados.',
                type: "ai",
                time: this.getCurrentTime(),
              })
            } else {
              this.messages.push({
                text: replyText,
                type: "ai",
                time: this.getCurrentTime(),
              })
            }

            if (formatted.table) {
              this.addDynamicTable(
                formatted.table.title,
                formatted.table.columns,
                formatted.table.rows,
                { isReadOnly: true }
              )
            }
            this.isLoading = false
            this.shouldScroll = true
            this.cdr.detectChanges()
          } catch (formatError) {
            console.error('❌ Error al formatear la respuesta:', formatError)
            this.messages.push({
              text: 'Error al procesar la respuesta de la IA.',
              type: "ai",
              time: this.getCurrentTime(),
            })
            this.isLoading = false
            this.cdr.detectChanges()
          }
        })
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.errorText = 'Hubo un problema obteniendo la respuesta. Intenta de nuevo.'
          this.messages.push({
            text: this.errorText,
            type: "ai",
            time: this.getCurrentTime(),
          })
          this.isLoading = false
          this.shouldScroll = true
          this.cdr.detectChanges()
        })
      },
    })

    console.log("[sendMessage] 🕒 Mensaje enviado a IA:", message)
  }

  /**
   * Cuando el usuario confirma la tabla, se envían los datos a la IA
   */
  confirmTable(index: number): void {
    const table = this.dynamicTables[index]
    if (table.isReadOnly) {
      console.warn("[confirmTable] ❌ La tabla es de solo lectura.")
      return
    }

    const rowsText = table.rows.map(row =>
      table.columns.map(col => `${col}: ${row[col]}`).join(", ")
    ).join("\n")

    const messageToIA = `Datos ingresados en "${table.title}":\n${rowsText}`

    this.messages.push({
      text: messageToIA,
      type: "user",
      time: this.getCurrentTime(),
    })
    this.shouldScroll = true
    this.cdr.detectChanges()

    // Ahora sí enviamos mensaje a la IA
    this.messageText = messageToIA
    this.isLoading = true
    this.sendMessage()

    this.removeTable(index)
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === "Enter" && !this.isLoading) {
      this.sendMessage()
    }
  }

  resetChat(): void {
    this.messages = []
    this.messageText = ""
    this.isLoading = false
    this.errorText = null
    this.shouldScroll = true
    this.cdr.detectChanges()
  }

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.chatArea?.nativeElement) {
          this.chatArea.nativeElement.scrollTop = this.chatArea.nativeElement.scrollHeight
        }
      }, 100)
    } catch (err) {
      console.error("Error scrolling to bottom:", err)
    }
  }

  speakMessage(text: string) {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "es-ES"
      utterance.rate = 1
      utterance.pitch = 1
      speechSynthesis.speak(utterance)
    } else {
      console.warn("Tu navegador no soporta Speech Synthesis.")
    }
  }

  startListening(): void {
    if (this.isLoading) return

    this.speechService.startListening((transcript: string) => {
      this.messageText = transcript
      this.sendMessage()
    })
  }

  trackByIndex(index: number, item: Message): number {
    return index
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen
  }

  handleLogin(): void {
    window.location.href = '/login'
  }

  handleRegister(): void {
    window.location.href = '/register'
  }

  handleEdit(): void {
    window.location.href = '/edit'
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
        this.usuario = null;
        this.isUserRegistered = false;
        this.isAdmin = false;
        this.cdr.detectChanges();
      }
    });
    this.cdr.detectChanges();
  }
}
