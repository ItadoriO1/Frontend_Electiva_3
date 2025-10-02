import { Component, ViewChild, type ElementRef, type AfterViewChecked } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"
import { SpeechService } from '../../../../services/speech/speech';
import { IaService } from '../../../../services/ia/ia-service';

interface Message {
  text: string
  type: "user" | "ai"
  time: string
}

@Component({
  selector: 'app-list-agent',
  standalone: true,
  imports: [CommonModule,
    FormsModule
  ],
  templateUrl: './list-agent.html',
  styleUrls: ['./list-agent.scss']
})

export class ListAgent implements AfterViewChecked{
  @ViewChild("chatArea") chatArea!: ElementRef

  messageText = ""
  messages: Message[] = [
    {
      text: "Hola, soy tu Agente IA General. ¿En qué puedo ayudarte hoy?",
      type: "ai",
      time: this.getCurrentTime(),
    },
  ]

  constructor(private speechService: SpeechService, private iaService: IaService) {}

  private shouldScroll = false

  isLoading = false
  errorText: string | null = null

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

  sendMessage(): void {
    const message = this.messageText.trim()

    if (message === "") {
      return
    }

    // Add user message
    this.messages.push({
      text: message,
      type: "user",
      time: this.getCurrentTime(),
    })

    // Clear input
    this.messageText = ""
    this.shouldScroll = true

    
    this.isLoading = true
    this.errorText = null
    this.iaService.sendMessage(message).subscribe({
      next: (reply: unknown) => {
        const replyText = this.formatReply(reply)
        this.messages.push({
          text: replyText,
          type: "ai",
          time: this.getCurrentTime(),
        })
        this.shouldScroll = true
        this.isLoading = false
      },
      error: (err) => {
        console.error('Error IA:', err)
        this.errorText = 'Hubo un problema obteniendo la respuesta. Intenta de nuevo.'
        this.messages.push({
          text: this.errorText,
          type: "ai",
          time: this.getCurrentTime(),
        })
        this.shouldScroll = true
        this.isLoading = false
      }
    })
  }

  private formatReply(reply: unknown): string {
    // Si ya es string, devuélvelo
    if (typeof reply === 'string') {
      return reply
    }

    // Intentar mapear estructuras conocidas
    try {
      const asObj = reply as Record<string, unknown>
      // Caso 1: { parametro_recibido: string }
      if (asObj && typeof asObj['parametro_recibido'] !== 'undefined') {
        return String(asObj['parametro_recibido'])
      }
      // Caso 2: { result: { total_personas: number } }
      const result = asObj && typeof asObj['result'] === 'object' ? asObj['result'] as Record<string, unknown> : null
      if (result && typeof result['total_personas'] !== 'undefined') {
        return `Total de personas: ${result['total_personas']}`
      }
      // Caso 3: { result: Persona } -> resumir persona
      if (result) {
        const id = result['id']
        const nombre = result['nombre']
        const apellido = result['apellido']
        const cedula = result['cedula']
        const email = result['email']
        const telefono = result['telefono']

        if (typeof id !== 'undefined' && (typeof nombre !== 'undefined' || typeof apellido !== 'undefined')) {
          const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ')
          const detalles: string[] = []
          if (typeof cedula !== 'undefined') detalles.push(`Cédula: ${cedula}`)
          if (typeof email !== 'undefined') detalles.push(`Email: ${email}`)
          if (typeof telefono !== 'undefined') detalles.push(`Teléfono: ${telefono}`)
          const detallesTexto = detalles.length ? ` ${detalles.join(' | ')}` : ''
          return `Sí, existe. Persona: ${nombreCompleto} (ID: ${id}).${detallesTexto}`
        }
      }

      // Caso 4: { result: Persona[] } -> lista de personas
      if (Array.isArray(asObj?.['result'])) {
        const personas = asObj['result'] as Array<Record<string, unknown>>
        if (personas.length === 0) return 'No hay personas registradas.'

        const filas = personas.map((p, idx) => {
          const id = p['id']
          const nombre = p['nombre']
          const apellido = p['apellido']
          const cedula = p['cedula']
          const email = p['email']
          const telefono = p['telefono']
          const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ')
          const detalles: string[] = []
          if (typeof cedula !== 'undefined') detalles.push(`Cédula: ${cedula}`)
          if (typeof email !== 'undefined') detalles.push(`Email: ${email}`)
          if (typeof telefono !== 'undefined') detalles.push(`Teléfono: ${telefono}`)
          const detallesTexto = detalles.length ? ` - ${detalles.join(' | ')}` : ''
          const titulo = nombreCompleto || `Persona ${idx + 1}`
          return `${idx + 1}. ${titulo}${typeof id !== 'undefined' ? ` (ID: ${id})` : ''}${detallesTexto}`
        })
        return `Personas encontradas (${personas.length}):\n` + filas.join('\n')
      }
    } catch {
      // Si algo falla, seguimos al fallback
    }

    // Fallback genérico legible
    try {
      return JSON.stringify(reply, null, 2)
    } catch {
      return String(reply)
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === "Enter") {
      this.sendMessage()
    }
  }

  resetChat(): void {
    this.messages = [
      {
        text: "Hola, soy tu Agente IA General. ¿En qué puedo ayudarte hoy?",
        type: "ai",
        time: this.getCurrentTime(),
      },
    ]
    this.messageText = ""
    this.shouldScroll = true
  }

  // Eliminado: respuestas simuladas aleatorias

  private scrollToBottom(): void {
    try {
      this.chatArea.nativeElement.scrollTop = this.chatArea.nativeElement.scrollHeight
    } catch (err) {
      console.error("Error scrolling to bottom:", err)
    }
  }

  speakMessage(text: string) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES'; // puedes usar 'en-US' para inglés
      utterance.rate = 1;       // velocidad (1 = normal)
      utterance.pitch = 1;      // tono
      speechSynthesis.speak(utterance);
    } else {
      console.warn("Tu navegador no soporta Speech Synthesis.");
    }
  }

  startListening(): void {
    this.speechService.startListening((transcript: string) => {
      // transcript es el texto reconocido por el micrófono
      this.messageText = transcript;
      this.sendMessage(); // opcional: enviar automáticamente
    });
  }
  
}
