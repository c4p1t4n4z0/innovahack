from flask import Blueprint, request, jsonify
import google.generativeai as genai
import os
import json
import urllib.request

ai_bp = Blueprint('ai', __name__)

# Usa versión con sufijo '-latest' para evitar errores 404 por versiones específicas
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

def _resolve_model_name(model_name: str) -> str:
    if not model_name:
        return 'gemini-2.0-flash'
    name = model_name.strip()
    if name == 'gemini-1.5-flash':
        return 'gemini-1.5-flash-latest'
    if name == 'gemini-1.5-pro':
        return 'gemini-1.5-pro-latest'
    # gemini-2.0-flash se usa tal cual
    return name

def call_gemini(prompt: str) -> str:
    if not GEMINI_API_KEY:
        return "Configura la variable de entorno GEMINI_API_KEY en el backend."
    try:
        # Usar SDK oficial; no construir URL manualmente
        genai.configure(api_key=GEMINI_API_KEY)
        model_name = _resolve_model_name(GEMINI_MODEL or 'gemini-2.0-flash')
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        text = getattr(response, 'text', None)
        if text:
            return text.strip()
        # Fallback si no hay response.text
        candidates = getattr(response, 'candidates', []) or []
        if not candidates:
            return "No se obtuvo respuesta de la IA."
        parts = candidates[0].content.parts
        fragments = []
        for p in parts:
            t = getattr(p, 'text', None)
            if t:
                fragments.append(t)
        return "\n".join(fragments).strip() or "Respuesta vacía."
    except Exception as e:
        return f"Error al llamar a Gemini: {str(e)}"

@ai_bp.route('/ai/generate-mentor-program', methods=['POST'])
def generate_mentor_program():
    """
    Genera un programa de mentoría IA personalizado para una emprendedora.
    Espera JSON con parámetros de negocio y nivel de conocimiento.
    """
    try:
        data = request.get_json() or {}
        # Parámetros esperados
        industry = data.get('industry') or 'industria'
        knowledge = data.get('knowledgeLevel') or 'básico'
        business_stage = data.get('businessStage') or 'idea'
        revenue = data.get('revenue') or '0'
        avg_ticket = data.get('avgTicket') or '0'
        customers_month = data.get('customersPerMonth') or '0'
        cash_buffer = data.get('cashBufferMonths') or '0'
        main_channels = data.get('mainChannels') or 'redes sociales'
        team_size = data.get('teamSize') or '1'
        goals = data.get('goals') or 'crecer ventas'
        timeframe = data.get('timeframeMonths') or '3'

        prompt = f"""
Eres "Mi Mentora IA" basada en Gemini. Genera un PROGRAMA DE MENTORÍA estructurado en tres niveles (BÁSICO, MEDIO, AVANZADO)
para una emprendedora de la industria: "{industry}" que busca mejorar su negocio con IA.

Contexto de negocio:
- Nivel de conocimiento previo en IA: {knowledge}
- Etapa del negocio: {business_stage}
- Ingresos mensuales aproximados: {revenue}
- Ticket promedio: {avg_ticket}
- Clientes/mes: {customers_month}
- Caja de seguridad (meses): {cash_buffer}
- Canales principales actuales: {main_channels}
- Tamaño de equipo: {team_size}
- Objetivos: {goals}
- Horizonte de implementación (meses): {timeframe}

REQUISITOS DEL PROGRAMA:
1) Introducción breve y accesible a IA adaptada al conocimiento indicado.
2) Solicita y explica CÓMO OBTENER cada parámetro clave que necesites (ej. ingresos, ticket, conversión, CAC, LTV, churn, inventario, disponibilidad de datos). Incluye una checklist accionable.
3) Para cada nivel (BÁSICO, MEDIO, AVANZADO) cubre:
   - Análisis de negocio e industria con IA (herramientas y pasos)
   - Establecimiento de objetivos SMART con métricas y plantilla
   - Toma de decisiones con simulaciones y ejemplos de escenarios
   - Optimización financiera (flujo de caja, costos, proyecciones) con herramientas IA
   - Liderazgo y gestión (coaching IA, simulaciones)
   - Marketing y ventas (segmentación, personalización, experimentos)
   - Networking y alianzas (sugerencias IA)
   - Evaluación continua (KPIs, cadencia, tableros)
   Para cada punto: herramientas IA recomendadas (con alternativas), pasos concretos, entregables, ejemplos prácticos y métricas.
4) Plan de seguimiento y retroalimentación continua con IA (cadencia semanal/quincenal/mensual), señalando cómo medir avance y ajustar.
5) Presenta el contenido en formato claro con encabezados y listas. Evita adornos; prioriza claridad y acción.
"""
        text = call_gemini(prompt)
        return jsonify({'program': text}), 200
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500

@ai_bp.route('/ai/interpret-simulator', methods=['POST'])
def interpret_simulator():
    """
    Interpreta los resultados de un simulador de crédito usando IA.
    Recibe los datos del simulador y devuelve una explicación en lenguaje simple.
    """
    try:
        data = request.get_json() or {}
        
        # Datos del préstamo
        monto = data.get('monto', 0)
        plazo = data.get('plazo', 0)
        tasa_anual = data.get('tasaAnual', 0)
        tipo_cuota = data.get('tipoCuota', 'fija')
        
        # Resultados calculados
        cuota_mensual = data.get('cuotaMensual', 0)
        intereses_totales = data.get('interesesTotales', 0)
        costo_total = data.get('costoTotal', 0)
        
        if not monto or not plazo or not tasa_anual:
            return jsonify({'error': 'Datos incompletos del simulador'}), 400
        
        # Crear el prompt para la IA
        prompt = f"""Eres "Mi Mentora IA", una mentora virtual especializada en ayudar emprendedoras a entender sus finanzas.

Necesitas explicar los resultados de una simulación de crédito en lenguaje simple y fácil de entender, como si la persona no tuviera conocimientos financieros.

Datos del préstamo:
- Monto solicitado: Bs {monto:,.2f}
- Plazo: {plazo} meses ({(plazo / 12):.1f} años)
- Tasa de interés anual: {tasa_anual}%
- Tipo de cuota: {'Cuota fija (mismo monto cada mes)' if tipo_cuota == 'fija' else 'Cuota variable (disminuye cada mes)'}

Resultados calculados:
- Cuota mensual: Bs {cuota_mensual:,.2f}
- Intereses totales a pagar: Bs {intereses_totales:,.2f}
- Costo total del crédito (capital + intereses): Bs {costo_total:,.2f}

Por favor, explica estos números de manera clara y amigable, cubriendo:
1. ¿Cuánto pagará cada mes? (explica de manera simple)
2. ¿Cuánto pagará en total por el préstamo?
3. ¿Cuánto son los intereses en términos simples? (usa analogías si es necesario)
4. ¿Es un buen préstamo o debería buscar otras opciones? (evalúa la tasa de interés)
5. Consejos prácticos y útiles para manejar este préstamo.

Usa un tono amigable, como si fueras una mentora explicándole a una amiga. Evita términos técnicos complicados. Si necesitas usar un término financiero, explícalo primero.

Formatea tu respuesta con:
- Títulos en negrita usando **texto**
- Párrafos claros y separados
- Listas numeradas o con viñetas
- Destacar números importantes en negrita"""

        # Llamar a la IA
        interpretation = call_gemini(prompt)
        
        return jsonify({
            'interpretation': interpretation,
            'message': interpretation,
            'response': interpretation
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error del servidor: {str(e)}'}), 500


