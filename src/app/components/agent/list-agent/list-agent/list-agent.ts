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



/**
 * Interfaz que define la estructura de un mensaje en el chat
 * @interface Message
 */
interface Message {
  text: string // Contenido del mensaje
  type: "user" | "ai" // Tipo de mensaje: usuario o IA
  time: string // Timestamp del mensaje
}

/**
 * Interfaz que define la estructura de una tabla dinámica
 * @interface DynamicTable
 */
interface DynamicTable {
  title: string // Título de la tabla
  columns: string[] // Nombres de las columnas
  rows: Record<string, any>[] // Filas de datos (objetos con claves dinámicas)
  timestamp: string // Timestamp de creación
}

/**
 * Componente que maneja la interfaz de chat con un agente de IA
 * Permite enviar mensajes de texto, usar reconocimiento de voz y síntesis de voz
 * @component
 */
@Component({
  selector: "app-list-agent",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./list-agent.html",
  styleUrls: ["./list-agent.scss"],
})
export class ListAgent implements AfterViewChecked {
  // Referencia al área de chat para controlar el scroll
  @ViewChild("chatArea") chatArea!: ElementRef

  // Texto del mensaje que está escribiendo el usuario
  messageText = ""

  // Array de mensajes del chat
  messages: Message[] = []

  // Array for dynamic tables
  dynamicTables: DynamicTable[] = []

  //Variable para controlar visibilidad del menu
  isUserMenuOpen = false

  usuario: Persona|null = null

  isAdmin = false


