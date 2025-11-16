import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveSimulationToHistory } from '../utils/history';
import './CreditSimulator.css';

const CreditSimulator = () => {
  const [formData, setFormData] = useState({
    monto: '',
    plazo: '',
    tasaAnual: '',
    tipoCuota: 'fija'
  });

  const [resultados, setResultados] = useState(null);
  const [cronograma, setCronograma] = useState([]);
  const [error, setError] = useState('');
  const [aiInterpretation, setAiInterpretation] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [utilidadMensual, setUtilidadMensual] = useState(null);
  const [fromViability, setFromViability] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [savedToHistory, setSavedToHistory] = useState(false); // Flag para evitar guardados duplicados

  // Leer datos del análisis de viabilidad cuando el componente se monta o cuando se muestra
  useEffect(() => {
    const loadViabilityData = () => {
      try {
        // Primero verificar si hay datos del historial
        const historyData = localStorage.getItem('loanDataFromHistory');
        if (historyData) {
          const data = JSON.parse(historyData);
          console.log('Datos cargados desde historial:', data);
          
          // Actualizar el estado del formulario
          setFormData({
            monto: data.monto || '',
            plazo: data.plazo || '12',
            tasaAnual: data.tasaAnual || '12',
            tipoCuota: data.tipoCuota || 'fija'
          });
          
          setDataLoaded(true);
          localStorage.removeItem('loanDataFromHistory');
          return true;
        }
        
        // Si no hay datos del historial, verificar datos de viabilidad
        const savedData = localStorage.getItem('loanDataFromViability');
        if (savedData) {
          const data = JSON.parse(savedData);
          console.log('Datos cargados desde viabilidad:', data);
          
          // Actualizar el estado del formulario
          setFormData({
            monto: data.monto || '',
            plazo: data.plazo || '12',
            tasaAnual: data.tasaAnual || '12',
            tipoCuota: data.tipoCuota || 'fija'
          });
          
          // Actualizar utilidad y flag
          setUtilidadMensual(data.utilidadMensual || null);
          setFromViability(data.fromViability || false);
          
          // Marcar como cargado
          setDataLoaded(true);
          
          // Limpiar después de leer
          localStorage.removeItem('loanDataFromViability');
          
          return true; // Indica que se cargaron datos
        }
        return false; // No hay datos
      } catch (e) {
        console.error('Error al leer datos:', e);
        return false;
      }
    };

    // Cargar inmediatamente al montar
    const loaded = loadViabilityData();
    if (!loaded) {
      setDataLoaded(true);
    }
    
    // Verificar periódicamente si hay datos nuevos (útil cuando el componente ya está montado)
    // Esto es importante porque el componente puede estar montado pero oculto
    const intervalId = setInterval(() => {
      const savedData = localStorage.getItem('loanDataFromViability') || localStorage.getItem('loanDataFromHistory');
      if (savedData) {
        const loaded = loadViabilityData();
        if (loaded) {
          // Si se cargaron datos, podríamos limpiar el intervalo después de un tiempo
          // pero lo dejamos activo por si hay más navegaciones
        }
      }
    }, 200); // Verificar cada 200ms
    
    // También verificar varias veces después del montaje
    const timeouts = [
      setTimeout(() => loadViabilityData(), 150),
      setTimeout(() => loadViabilityData(), 300),
      setTimeout(() => loadViabilityData(), 500)
    ];
    
    return () => {
      clearInterval(intervalId);
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []); // Solo ejecutar una vez al montar, pero el interval seguirá verificando

  // Escuchar cambios en localStorage desde otras pestañas/ventanas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'loanDataFromViability' && e.newValue && !dataLoaded) {
        try {
          const data = JSON.parse(e.newValue);
          console.log('Datos detectados desde otra ventana:', data);
          
          setFormData({
            monto: data.monto || '',
            plazo: data.plazo || '12',
            tasaAnual: data.tasaAnual || '12',
            tipoCuota: data.tipoCuota || 'fija'
          });
          
          setUtilidadMensual(data.utilidadMensual || null);
          setFromViability(data.fromViability || false);
          setDataLoaded(true);
        } catch (err) {
          console.error('Error al procesar datos de storage:', err);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [dataLoaded]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  const saveSimulationWithAI = (aiInterpretationText, simulationData) => {
    // Usar los datos pasados directamente o los del estado si no se pasan
    const dataToSave = simulationData || {
      formData: formData,
      resultados: resultados,
      cronograma: cronograma,
      aiInterpretation: aiInterpretationText || '',
      utilidadMensual: utilidadMensual,
      fromViability: fromViability
    };

    if (!dataToSave.resultados || !dataToSave.cronograma || dataToSave.cronograma.length === 0) {
      console.warn('No hay resultados o cronograma para guardar en historial');
      return;
    }
    
    try {
      saveSimulationToHistory({
        formData: {
          monto: dataToSave.formData.monto,
          plazo: dataToSave.formData.plazo,
          tasaAnual: dataToSave.formData.tasaAnual,
          tipoCuota: dataToSave.formData.tipoCuota
        },
        resultados: {
          cuotaMensual: dataToSave.resultados.cuotaMensual,
          interesesTotales: dataToSave.resultados.interesesTotales,
          totalPagar: dataToSave.resultados.totalPagar
        },
        cronograma: Array.isArray(dataToSave.cronograma) ? dataToSave.cronograma.slice(0, 12) : [], // Guardar solo primeros 12 meses para ahorrar espacio
        aiInterpretation: aiInterpretationText || '',
        utilidadMensual: dataToSave.utilidadMensual || null,
        fromViability: dataToSave.fromViability || false
      });
      console.log('✅ Simulación guardada en historial correctamente');
    } catch (e) {
      console.error('❌ Error al guardar simulación en historial:', e);
    }
  };

  // Guardar automáticamente cuando se recibe la interpretación de IA y hay resultados
  useEffect(() => {
    // Solo guardar si tenemos todos los datos necesarios, no está cargando la IA, y aún no se ha guardado
    if (aiInterpretation && resultados && cronograma && cronograma.length > 0 && !loadingAI && !savedToHistory && formData.monto) {
      console.log('📝 Intentando guardar simulación en historial...', { 
        tieneInterpretacion: !!aiInterpretation, 
        tieneResultados: !!resultados, 
        tieneCronograma: cronograma.length > 0,
        monto: formData.monto,
        plazo: formData.plazo,
        savedToHistory: savedToHistory
      });
      
      // Usar un pequeño delay para asegurar que todo esté sincronizado
      const timeoutId = setTimeout(() => {
        try {
          // Llamar directamente a saveSimulationToHistory con todos los datos
          saveSimulationToHistory({
            formData: {
              monto: formData.monto,
              plazo: formData.plazo,
              tasaAnual: formData.tasaAnual,
              tipoCuota: formData.tipoCuota
            },
            resultados: {
              cuotaMensual: resultados.cuotaMensual,
              interesesTotales: resultados.interesesTotales,
              totalPagar: resultados.totalPagar
            },
            cronograma: Array.isArray(cronograma) ? cronograma.slice(0, 12) : [],
            aiInterpretation: aiInterpretation || '',
            utilidadMensual: utilidadMensual,
            fromViability: fromViability
          });
          
          setSavedToHistory(true); // Marcar como guardado para evitar duplicados
          console.log('✅ Simulación guardada en historial exitosamente');
        } catch (error) {
          console.error('❌ Error al guardar en historial:', error);
        }
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [aiInterpretation, resultados, cronograma, loadingAI, savedToHistory, formData, utilidadMensual, fromViability]); // Se ejecuta cuando estos valores cambian

  // Resetear el flag cuando se calcula una nueva simulación
  useEffect(() => {
    if (resultados && !aiInterpretation) {
      // Si hay resultados pero aún no hay interpretación, resetear el flag
      setSavedToHistory(false);
    }
  }, [resultados, aiInterpretation]);

  const calcularCuotaFija = (monto, tasaMensual, plazo) => {
    if (tasaMensual === 0) {
      return monto / plazo;
    }
    const factor = Math.pow(1 + tasaMensual, plazo);
    return monto * (tasaMensual * factor) / (factor - 1);
  };

  const calcularAmortizacion = (monto, plazo, tasaAnual, tipoCuota) => {
    const tasaMensual = tasaAnual / 100 / 12;
    const cronogramaPagos = [];
    let saldoRestante = monto;

    if (tipoCuota === 'fija') {
      const cuotaMensual = calcularCuotaFija(monto, tasaMensual, plazo);
      let interesesTotales = 0;

      for (let mes = 1; mes <= plazo; mes++) {
        const intereses = saldoRestante * tasaMensual;
        const capital = cuotaMensual - intereses;
        saldoRestante -= capital;
        interesesTotales += intereses;

        cronogramaPagos.push({
          mes,
          cuota: cuotaMensual,
          capital: Math.max(0, capital),
          intereses,
          saldoRestante: Math.max(0, saldoRestante)
        });
      }

      return {
        cuotaMensual,
        interesesTotales,
        totalPagar: monto + interesesTotales
      };
    } else {
      // Cuota variable (amortización constante)
      const amortizacionCapital = monto / plazo;
      let interesesTotales = 0;
      let cuotaTotal = 0;

      for (let mes = 1; mes <= plazo; mes++) {
        const intereses = saldoRestante * tasaMensual;
        const capital = amortizacionCapital;
        const cuotaMensual = capital + intereses;
        saldoRestante -= capital;
        interesesTotales += intereses;
        cuotaTotal += cuotaMensual;

        cronogramaPagos.push({
          mes,
          cuota: cuotaMensual,
          capital: Math.max(0, capital),
          intereses,
          saldoRestante: Math.max(0, saldoRestante)
        });
      }

      return {
        cuotaMensual: amortizacionCapital + (monto * tasaMensual), // Primera cuota como referencia
        interesesTotales,
        totalPagar: monto + interesesTotales
      };
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const monto = parseFloat(formData.monto);
    const plazo = parseInt(formData.plazo);
    const tasaAnual = parseFloat(formData.tasaAnual);

    // Validaciones
    if (!monto || monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (!plazo || plazo <= 0 || plazo > 360) {
      setError('El plazo debe estar entre 1 y 360 meses');
      return;
    }

    if (tasaAnual < 0 || tasaAnual > 100) {
      setError('La tasa de interés debe estar entre 0 y 100%');
      return;
    }

    // Validación adicional si viene del análisis de viabilidad
    if (fromViability && utilidadMensual !== null && utilidadMensual > 0) {
      const tasaMensual = tasaAnual / 100 / 12;
      let cuotaEstimada = 0;
      if (formData.tipoCuota === 'fija') {
        if (tasaMensual === 0) {
          cuotaEstimada = monto / plazo;
        } else {
          const factor = Math.pow(1 + tasaMensual, plazo);
          cuotaEstimada = monto * (tasaMensual * factor) / (factor - 1);
        }
      } else {
        // Variable - primera cuota aproximada
        const amortizacionCapital = monto / plazo;
        cuotaEstimada = amortizacionCapital + (monto * tasaMensual);
      }
      
      // Advertencia si la cuota supera el 30% de la utilidad mensual
      const porcentajeCuota = (cuotaEstimada / utilidadMensual) * 100;
      if (porcentajeCuota > 30) {
        setError(`Advertencia: La cuota estimada (${formatCurrency(cuotaEstimada)}) representa el ${porcentajeCuota.toFixed(1)}% de tu utilidad mensual (${formatCurrency(utilidadMensual)}). Se recomienda que no supere el 30%. Puedes ajustar el monto, plazo o tasa de interés.`);
        // No retornar, permitir que continúe pero mostrando la advertencia
      }
    }

    // Calcular resultados
    const resultado = calcularAmortizacion(monto, plazo, tasaAnual, formData.tipoCuota);
    const cronogramaResult = [];

    const tasaMensual = tasaAnual / 100 / 12;
    let saldoRestante = monto;

    if (formData.tipoCuota === 'fija') {
      const cuotaMensual = calcularCuotaFija(monto, tasaMensual, plazo);
      
      for (let mes = 1; mes <= plazo; mes++) {
        const intereses = saldoRestante * tasaMensual;
        const capital = cuotaMensual - intereses;
        saldoRestante -= capital;

        cronogramaResult.push({
          mes,
          cuota: cuotaMensual.toFixed(2),
          capital: Math.max(0, capital).toFixed(2),
          intereses: intereses.toFixed(2),
          saldoRestante: Math.max(0, saldoRestante).toFixed(2)
        });
      }
    } else {
      const amortizacionCapital = monto / plazo;
      
      for (let mes = 1; mes <= plazo; mes++) {
        const intereses = saldoRestante * tasaMensual;
        const capital = amortizacionCapital;
        const cuotaMensual = capital + intereses;
        saldoRestante -= capital;

        cronogramaResult.push({
          mes,
          cuota: cuotaMensual.toFixed(2),
          capital: capital.toFixed(2),
          intereses: intereses.toFixed(2),
          saldoRestante: Math.max(0, saldoRestante).toFixed(2)
        });
      }
    }

    setResultados(resultado);
    setCronograma(cronogramaResult);
    setSavedToHistory(false); // Resetear flag para permitir guardar la nueva simulación
    
    // Solicitar interpretación de la IA (se guardará automáticamente cuando llegue)
    solicitarInterpretacionIA(monto, plazo, tasaAnual, formData.tipoCuota, resultado);
  };

  const solicitarInterpretacionIA = async (monto, plazo, tasaAnual, tipoCuota, resultado) => {
    setLoadingAI(true);
    setAiInterpretation('');
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Crear un mensaje con los datos del simulador para que la IA los interprete
      const mensajeAI = `Necesito que me ayudes a entender los resultados de mi simulación de crédito. 

Datos del préstamo:
- Monto solicitado: Bs ${monto.toLocaleString('es-BO')}
- Plazo: ${plazo} meses (${(plazo / 12).toFixed(1)} años)
- Tasa de interés anual: ${tasaAnual}%
- Tipo de cuota: ${tipoCuota === 'fija' ? 'Cuota fija (mismo monto cada mes)' : 'Cuota variable (disminuye cada mes)'}

Resultados calculados:
- Cuota mensual: Bs ${resultado.cuotaMensual.toFixed(2)}
- Intereses totales a pagar: Bs ${resultado.interesesTotales.toFixed(2)}
- Costo total del crédito (capital + intereses): Bs ${resultado.totalPagar.toFixed(2)}

Por favor, explícame estos números en lenguaje simple y fácil de entender, como si no tuviera conocimientos financieros. Ayúdame a entender:
1. ¿Cuánto pagaré cada mes?
2. ¿Cuánto pagaré en total por el préstamo?
3. ¿Cuánto son los intereses en términos simples?
4. ¿Es un buen préstamo o debería buscar otras opciones?
5. Consejos útiles para manejar este préstamo.`;

      // Intentar usar el servicio de IA específico para simulador
      try {
        // Usar el endpoint específico de interpretación del simulador
        const response = await fetch('http://localhost:5000/api/ai/interpret-simulator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            monto: monto,
            plazo: plazo,
            tasaAnual: tasaAnual,
            tipoCuota: tipoCuota,
            cuotaMensual: resultado.cuotaMensual,
            interesesTotales: resultado.interesesTotales,
            costoTotal: resultado.totalPagar
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.interpretation || data.message || data.response;
          if (aiResponse) {
            setAiInterpretation(aiResponse);
            // El useEffect se encargará de guardar en historial cuando aiInterpretation esté listo
            return;
          }
        }
        
        // Si no hay servicio de IA o no respondió, generar interpretación básica
        generarInterpretacionBasica(monto, plazo, tasaAnual, tipoCuota, resultado);
      } catch (aiError) {
        console.error('Error al usar servicio de IA:', aiError);
        // Fallback: generar una interpretación básica si no hay servicio de IA
        generarInterpretacionBasica(monto, plazo, tasaAnual, tipoCuota, resultado);
      }
    } catch (err) {
      console.error('Error al solicitar interpretación de IA:', err);
      generarInterpretacionBasica(monto, plazo, tasaAnual, tipoCuota, resultado);
    } finally {
      setLoadingAI(false);
    }
  };

  const generarInterpretacionBasica = (monto, plazo, tasaAnual, tipoCuota, resultado) => {
    const años = (plazo / 12).toFixed(1);
    const cuotaFormateada = resultado.cuotaMensual.toFixed(2);
    const totalFormateado = resultado.totalPagar.toFixed(2);
    const interesesFormateados = resultado.interesesTotales.toFixed(2);
    const porcentajeIntereses = ((resultado.interesesTotales / monto) * 100).toFixed(1);
    
    const interpretacion = `📊 **Interpretación de tu Simulación de Crédito**

**💡 En palabras simples:**

Estás pidiendo prestado **Bs ${monto.toLocaleString('es-BO')}** por **${plazo} meses** (${años} años).

**💰 ¿Cuánto pagarás cada mes?**
${tipoCuota === 'fija' 
  ? `Cada mes pagarás exactamente **Bs ${cuotaFormateada}**. Este monto se mantiene igual durante todo el préstamo.`
  : `Tu primera cuota será aproximadamente **Bs ${cuotaFormateada}**, pero irá disminuyendo cada mes porque pagas la misma cantidad de capital, pero menos intereses conforme avanza el tiempo.`
}

**📈 ¿Cuánto pagarás en total?**
Al final de los ${plazo} meses, habrás pagado **Bs ${totalFormateado}** en total.

**💸 ¿Cuánto son los intereses?**
Los intereses que pagarás son **Bs ${interesesFormateados}**. Esto significa que pagarás un ${porcentajeIntereses}% más de lo que pediste prestado.

**🤔 ¿Es un buen préstamo?**
${tasaAnual <= 15 
  ? `Con una tasa de interés del ${tasaAnual}%, este préstamo está en un rango razonable.`
  : tasaAnual <= 25
  ? `La tasa de interés del ${tasaAnual}% es moderada. Compara con otras opciones antes de decidir.`
  : `La tasa de interés del ${tasaAnual}% es alta. Te recomendamos buscar otras opciones o negociar una mejor tasa.`
}

**💡 Consejos importantes:**
1. Asegúrate de que puedes pagar la cuota mensual sin problemas
2. No uses más del 30% de tus ingresos mensuales para pagar préstamos
3. Si puedes pagar más, reducirás los intereses totales
4. Compara esta oferta con otros bancos o instituciones financieras
5. Lee bien todos los términos y condiciones antes de firmar

¿Tienes alguna pregunta específica sobre tu préstamo?`;

    setAiInterpretation(interpretacion);
    // El useEffect se encargará de guardar en historial cuando aiInterpretation esté listo
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2
    }).format(value);
  };

  const exportarAPDF = () => {
    if (!resultados || cronograma.length === 0) {
      alert('No hay resultados para exportar. Calcula primero un crédito.');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);

      // Verificar que autoTable esté disponible en doc
      if (!doc.autoTable) {
        throw new Error('autoTable no está disponible. Asegúrate de que jspdf-autotable esté instalado correctamente.');
      }

      // Configurar fuentes
      doc.setFont('helvetica');

      // Título principal
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Simulación de Crédito', margin, yPosition);
      yPosition += 10;

      // Fecha de generación
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const fecha = new Date().toLocaleDateString('es-BO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Generado el: ${fecha}`, margin, yPosition);
      yPosition += 15;

      // Datos del préstamo
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Datos del Préstamo', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Monto del crédito: ${formatCurrency(parseFloat(formData.monto))}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Plazo: ${formData.plazo} meses (${(formData.plazo / 12).toFixed(1)} años)`, margin, yPosition);
      yPosition += 6;
      doc.text(`Tasa de interés anual: ${formData.tasaAnual}% (${(formData.tasaAnual / 12).toFixed(2)}% mensual)`, margin, yPosition);
      yPosition += 6;
      doc.text(`Tipo de cuota: ${formData.tipoCuota === 'fija' ? 'Cuota Fija' : 'Cuota Variable (Amortización Constante)'}`, margin, yPosition);
      yPosition += 12;

      // Resultados calculados
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Resultados Calculados', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const cuotaTexto = formData.tipoCuota === 'fija' 
        ? formatCurrency(resultados.cuotaMensual)
        : `${formatCurrency(resultados.cuotaMensual)} (aprox. primera cuota)`;
      doc.text(`Cuota mensual: ${cuotaTexto}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Intereses totales: ${formatCurrency(resultados.interesesTotales)}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Costo total del crédito: ${formatCurrency(resultados.totalPagar)}`, margin, yPosition);
      yPosition += 6;
      const porcentajeIntereses = ((resultados.interesesTotales / parseFloat(formData.monto)) * 100).toFixed(1);
      doc.text(`Porcentaje de intereses sobre el capital: ${porcentajeIntereses}%`, margin, yPosition);
      yPosition += 15;

      // Cronograma de pagos (tabla)
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Cronograma de Pagos', margin, yPosition);
      yPosition += 8;

      // Preparar datos para la tabla - mostrar máximo 25 filas por página
      const rowsPerPage = 25;
      const totalRows = cronograma.length;
      let currentRow = 0;

      while (currentRow < totalRows) {
        // Verificar si necesitamos una nueva página
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = margin;
        }

        const rowsToShow = Math.min(rowsPerPage, totalRows - currentRow);
        const tableData = cronograma.slice(currentRow, currentRow + rowsToShow).map(pago => [
          pago.mes.toString(),
          formatCurrency(parseFloat(pago.cuota)),
          formatCurrency(parseFloat(pago.capital)),
          formatCurrency(parseFloat(pago.intereses)),
          formatCurrency(parseFloat(pago.saldoRestante))
        ]);

        // Agregar tabla usando autoTable
        try {
          doc.autoTable({
            head: currentRow === 0 ? [['Mes', 'Cuota', 'Capital', 'Intereses', 'Saldo Restante']] : [],
            body: tableData,
            startY: yPosition,
            margin: { left: margin, right: margin },
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [102, 126, 234], textColor: 255, fontStyle: 'bold', fontSize: 9 },
            alternateRowStyles: { fillColor: [245, 245, 245] }
          });

          // Actualizar posición Y después de la tabla
          if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
            yPosition = doc.lastAutoTable.finalY + 10;
          } else {
            // Fallback si lastAutoTable no está disponible
            yPosition = yPosition + (rowsToShow * 8) + 10;
          }
        } catch (tableError) {
          console.error('Error al generar tabla:', tableError);
          // Si falla la tabla, crear una versión simple
          doc.setFontSize(9);
          doc.text('Cronograma de Pagos (tabla no disponible)', margin, yPosition);
          yPosition += 10;
          tableData.forEach((row, idx) => {
            if (yPosition > pageHeight - margin - 10) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(row.join(' | '), margin + 5, yPosition);
            yPosition += 5;
          });
          yPosition += 5;
        }
        currentRow += rowsToShow;

        // Si hay más filas, agregar nota
        if (currentRow < totalRows) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.text(`Continuación... (Mostrando ${currentRow} de ${totalRows} meses)`, margin, yPosition);
          yPosition += 8;
        }
      }

      // Interpretación de IA si existe
      if (aiInterpretation && !loadingAI) {
        // Verificar si necesitamos una nueva página
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Interpretación con Inteligencia Artificial', margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Dividir la interpretación en líneas y agregarlas al PDF
        const interpretationLines = aiInterpretation.split('\n');
        for (let i = 0; i < interpretationLines.length; i++) {
          const line = interpretationLines[i].trim();
          if (!line) {
            yPosition += 4;
            continue;
          }

          // Verificar si necesitamos una nueva página
          if (yPosition > pageHeight - margin - 15) {
            doc.addPage();
            yPosition = margin;
          }

          // Manejar títulos en negrita
          if (line.startsWith('**') && line.endsWith('**')) {
            const titleText = line.replace(/\*\*/g, '');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(titleText, margin, yPosition);
            yPosition += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
          } else {
            // Limpiar el texto (quitar markdown)
            const cleanLine = line.replace(/\*\*/g, '');
            
            // Dividir líneas largas para que quepan en la página
            const lines = doc.splitTextToSize(cleanLine, maxWidth);
            
            lines.forEach(textLine => {
              // Verificar si necesitamos una nueva página
              if (yPosition > pageHeight - margin - 10) {
                doc.addPage();
                yPosition = margin;
              }
              
              doc.text(textLine, margin, yPosition);
              yPosition += 5;
            });
          }
        }
      }

      // Generar nombre del archivo
      const fileName = `simulacion_credito_${new Date().getTime()}.pdf`;
      
      // Guardar el PDF
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      console.error('Detalles del error:', error.message, error.stack);
      alert(`Error al generar el PDF: ${error.message || 'Error desconocido'}. Por favor, revisa la consola para más detalles.`);
    }
  };

  return (
    <div className="credit-simulator">
      <div className="simulator-header">
        <h2>Simulador de Crédito</h2>
        <p className="subtitle">Calcula tu préstamo antes de solicitarlo</p>
        {fromViability && utilidadMensual !== null && (
          <div style={{ 
            background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
            border: '2px solid #4caf50',
            borderRadius: '8px',
            padding: '12px 16px',
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>💡</span>
            <div>
              <strong style={{ color: '#2e7d32' }}>Datos prellenados desde Análisis de Viabilidad</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#555' }}>
                Tu utilidad mensual estimada: <strong>{utilidadMensual >= 0 ? formatCurrency(utilidadMensual) : formatCurrency(0)}</strong>. 
                {utilidadMensual >= 0 
                  ? ' Asegúrate de que la cuota mensual no supere el 30% de tus ingresos disponibles.'
                  : ' Considera ajustar tus números antes de solicitar un préstamo.'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="simulator-container">
        <div className="simulator-form-section">
          <form onSubmit={handleSubmit} className="simulator-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="monto">
                  Monto del Crédito (Bs) *
                </label>
                <input
                  type="number"
                  id="monto"
                  name="monto"
                  value={formData.monto}
                  onChange={handleInputChange}
                  placeholder="Ej: 10000"
                  min="1"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="plazo">
                  Plazo (meses) *
                </label>
                <input
                  type="number"
                  id="plazo"
                  name="plazo"
                  value={formData.plazo}
                  onChange={handleInputChange}
                  placeholder="Ej: 12"
                  min="1"
                  max="360"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tasaAnual">
                  Tasa de Interés Anual (%) *
                </label>
                <input
                  type="number"
                  id="tasaAnual"
                  name="tasaAnual"
                  value={formData.tasaAnual}
                  onChange={handleInputChange}
                  placeholder="Ej: 12"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="tipoCuota">
                  Tipo de Cuota *
                </label>
                <select
                  id="tipoCuota"
                  name="tipoCuota"
                  value={formData.tipoCuota}
                  onChange={handleInputChange}
                  required
                >
                  <option value="fija">Cuota Fija</option>
                  <option value="variable">Cuota Variable (Amortización Constante)</option>
                </select>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button type="submit" className="btn-calculate">
              🧮 Calcular Crédito
            </button>
          </form>
        </div>

        {resultados && (
          <div className="simulator-results-section">
            <div className="results-header">
              <h3>Resultados del Simulador</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button 
                  onClick={() => {
                    // Guardar la cuota mensual para que el análisis de viabilidad la use
                    const loanPaymentData = {
                      monthlyPayment: resultados.cuotaMensual
                    };
                    localStorage.setItem('loanPaymentFromSimulator', JSON.stringify(loanPaymentData));
                    
                    // Disparar evento para navegar al análisis de viabilidad
                    window.dispatchEvent(new CustomEvent('navigateToViability', { 
                      detail: { section: 'mi-mentora-ia' } 
                    }));
                    
                    alert(`✅ Cuota mensual (${formatCurrency(resultados.cuotaMensual)}) enviada al Análisis de Viabilidad. Serás redirigido...`);
                  }}
                  className="btn-export-pdf"
                  style={{ 
                    background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                    marginRight: '10px'
                  }}
                >
                  💰 Usar en Análisis de Viabilidad
                </button>
                <button onClick={() => exportarAPDF()} className="btn-export-pdf">
                  📄 Exportar a PDF
                </button>
              </div>
            </div>
            
            <div className="results-grid">
              <div className="result-card">
                <div className="result-icon">💰</div>
                <div className="result-content">
                  <h4>Cuota Mensual</h4>
                  <p className="result-value">
                    {formData.tipoCuota === 'fija' 
                      ? formatCurrency(resultados.cuotaMensual)
                      : `${formatCurrency(resultados.cuotaMensual)} (aprox. primera cuota)`
                    }
                  </p>
                  <span className="result-note">
                    {formData.tipoCuota === 'variable' && 'Disminuye cada mes'}
                  </span>
                </div>
              </div>

              <div className="result-card">
                <div className="result-icon">📊</div>
                <div className="result-content">
                  <h4>Intereses Totales</h4>
                  <p className="result-value">
                    {formatCurrency(resultados.interesesTotales)}
                  </p>
                </div>
              </div>

              <div className="result-card">
                <div className="result-icon">📅</div>
                <div className="result-content">
                  <h4>Plazo</h4>
                  <p className="result-value">
                    {formData.plazo} {formData.plazo === 1 ? 'mes' : 'meses'}
                  </p>
                  <span className="result-note">
                    ({parseFloat(formData.plazo / 12).toFixed(1)} años)
                  </span>
                </div>
              </div>

              <div className="result-card">
                <div className="result-icon">📈</div>
                <div className="result-content">
                  <h4>Tasa de Interés</h4>
                  <p className="result-value">
                    {formData.tasaAnual}% anual
                  </p>
                  <span className="result-note">
                    ({(formData.tasaAnual / 12).toFixed(2)}% mensual)
                  </span>
                </div>
              </div>

              <div className="result-card highlight">
                <div className="result-icon">💵</div>
                <div className="result-content">
                  <h4>Costo Total del Crédito</h4>
                  <p className="result-value large">
                    {formatCurrency(resultados.totalPagar)}
                  </p>
                  <span className="result-note">
                    Capital: {formatCurrency(parseFloat(formData.monto))} + 
                    Intereses: {formatCurrency(resultados.interesesTotales)}
                  </span>
                </div>
              </div>
            </div>

            {cronograma.length > 0 && (
              <div className="payment-schedule">
                <h3>Cronograma de Pagos</h3>
                <div className="schedule-container">
                  <table className="schedule-table">
                    <thead>
                      <tr>
                        <th>Mes</th>
                        <th>Cuota</th>
                        <th>Capital</th>
                        <th>Intereses</th>
                        <th>Saldo Restante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cronograma.slice(0, 12).map((pago) => (
                        <tr key={pago.mes}>
                          <td>{pago.mes}</td>
                          <td>{formatCurrency(parseFloat(pago.cuota))}</td>
                          <td>{formatCurrency(parseFloat(pago.capital))}</td>
                          <td>{formatCurrency(parseFloat(pago.intereses))}</td>
                          <td>{formatCurrency(parseFloat(pago.saldoRestante))}</td>
                        </tr>
                      ))}
                      {cronograma.length > 12 && (
                        <tr className="more-rows">
                          <td colSpan="5">
                            ... y {cronograma.length - 12} meses más
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  
                  {cronograma.length > 12 && (
                    <details className="full-schedule">
                      <summary>Ver cronograma completo ({cronograma.length} meses)</summary>
                      <div className="schedule-container full">
                        <table className="schedule-table">
                          <thead>
                            <tr>
                              <th>Mes</th>
                              <th>Cuota</th>
                              <th>Capital</th>
                              <th>Intereses</th>
                              <th>Saldo Restante</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cronograma.map((pago) => (
                              <tr key={pago.mes}>
                                <td>{pago.mes}</td>
                                <td>{formatCurrency(parseFloat(pago.cuota))}</td>
                                <td>{formatCurrency(parseFloat(pago.capital))}</td>
                                <td>{formatCurrency(parseFloat(pago.intereses))}</td>
                                <td>{formatCurrency(parseFloat(pago.saldoRestante))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            )}

            {aiInterpretation && (
              <div className="ai-interpretation">
                <div className="ai-header">
                  <h3>🤖 Interpretación con Inteligencia Artificial</h3>
                  <span className="ai-badge">Tu mentora virtual te explica</span>
                </div>
                <div className="ai-content">
                  {loadingAI ? (
                    <div className="ai-loading">
                      <p>💭 Analizando tus resultados...</p>
                    </div>
                  ) : (
                    <div className="ai-text">
                      {aiInterpretation.split('\n').map((line, index) => {
                        // Detectar títulos (líneas que empiezan con #)
                        if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                          return <h4 key={index} className="ai-subtitle">{line.replace(/\*\*/g, '')}</h4>;
                        }
                        // Detectar líneas con ** (negrita)
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        return (
                          <p key={index} className="ai-paragraph">
                            {parts.map((part, i) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={i}>{part.replace(/\*\*/g, '')}</strong>;
                              }
                              return part;
                            })}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditSimulator;

