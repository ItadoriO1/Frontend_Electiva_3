import { Injectable } from '@angular/core';
import { Persona } from '../../models/persona';
import { Vuelo } from '../../models/vuelo';
import { Usuario } from '../../models/usuario';
import { Empleado } from '../../models/empleado';
import { Admin } from '../../models/admin';
import { Avion } from '../../models/avion';

@Injectable({
  providedIn: 'root'
})
export class ResponseFormatService {
  /**
   * Formatea cualquier respuesta de la IA usando las interfaces existentes
   */
  formatResponse(reply: unknown): string {
    console.log('[formatResponse] 🔍 Iniciando formateo...');
    console.log('[formatResponse] 📥 Tipo de entrada:', typeof reply);
    console.log('[formatResponse] 📥 Contenido:', reply);

    // 🔹 Caso especial: null o undefined
    if (reply === null || reply === undefined) {
      console.log('[formatResponse] ⚠️ Respuesta null/undefined');
      return '❌ No se encontró información para tu consulta.';
    }

    // Caso 1: String directo
    if (typeof reply === 'string') {
      console.log('[formatResponse] ✅ Es string directo:', reply);
      // Si el string está vacío, dar un mensaje más útil
      if (reply.trim() === '') {
        return '❌ No se encontró información para tu consulta.';
      }
      return reply;
    }

    // Caso 2: Objeto o array
    if (typeof reply === 'object' && reply !== null) {
      const obj = reply as Record<string, unknown>;
      console.log('[formatResponse] 🔎 Es objeto, detectando tipo...');
      const result = this.detectAndFormat(obj);
      console.log('[formatResponse] ✅ Resultado formateado:', result);
      return result;
    }

    // Fallback genérico
    console.log('[formatResponse] ⚠️ Usando formato genérico');
    return this.formatGeneric(reply);
  }

  /**
   * Detecta el tipo de respuesta y la formatea adecuadamente.
   */
  private detectAndFormat(obj: Record<string, unknown>): string {
    console.log('[detectAndFormat] 🔍 Analizando objeto:', Object.keys(obj));

    // 🔹 PRIORIDAD 1: Respuesta directa del agente (string en campo específico)
    if (obj['response'] && typeof obj['response'] === 'string') {
      console.log('[detectAndFormat] 💬 Encontrada respuesta en campo "response"');
      return obj['response'] as string;
    }
    if (obj['message'] && typeof obj['message'] === 'string') {
      console.log('[detectAndFormat] 💬 Encontrada respuesta en campo "message"');
      return obj['message'] as string;
    }
    if (obj['reply'] && typeof obj['reply'] === 'string') {
      console.log('[detectAndFormat] 💬 Encontrada respuesta en campo "reply"');
      return obj['reply'] as string;
    }
    if (obj['text'] && typeof obj['text'] === 'string') {
      console.log('[detectAndFormat] 💬 Encontrada respuesta en campo "text"');
      return obj['text'] as string;
    }

    // 🔹 PRIORIDAD 2: El backend devolvió una lista dentro de "result"
    if (obj['result'] && Array.isArray(obj['result'])) {
      console.log('[detectAndFormat] 📋 Encontrado array en "result"');
      const items = obj['result'] as unknown[];
      if (items.length === 0) {
        console.log('[detectAndFormat] ⚠️ Array vacío');
        return '❌ No se encontraron elementos.';
      }

      const formattedItems = items.map((item, index) => {
        if (typeof item === 'object' && item !== null) {
          const itemFormatted = this.detectAndFormat(item as Record<string, unknown>);
          return `\n${index + 1}. ${itemFormatted}\n${'─'.repeat(50)}`;
        }
        return `\n${index + 1}. ${String(item)}`;
      });

      return `📋 Se encontraron ${items.length} elemento(s):\n${formattedItems.join('\n')}`;
    }

    // 🔹 PRIORIDAD 3: El backend devolvió UN SOLO objeto dentro de "result"
    if (obj['result'] && typeof obj['result'] === 'object' && obj['result'] !== null) {
      console.log('[detectAndFormat] 📦 Encontrado objeto único en "result"');
      return this.detectAndFormat(obj['result'] as Record<string, unknown>);
    }

    // 🔹 PRIORIDAD 3.5: El backend devolvió null en "result"
    if (obj['result'] === null) {
      console.log('[detectAndFormat] ⚠️ Result es null - no se encontró información');
      return '❌ No se encontró la información solicitada en la base de datos.';
    }

    // 🔹 PRIORIDAD 4: El objeto ES un tipo conocido (Persona, Vuelo, etc.)
    if (this.isPersona(obj)) {
      console.log('[detectAndFormat] 👤 Es Persona');
      return this.formatPersona(obj as unknown as Persona);
    }
    if (this.isUsuario(obj)) {
      console.log('[detectAndFormat] 👨 Es Usuario');
      return this.formatUsuario(obj as unknown as Usuario);
    }
    if (this.isEmpleado(obj)) {
      console.log('[detectAndFormat] 💼 Es Empleado');
      return this.formatEmpleado(obj as unknown as Empleado);
    }
    if (this.isAdmin(obj)) {
      console.log('[detectAndFormat] 🔐 Es Admin');
      return this.formatAdmin(obj as unknown as Admin);
    }
    if (this.isVuelo(obj)) {
      console.log('[detectAndFormat] ✈️ Es Vuelo');
      return this.formatVuelo(obj as unknown as Vuelo);
    }
    // NUEVO: detectar Avion
    if (this.isAvion(obj)) {
      console.log('[detectAndFormat] 🛩️ Es Avion');
      return this.formatAvion(obj as unknown as Avion);
    }

    // 🔹 PRIORIDAD 5: Contadores
    if (obj['total_personas']) {
      console.log('[detectAndFormat] 🔢 Es contador de personas');
      return `👥 Total de personas: ${obj['total_personas']}`;
    }
    if (obj['total_vuelos']) {
      console.log('[detectAndFormat] 🔢 Es contador de vuelos');
      return `✈️ Total de vuelos: ${obj['total_vuelos']}`;
    }
    // NUEVO: contador de aviones
    if (obj['total_aviones']) {
      console.log('[detectAndFormat] 🔢 Es contador de aviones');
      return `🛩️ Total de aviones: ${obj['total_aviones']}`;
    }

    // 🔹 PRIORIDAD 6: Array plano
    if (Array.isArray(obj)) {
      console.log('[detectAndFormat] 📋 Es array plano');
      return this.formatArray(obj);
    }

    // 🔹 PRIORIDAD 7: Fallback - Intentar formatear como objeto genérico con estructura
    console.log('[detectAndFormat] ⚠️ No se reconoció el tipo, usando formato mejorado');
    return this.formatUnknownObject(obj);
  }