  /**
   * Constructor que inyecta los servicios necesarios
   * @param speechService Servicio para reconocimiento de voz
   * @param iaService Servicio para comunicación con IA
   * @param responseFormatService Servicio para formatear respuestas
   * @param ngZone Servicio para manejo de zonas de Angular
   * @param cdr Servicio para detección de cambios manual
   */
  constructor(
    private speechService: SpeechService,
    private iaService: IaService,
    private responseFormatService: ResponseFormatService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  // Flag para controlar cuándo hacer scroll automático
  private shouldScroll = false

  // Estado de carga para mostrar indicadores visuales
  isLoading = false

  // Mensaje de error si algo falla
  errorText: string | null = null

  isUserRegistered = false

  /**
   * Hook del ciclo de vida que se ejecuta después de cada verificación de vista
   * Se usa para hacer scroll automático cuando hay nuevos mensajes
   */
  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom()
      this.shouldScroll = false
    }
  }

  /**
   * Obtiene la hora actual formateada en español
   * @returns String con la hora en formato HH:MM:SS
   */
  getCurrentTime(): string {
    const now = new Date()
    return now.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  /**
   * Detecta si la respuesta contiene una lista y la extrae
   * Soporta múltiples formatos de listas (numeradas, con guiones, bullets, etc.)
   * @param text Texto de la respuesta de la IA
   * @returns Objeto con información de la lista o null si no hay lista
   */
  private detectAndExtractList(text: string): { title: string; items: string[] } | null {
    // Patrones para detectar listas
    const patterns = [
      /(?:^|\n)(?:\d+[\.\)]\s+.+)/gm,        // Lista numerada: 1. item, 1) item
      /(?:^|\n)(?:[-•*]\s+.+)/gm,            // Lista con guiones/bullets: - item, • item, * item
      /(?:^|\n)(?:[a-z][\.\)]\s+.+)/gim,     // Lista alfabética: a. item, a) item
    ]

    let items: string[] = []
    let matchedPattern = false

    // Intentar con cada patrón
    for (const pattern of patterns) {
      const matches = text.match(pattern)
      if (matches && matches.length >= 2) { // Al menos 2 items para considerar que es una lista
        items = matches.map(item => 
          item.trim()
            .replace(/^\d+[\.\)]\s*/, '')      // Remover numeración
            .replace(/^[-•*]\s*/, '')          // Remover bullets
            .replace(/^[a-z][\.\)]\s*/i, '')   // Remover letras
            .trim()
        )
        matchedPattern = true
        break
      }
    }

    if (!matchedPattern || items.length < 2) {
      return null
    }

    // Intentar extraer un título (texto antes de la lista)
    const listStart = text.search(/(?:\d+[\.\)]|[-•*]|[a-z][\.\)])\s+/i)
    let title = "Lista generada"
    
    if (listStart > 0) {
      const beforeList = text.substring(0, listStart).trim()
      // Tomar la última línea antes de la lista como título
      const lines = beforeList.split('\n')
      const potentialTitle = lines[lines.length - 1].trim()
      if (potentialTitle.length > 0 && potentialTitle.length < 100) {
        title = potentialTitle.replace(/[:：]/g, '').trim()
      }
    }

    return { title, items }
  }

  /**
   * Convierte una lista de items en una tabla dinámica
   * @param title Título de la tabla
   * @param items Array de items de la lista
   */
  private createTableFromList(title: string, items: string[]): void {
    // Crear tabla con formato simple: Índice y Descripción
    const columns = ["#", "Descripción"]
    const rows = items.map((item, index) => ({
      "#": (index + 1).toString(),
      "Descripción": item
    }))

    this.addDynamicTable(title, columns, rows)
    console.log("[LIST_TO_TABLE] 📊 Lista convertida a tabla:", title, "con", items.length, "items")
  }

  /**
   * Procesa la respuesta de la IA y detecta si contiene listas
   * Si encuentra listas, crea tablas automáticamente
   * @param responseText Texto de respuesta de la IA
   */
  private processResponseForLists(responseText: string): void {
    const listData = this.detectAndExtractList(responseText)
    
    if (listData) {
      console.log("[LIST_DETECTION] ✅ Lista detectada:", listData.title, "con", listData.items.length, "items")
      this.createTableFromList(listData.title, listData.items)
    } else {
      console.log("[LIST_DETECTION] ℹ️ No se detectó ninguna lista en la respuesta")
    }
  }

  /**
   * Envía un mensaje del usuario al agente de IA
   * Maneja el estado de carga y los errores
   */
  sendMessage(): void {
    const message = this.messageText.trim()

    if (message === "" || this.isLoading) {
      console.warn("[sendMessage] ⚠️ Mensaje vacío o ya está cargando")
      return
    }

    // Agregar mensaje del usuario
    this.messages.push({
      text: message,
      type: "user",
      time: this.getCurrentTime(),
    })

    this.messageText = ""
    this.shouldScroll = true
    
    // 🔹 IMPORTANTE: Forzar detección de cambios después de agregar mensaje del usuario
    this.cdr.detectChanges()

    // Activar estado de carga
    this.isLoading = true
    this.errorText = null
    
    console.log("[sendMessage] 🔄 isLoading activado:", this.isLoading)
    console.log("[sendMessage] 📤 Enviando mensaje:", message)
    
    // Enviar mensaje al servicio de IA
    this.iaService.sendMessage(message).subscribe({
      next: (reply: unknown) => {
        console.log('📦 [RAW] Respuesta recibida (tipo):', typeof reply)
        console.log('📦 [RAW] Respuesta recibida (contenido):', reply)
        
        // 🔹 Ejecutar dentro de NgZone para asegurar detección de cambios
        this.ngZone.run(() => {
          try {
            const replyText = this.responseFormatService.formatResponse(reply)
            
            console.log('✅ [FORMATTED] Texto formateado:', replyText)
            console.log('✅ [FORMATTED] Longitud del texto:', replyText?.length)
            
            // 🔹 VALIDACIÓN CRÍTICA: Verificar que replyText no esté vacío
            if (!replyText || replyText.trim() === '') {
              console.error('⚠️ El texto formateado está vacío!')
              throw new Error('Respuesta vacía del formateador')
            }
            
            // 🔹 NUEVO: Procesar la respuesta para detectar listas
            this.processResponseForLists(replyText)
            
            // 🔹 CRÍTICO: Desactivar loading PRIMERO
            this.isLoading = false
            console.log("[next] ⏹ isLoading desactivado ANTES de agregar mensaje:", this.isLoading)
            
            // Forzar detección de cambios ANTES de agregar el mensaje
            this.cdr.detectChanges()
            
            // Agregar respuesta de la IA
            this.messages.push({
              text: replyText,
              type: "ai",
              time: this.getCurrentTime(),
            })
            
            console.log("[next] 📝 Mensaje de IA agregado. Total mensajes:", this.messages.length)
            console.log("[next] 📝 Último mensaje:", this.messages[this.messages.length - 1])
            
          } catch (formatError) {
            console.error('❌ Error al formatear la respuesta:', formatError)
            // Agregar mensaje de error
            this.isLoading = false
            this.messages.push({
              text: 'Error al procesar la respuesta de la IA.',
              type: "ai",
              time: this.getCurrentTime(),
            })
          } finally {
            // 🔹 CRÍTICO: Forzar detección de cambios múltiples veces
            this.shouldScroll = true
            this.cdr.detectChanges()
            
            // 🔹 Forzar detección adicional con setTimeout
            setTimeout(() => {
              this.cdr.detectChanges()
              console.log("[timeout] 🔄 Detección de cambios forzada después de timeout")
            }, 0)
            
            // 🔹 EXTRA: Segundo timeout para asegurar
            setTimeout(() => {
              this.shouldScroll = true
              this.cdr.markForCheck()
              this.cdr.detectChanges()
              console.log("[timeout-2] 🔄 Segunda detección de cambios forzada")
            }, 100)
          }
        })
      },
      error: (err) => {
        console.error('❌ [ERROR] Error completo:', err)
        console.error('❌ [ERROR] Tipo de error:', typeof err)
        console.error('❌ [ERROR] Mensaje de error:', err?.message)
        
        this.ngZone.run(() => {
          this.errorText = 'Hubo un problema obteniendo la respuesta. Intenta de nuevo.'
          
          this.messages.push({
            text: this.errorText,
            type: "ai",
            time: this.getCurrentTime(),
          })
          
          // Desactivar loading en caso de error
          this.isLoading = false
          this.shouldScroll = true
          
          console.log("[error] ⏹ isLoading desactivado:", this.isLoading)
          
          this.cdr.detectChanges()
        })
      },
      // 🔹 NUEVO: Agregar complete para asegurar que loading se desactive
      complete: () => {
        console.log("[complete] 🏁 Observable completado")
        this.ngZone.run(() => {
          // Por si acaso, asegurar que loading esté desactivado
          if (this.isLoading) {
            console.warn("[complete] ⚠️ Loading todavía estaba activo, desactivando...")
            this.isLoading = false
            this.cdr.detectChanges()
          }
        })
      }
    })
    
    console.log("[sendMessage] ⏰ Suscripción creada, esperando respuesta...")
  }

  /**
   * Maneja el evento de tecla presionada en el input
   * Envía el mensaje cuando se presiona Enter (solo si no está cargando)
   * @param event Evento de teclado
   */
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === "Enter" && !this.isLoading) {
      this.sendMessage()
    }
  }

  /**
   * Reinicia el chat a su estado inicial
   * Limpia todos los mensajes y muestra el mensaje de bienvenida
   */
  resetChat(): void {
    this.messages = []
    this.messageText = ""
    this.isLoading = false
    this.errorText = null
    this.shouldScroll = true
    
    // 🔹 Forzar actualización al resetear
    this.cdr.detectChanges()
  }

  /**
   * Hace scroll automático hacia abajo en el área de chat
   * Se ejecuta cuando hay nuevos mensajes
   */
  private scrollToBottom(): void {
    try {
      // 🔹 Usar setTimeout para asegurar que el DOM se haya actualizado
      setTimeout(() => {
        if (this.chatArea?.nativeElement) {
          this.chatArea.nativeElement.scrollTop = this.chatArea.nativeElement.scrollHeight
        }
      }, 100)
    } catch (err) {
      console.error("Error scrolling to bottom:", err)
    }
  }

  /**
   * Reproduce un mensaje usando síntesis de voz
   * Solo funciona en navegadores que soporten Speech Synthesis API
   * @param text Texto a reproducir
   */
  speakMessage(text: string) {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "es-ES" // Configuración en español
      utterance.rate = 1 // Velocidad normal
      utterance.pitch = 1 // Tono normal
      speechSynthesis.speak(utterance)
    } else {
      console.warn("Tu navegador no soporta Speech Synthesis.")
    }
  }

  /**
   * Inicia el reconocimiento de voz para convertir audio a texto
   * Usa el SpeechService para manejar la grabación y transcripción
   * Solo funciona si no está cargando una respuesta
   */
  startListening(): void {
    if (this.isLoading) {
      return // No permitir grabación mientras está cargando
    }

    this.speechService.startListening((transcript: string) => {
      // El transcript contiene el texto reconocido por el micrófono
      this.messageText = transcript
      this.sendMessage() // Envía automáticamente el mensaje
    })
  }

  /**
   * Elimina una tabla del panel
   * @param index Índice de la tabla a eliminar
   */
  removeTable(index: number): void {
    if (index >= 0 && index < this.dynamicTables.length) {
      const removedTable = this.dynamicTables.splice(index, 1)[0]
      console.log("[v0] 🗑️ Tabla eliminada:", removedTable.title)
    }
  }

  /**
   * Agrega una tabla dinámica con datos personalizados
   * Este método puede ser llamado desde el servicio de IA cuando reciba datos tabulares
   * @param title Título de la tabla
   * @param columns Array de nombres de columnas
   * @param rows Array de objetos con los datos
   */
  private addDynamicTable(title: string, columns: string[], rows: Record<string, any>[]): void {
    const newTable: DynamicTable = {
      title,
      columns,
      rows,
      timestamp: this.getCurrentTime(),
    }

    this.dynamicTables.push(newTable)
    console.log("[v0] 📊 Tabla dinámica agregada:", title, "con", rows.length, "filas")
  }

  /**
   * Función trackBy para optimizar el rendering de mensajes
   * Ayuda a Angular a identificar qué elementos cambiaron
   */
  trackByIndex(index: number, item: Message): number {
    return index
  }

  /**
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