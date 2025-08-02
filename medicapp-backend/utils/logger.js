const fs = require('fs');
const path = require('path');

/**
 * Logger personalizado para MedicApp
 * Crea archivos de log organizados por día en la carpeta log-medicapp
 */
class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '..', 'log-medicapp');
    this.initializeLogDirectory();
  }

  /**
   * Inicializa el directorio de logs si no existe
   */
  initializeLogDirectory() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Error al crear directorio de logs:', error);
    }
  }

  /**
   * Obtiene la fecha y hora formateada para los logs
   * @returns {Object} Objeto con dateStr (YYYY-MM-DD) y timeStr (DD/MM/YYYY HH:mm:ss)
   */
  getFormattedDateTime() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // Formato: YYYY-MM-DD
    const timeStr = now.toLocaleString('es-PE', { 
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    return { dateStr, timeStr };
  }

  /**
   * Obtiene la ruta del archivo de log para la fecha actual
   * @returns {string} Ruta completa del archivo de log
   */
  getLogFilePath() {
    const { dateStr } = this.getFormattedDateTime();
    const logFileName = `medicapp-${dateStr}.log`;
    return path.join(this.logDir, logFileName);
  }

  /**
   * Escribe un mensaje en el archivo de log
   * @param {string} message - Mensaje a escribir
   * @param {string} level - Nivel del log (INFO, ERROR, WARN, DEBUG)
   * @param {string} context - Contexto adicional (ej: nombre del controller)
   */
  writeLog(message, level = 'INFO', context = null) {
    try {
      const { timeStr } = this.getFormattedDateTime();
      const logFilePath = this.getLogFilePath();
      
      // Formatear el mensaje con contexto opcional
      const contextStr = context ? ` [${context}]` : '';
      const logEntry = `[${timeStr}] [${level}]${contextStr} ${message}\n`;

      // Escribir el log al archivo
      fs.appendFileSync(logFilePath, logEntry);
    } catch (error) {
      console.error('Error al escribir en el archivo de log:', error);
    }
  }

  /**
   * Registra un mensaje informativo
   * @param {string} message - Mensaje informativo
   * @param {string} context - Contexto opcional (ej: nombre del controller)
   */
  info(message, context = null) {
    this.writeLog(message, 'INFO', context);
  }

  /**
   * Registra un mensaje de error
   * @param {string} message - Mensaje de error
   * @param {string} context - Contexto opcional (ej: nombre del controller)
   */
  error(message, context = null) {
    this.writeLog(message, 'ERROR', context);
  }

  /**
   * Registra un mensaje de advertencia
   * @param {string} message - Mensaje de advertencia
   * @param {string} context - Contexto opcional (ej: nombre del controller)
   */
  warn(message, context = null) {
    this.writeLog(message, 'WARN', context);
  }

  /**
   * Registra un mensaje de debug
   * @param {string} message - Mensaje de debug
   * @param {string} context - Contexto opcional (ej: nombre del controller)
   */
  debug(message, context = null) {
    this.writeLog(message, 'DEBUG', context);
  }

  /**
   * Registra el inicio de una operación
   * @param {string} operation - Nombre de la operación
   * @param {Object} details - Detalles adicionales (opcional)
   * @param {string} context - Contexto opcional (ej: nombre del controller)
   */
  startOperation(operation, details = {}, context = null) {
    const detailsStr = Object.keys(details).length > 0 ? ` - Detalles: ${JSON.stringify(details)}` : '';
    this.info(`>>> INICIANDO: ${operation}${detailsStr}`, context);
  }

  /**
   * Registra el fin exitoso de una operación
   * @param {string} operation - Nombre de la operación
   * @param {Object} results - Resultados de la operación (opcional)
   * @param {string} context - Contexto opcional (ej: nombre del controller)
   */
  endOperation(operation, results = {}, context = null) {
    const resultsStr = Object.keys(results).length > 0 ? ` - Resultados: ${JSON.stringify(results)}` : '';
    this.info(`<<< FINALIZADO: ${operation}${resultsStr}`, context);
  }

  /**
   * Registra un error en una operación
   * @param {string} operation - Nombre de la operación
   * @param {Error|string} error - Error ocurrido
   * @param {string} context - Contexto opcional (ej: nombre del controller)
   */
  operationError(operation, error, context = null) {
    const errorMsg = error instanceof Error ? error.message : error;
    const stackTrace = error instanceof Error ? error.stack : '';
    
    this.error(`XXX ERROR EN: ${operation} - ${errorMsg}`, context);
    if (stackTrace) {
      this.error(`Stack trace: ${stackTrace}`, context);
    }
  }

  /**
   * Registra el procesamiento de un elemento específico
   * @param {string} itemType - Tipo de elemento (ej: "fila", "paciente", "receta")
   * @param {number|string} itemId - Identificador del elemento
   * @param {string} action - Acción realizada
   * @param {Object} data - Datos adicionales (opcional)
   */
  processItem(itemType, itemId, action, data = {}) {
    const dataStr = Object.keys(data).length > 0 ? ` - ${JSON.stringify(data)}` : '';
    this.info(`Procesando ${itemType} ${itemId}: ${action}${dataStr}`);
  }

  /**
   * Registra un resumen de operación con estadísticas
   * @param {string} operation - Nombre de la operación
   * @param {Object} stats - Estadísticas de la operación
   */
  summary(operation, stats) {
    this.info(`===== RESUMEN: ${operation} =====`);
    Object.entries(stats).forEach(([key, value]) => {
      this.info(`${key}: ${value}`);
    });
    this.info(`===== FIN RESUMEN =====`);
  }
}

// Crear una instancia singleton del logger
const logger = new Logger();

module.exports = logger;