  // ==== 🔎 Detectores de tipo ====

  private isPersona(obj: Record<string, unknown>): boolean {
    return obj['cedula'] !== undefined && obj['nombre'] !== undefined;
  }

  private isVuelo(obj: Record<string, unknown>): boolean {
    return obj['codigoVuelo'] !== undefined && obj['origen'] !== undefined;
  }

  private isUsuario(obj: Record<string, unknown>): boolean {
    return obj['rol'] !== undefined && obj['email'] !== undefined;
  }

  private isEmpleado(obj: Record<string, unknown>): boolean {
    return obj['salario'] !== undefined && obj['cargo'] !== undefined;
  }

  private isAdmin(obj: Record<string, unknown>): boolean {
    return obj['nivelAcceso'] !== undefined && obj['permiso'] !== undefined;
  }

  private isAvion(obj: Record<string, unknown>): boolean {
    return obj['id'] !== undefined && obj['modelo'] !== undefined && obj['capacidad'] !== undefined;
  }

  // ==== 🧱 Formateadores específicos ====

  private formatPersona(persona: Persona): string {
    const nombreCompleto = `${persona.nombre ?? ''} ${persona.apellido ?? ''}`.trim();
    
    let resultado = `👤 ${nombreCompleto || 'Nombre no disponible'}`;
    
    if (persona.cedula) {
      resultado += `\n   📋 Cédula: ${persona.cedula}`;
    }
    if (persona.email) {
      resultado += `\n   📧 Email: ${persona.email}`;
    }
    if (persona.telefono) {
      resultado += `\n   📞 Teléfono: ${persona.telefono}`;
    }

    return resultado;
  }

  private formatVuelo(vuelo: Vuelo): string {
    return `✈️ Vuelo ${vuelo.codigoVuelo}\n` +
           `   🛫 Origen: ${vuelo.origen}\n` +
           `   🛬 Destino: ${vuelo.destino}\n` +
           `   📅 Fecha: ${vuelo.fecha}\n` +
           `   💰 Precio: ${vuelo.precioBase}`;
  }

  private formatUsuario(usuario: Usuario): string {
    const nombreCompleto = `${usuario.nombre ?? ''} ${usuario.apellido ?? ''}`.trim();
    return `👨‍💼 Usuario: ${nombreCompleto}\n` +
           `   📧 Email: ${usuario.email}\n` +
           `   📞 Teléfono: ${usuario.telefono}`;
  }

  private formatEmpleado(empleado: Empleado): string {
    const nombreCompleto = `${empleado.nombre ?? ''} ${empleado.apellido ?? ''}`.trim();
    
    let resultado = `💼 Empleado: ${nombreCompleto}`;
    
    if (empleado.cedula) {
      resultado += `\n   📋 Cédula: ${empleado.cedula}`;
    }
    if (empleado.email) {
      resultado += `\n   📧 Email: ${empleado.email}`;
    }
    if (empleado.telefono) {
      resultado += `\n   📞 Teléfono: ${empleado.telefono}`;
    }
    if (empleado.cargo) {
      resultado += `\n   🎯 Cargo: ${empleado.cargo}`;
    }
    if (empleado.salario) {
      resultado += `\n   💵 Salario: ${empleado.salario}`;
    }

    return resultado;
  }

