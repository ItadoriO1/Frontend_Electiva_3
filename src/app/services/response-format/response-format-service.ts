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
  formatResponse(reply: unknown): string {
    console.log('[formatResponse] 🔍 Iniciando formateo...');
    console.log('[formatResponse] 📥 Tipo de entrada:', typeof reply);
    console.log('[formatResponse] 📥 Contenido:', reply);

    if (reply === null || reply === undefined) {
      console.log('[formatResponse] ⚠️ Respuesta null/undefined');
      return '❌ No se encontró información para tu consulta.';
    }

    if (typeof reply === 'string') {
      console.log('[formatResponse] ✅ Es string directo:', reply);
      if (reply.trim() === '') {
        return '❌ No se encontró información para tu consulta.';
      }
      return reply;
    }

    // Si es objeto o array, primero intentar desempaquetar cualquier "result"
    if (typeof reply === 'object') {
      const unwrapped = this.unwrapResult(reply);
      // Si result era un array -> formatear como lista
      if (Array.isArray(unwrapped)) {
        console.log('[formatResponse] 📋 Resultado desempaquetado es array');
        return this.formatArray(unwrapped);
      }
      // Si es string luego de desempaquetar
      if (typeof unwrapped === 'string') {
        return unwrapped;
      }
      // Si es objeto -> seguir con detección/format
      if (typeof unwrapped === 'object' && unwrapped !== null) {
        const obj = unwrapped as Record<string, unknown>;
        console.log('[formatResponse] 🔎 Es objeto (desempaquetado), detectando tipo...');
        const result = this.detectAndFormat(obj);
        console.log('[formatResponse] ✅ Resultado formateado:', result);
        return result;
      }
    }

    console.log('[formatResponse] ⚠️ Usando formato genérico');
    return this.formatGeneric(reply);
  }

  /**
   * Extrae/Desempaqueta repetidamente el campo 'result' si existe.
   * Devuelve array | object | string | number | ...
   */
  private unwrapResult(value: unknown): unknown {
    let current = value;
    const wrapperKeys = ['execution', 'result', 'data', 'payload'];

    while (current && typeof current === 'object' && !Array.isArray(current)) {
      const asObj = current as Record<string, unknown>;
      let unwrapped = false;

      for (const key of wrapperKeys) {
        if (key in asObj) {
          current = asObj[key];
          unwrapped = true;
          console.log(`[unwrapResult] 🔁 Desempaquetando por "${key}"`);
          break;
        }
      }

      if (!unwrapped) break;
    }

    return current;
  }

  private detectAndFormat(obj: Record<string, unknown>): string {
    console.log('[detectAndFormat] 🔍 Analizando objeto:', Object.keys(obj));

    // Mantener chequeos directos que sean comunes
    if (obj['response'] && typeof obj['response'] === 'string') {
      return obj['response'] as string;
    }
    if (obj['message'] && typeof obj['message'] === 'string') {
      return obj['message'] as string;
    }
    if (obj['reply'] && typeof obj['reply'] === 'string') {
      return obj['reply'] as string;
    }
    if (obj['text'] && typeof obj['text'] === 'string') {
      return obj['text'] as string;
    }

    // Si resulta ser un array (ej: { items: [...] } ), dejar que formatUnknownObject lo detecte
    if (Array.isArray(obj)) {
      return this.formatArray(obj as unknown as unknown[]);
    }

    // Tipos conocidos (Persona, Usuario, Empleado, Admin, Vuelo, Avion)
    if (this.isPersona(obj)) {
      return this.formatPersona(obj as unknown as Persona);
    }
    if (this.isUsuario(obj)) {
      return this.formatUsuario(obj as unknown as Usuario);
    }
    if (this.isEmpleado(obj)) {
      return this.formatEmpleado(obj as unknown as Empleado);
    }
    if (this.isAdmin(obj)) {
      return this.formatAdmin(obj as unknown as Admin);
    }
    if (this.isVuelo(obj)) {
      return this.formatVuelo(obj as unknown as Vuelo);
    }
    if (this.isAvion(obj)) {
      return this.formatAvion(obj as unknown as Avion);
    }

    // Contadores
    if (obj['total_personas'] !== undefined) {
      return `👥 Total de personas: ${obj['total_personas']}`;
    }
    if (obj['total_vuelos'] !== undefined) {
      return `✈️ Total de vuelos: ${obj['total_vuelos']}`;
    }
    if (obj['total_aviones'] !== undefined) {
      return `🛩️ Total de aviones: ${obj['total_aviones']}`;
    }

    // Fallback: formatear genérico mejorado
    return this.formatUnknownObject(obj);
  }

  // ==== Detectores ====
  private isPersona(obj: Record<string, unknown>): boolean {
    return obj['cedula'] !== undefined && (obj['nombre'] !== undefined || obj['apellido'] !== undefined);
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
    return (obj['modelo'] !== undefined && obj['capacidad'] !== undefined) || (obj['id'] !== undefined && obj['modelo'] !== undefined);
  }

  // ==== Formateadores específicos ====
  private formatPersona(persona: Persona): string {
    const nombreCompleto = `${persona.nombre ?? ''} ${persona.apellido ?? ''}`.trim();
    let resultado = `👤 ${nombreCompleto || 'Nombre no disponible'}`;
    if (persona.cedula) resultado += `\n   📋 Cédula: ${persona.cedula}`;
    if (persona.email) resultado += `\n   📧 Email: ${persona.email}`;
    if (persona.telefono) resultado += `\n   📞 Teléfono: ${persona.telefono}`;
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
    if (empleado.cedula) resultado += `\n   📋 Cédula: ${empleado.cedula}`;
    if (empleado.email) resultado += `\n   📧 Email: ${empleado.email}`;
    if (empleado.telefono) resultado += `\n   📞 Teléfono: ${empleado.telefono}`;
    if (empleado.cargo) resultado += `\n   🎯 Cargo: ${empleado.cargo}`;
    if (empleado.salario) resultado += `\n   💵 Salario: ${empleado.salario}`;
    return resultado;
  }

  private formatAdmin(admin: Admin): string {
    const nombreCompleto = `${admin.nombre ?? ''} ${admin.apellido ?? ''}`.trim();
    let resultado = `🔐 Administrador: ${nombreCompleto}`;
    if (admin.cedula) resultado += `\n   📋 Cédula: ${admin.cedula}`;
    if (admin.email) resultado += `\n   📧 Email: ${admin.email}`;
    if (admin.telefono) resultado += `\n   📞 Teléfono: ${admin.telefono}`;
    if (admin.nivelAcceso) resultado += `\n   🎚️ Nivel de Acceso: ${admin.nivelAcceso}`;
    if (admin.permiso) resultado += `\n   ✅ Permisos: ${admin.permiso}`;
    return resultado;
  }

  private formatAvion(avion: Avion): string {
    return `🛩️ Avión ${avion.id ?? ''}\n` +
           `   🏷️ Modelo: ${avion.modelo}\n` +
           `   👥 Capacidad: ${avion.capacidad}\n` +
           `   🏢 Aerolínea: ${avion.aerolinea ?? '(no disponible)'}\n` +
           `   📊 Estado: ${avion.estado ?? '(no disponible)'}\n` +
           `   📅 Fabricación: ${avion.fecha_fabricacion ?? '(no disponible)'}`;
  }

  // ==== Formato de arrays ====
  private formatArray(items: unknown[]): string {
    if (!items || items.length === 0) return '❌ No se encontraron elementos.';
    const formatted = items.map((item, index) => {
      if (item === null || item === undefined) return `\n${index + 1}. (no disponible)`;
      if (typeof item === 'object') {
        const itemFormatted = this.detectAndFormat(item as Record<string, unknown>);
        return `\n${index + 1}. ${itemFormatted}\n${'─'.repeat(50)}`;
      }
      return `\n${index + 1}. ${String(item)}`;
    });
    return `📋 Se encontraron ${items.length} elemento(s):\n${formatted.join('\n')}`;
  }

  // ==== Formato mejorado para objetos desconocidos ====
  private formatUnknownObject(obj: Record<string, unknown>): string {
    console.log('[formatUnknownObject] 📦 Formateando objeto desconocido');
    const lines: string[] = ['📄 Información:'];
    let hasContent = false;
    // NO eliminar 'id' automáticamente — puede ser relevante
    const skipKeys = new Set(['result', '__v', '_id']); // quité 'id' de aquí
    for (const [key, value] of Object.entries(obj)) {
      if (skipKeys.has(key)) continue;
      const emoji = this.getEmojiForKey(key);
      const formattedKey = this.formatKey(key);

      if (value === null || value === undefined) {
        lines.push(`   ${emoji} ${formattedKey}: (no disponible)`);
        hasContent = true;
      } else if (Array.isArray(value)) {
        lines.push(`   ${emoji} ${formattedKey}: ${value.length} elemento(s)`);
        // si quieres mostrar más, podrías mapear aquí
        hasContent = true;
      } else if (typeof value === 'object') {
        lines.push(`   ${emoji} ${formattedKey}:`);
        const nested = this.detectAndFormat(value as Record<string, unknown>);
        lines.push(`      ${nested.replace(/\n/g, '\n      ')}`);
        hasContent = true;
      } else {
        lines.push(`   ${emoji} ${formattedKey}: ${String(value)}`);
        hasContent = true;
      }
    }

    if (!hasContent) {
      return '❌ No se encontró información relevante.';
    }
    return lines.join('\n');
  }

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
      'updated': '🔄',
      'modelo': '🏷️',
      'capacidad': '👥',
      'estado': '📊'
    };
    return emojiMap[key] || '•';
  }

  private formatKey(key: string): string {
    const formatted = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();

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