  private formatAdmin(admin: Admin): string {
    const nombreCompleto = `${admin.nombre ?? ''} ${admin.apellido ?? ''}`.trim();
    
    let resultado = `🔐 Administrador: ${nombreCompleto}`;
    
    if (admin.cedula) {
      resultado += `\n   📋 Cédula: ${admin.cedula}`;
    }
    if (admin.email) {
      resultado += `\n   📧 Email: ${admin.email}`;
    }
    if (admin.telefono) {
      resultado += `\n   📞 Teléfono: ${admin.telefono}`;
    }
    if (admin.nivelAcceso) {
      resultado += `\n   🎚️ Nivel de Acceso: ${admin.nivelAcceso}`;
    }
    if (admin.permiso) {
      resultado += `\n   ✅ Permisos: ${admin.permiso}`;
    }

    return resultado;
  }

  private formatAvion(avion: Avion): string {
    return `🛩️ Avión ${avion.id}\n` +
           `   🏷️ Modelo: ${avion.modelo}\n` +
           `   👥 Capacidad: ${avion.capacidad}\n` +
           `   🏢 Aerolínea: ${avion.aerolinea}\n` +
           `   📊 Estado: ${avion.estado}\n` +
           `   📅 Fabricación: ${avion.fecha_fabricacion}`;
  }

  // ==== 📋 Formato de listas ====

  private formatArray(items: unknown[]): string {
    if (items.length === 0) return 'No se encontraron elementos.';

    const formatted = items.map((item, index) => {
      if (typeof item === 'object' && item !== null) {
        const itemFormatted = this.detectAndFormat(item as Record<string, unknown>);
        // 🔹 Agregar separación visual entre items
        return `\n${index + 1}. ${itemFormatted}\n${'─'.repeat(50)}`;
      }
      return `\n${index + 1}. ${String(item)}`;
    });

    return `📋 Se encontraron ${items.length} elemento(s):\n${formatted.join('\n')}`;
  }

  // ==== 🪶 Genérico y formato mejorado ====

  /**
   * Formatea un objeto desconocido de manera legible (sin JSON crudo)
   */
  private formatUnknownObject(obj: Record<string, unknown>): string {
    console.log('[formatUnknownObject] 📦 Formateando objeto desconocido');
    
    const lines: string[] = ['📄 Información:'];
    let hasContent = false;
    
    for (const [key, value] of Object.entries(obj)) {
      // Saltar campos técnicos que no son relevantes para el usuario
      if (key === 'result' || key === '__v' || key === '_id' || key === 'id') continue;
      
      const emoji = this.getEmojiForKey(key);
      const formattedKey = this.formatKey(key);
      
      if (value === null || value === undefined) {
        lines.push(`   ${emoji} ${formattedKey}: (no disponible)`);
        hasContent = true;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        lines.push(`   ${emoji} ${formattedKey}:`);
        const nested = this.detectAndFormat(value as Record<string, unknown>);
        lines.push(`      ${nested.replace(/\n/g, '\n      ')}`);
        hasContent = true;
      } else if (Array.isArray(value)) {
        lines.push(`   ${emoji} ${formattedKey}: ${value.length} elemento(s)`);
        hasContent = true;
      } else {
        lines.push(`   ${emoji} ${formattedKey}: ${String(value)}`);
        hasContent = true;
      }
    }
    
    // Si no se encontró contenido útil, devolver mensaje apropiado
    if (!hasContent) {
      return '❌ No se encontró información relevante.';
    }
    
    return lines.join('\n');
  }

  /**
   * Obtiene un emoji apropiado para una clave
   */
  private getEmojiForKey(key: string): string {
    const emojiMap: Record<string, string> = {
      'id': '🆔',
      'nombre': '👤',
      'apellido': '👤',
      'email': '📧',
      'telefono': '📞',
      'cedula': '📋',
      'rol': '🎭',
      'cargo': '🎯',
      'salario': '💵',
      'nivelAcceso': '🎚️',
      'permiso': '✅',
      'codigoVuelo': '✈️',
      'origen': '🛫',
      'destino': '🛬',
      'fecha': '📅',
      'precio': '💰',
      'precioBase': '💰',
      'aerolinea': '🏢',
      'contrasenia': '🔒',
      'password': '🔒',
      'created': '📅',
      'updated': '🔄'
    };
    
    return emojiMap[key] || '•';
  }

  /**
   * Formatea el nombre de una clave para ser más legible
   */
  private formatKey(key: string): string {
    // Convertir camelCase a palabras separadas
    const formatted = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
    
    // Reemplazos específicos
    const replacements: Record<string, string> = {
      'Id': 'ID',
      'Email': 'Email',
      'Codigo Vuelo': 'Código de Vuelo',
      'Precio Base': 'Precio Base',
      'Nivel Acceso': 'Nivel de Acceso',
      'Contrasenia': 'Contraseña'
    };
    
    return replacements[formatted] || formatted;
  }

  private formatGeneric(obj: unknown): string {
    try {
      const result = JSON.stringify(obj, null, 2);
      console.log('[formatGeneric] 📄 JSON stringified:', result);
      return result;
    } catch (err) {
      console.error('[formatGeneric] ❌ Error al hacer stringify:', err);
      return String(obj);
    }
  }
}