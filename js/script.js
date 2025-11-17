// DIAGNÓSTICO - Verificar que el script se carga
console.log("✅ script.js cargado correctamente");

// CONFIGURACIÓN
const API_URL = 'https://hannamontana.app.n8n.cloud/webhook-test/calculadora-n8n';
const API_BASE = 'http://100.30.101.150:5000';

console.log("🔧 Configuración API:");
console.log("   API_BASE:", API_BASE);
console.log("   API_URL:", API_URL);

// Función para llenar ejemplos en el input
function fillExample(example) {
    document.getElementById('expression').value = example;
    
    // Cerrar el modal automáticamente
    const modal = bootstrap.Modal.getInstance(document.getElementById('examplesModal'));
    modal.hide();
    
    // Enfocar el input
    document.getElementById('expression').focus();
    
    // Mostrar mensaje de confirmación sutil
    const originalButton = document.querySelector('.examples-btn');
    const originalText = originalButton.innerHTML;
    
    originalButton.innerHTML = '<i class="fas fa-check me-2"></i>Ejemplo cargado ✓';
    originalButton.style.background = 'rgba(76, 175, 80, 0.2)';
    originalButton.style.borderColor = '#4caf50';
    
    setTimeout(() => {
        originalButton.innerHTML = originalText;
        originalButton.style.background = '';
        originalButton.style.borderColor = '';
    }, 2000);
}

class CalculatorApp {
    constructor() {
        console.log("🔄 Inicializando CalculatorApp...");
        this.form = document.getElementById('calculatorForm');
        this.resultDiv = document.getElementById('result');
        this.errorDiv = document.getElementById('error');
        this.loadingDiv = document.getElementById('loading');
        
        if (!this.form) {
            console.error("❌ NO SE ENCUENTRA EL FORMULARIO calculatorForm");
            return;
        }
        
        this.initEvents();
        console.log("✅ CalculatorApp inicializada correctamente");
    }
    
    initEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Efectos de entrada
        const inputs = document.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focus');
            });
            input.addEventListener('blur', () => {
                input.parentElement.classList.remove('focus');
            });
        });
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        console.log("🔄 handleSubmit ejecutado");
        
        const expression = document.getElementById('expression').value.trim();
        console.log("📝 Expresión:", expression);
        
        if (!expression) {
            this.showError("Por favor ingresa una expresión");
            return;
        }
        
        // Ocultar mensajes anteriores
        this.hideAllMessages();
        
        // Mostrar loading
        this.showLoading();
        
        try {
            console.log("📤 Enviando expresión a n8n...");
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ expression: expression })
            });
            
            console.log("📥 Response status:", response.status);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("✅ Datos recibidos de n8n:", data);
            
            this.hideLoading();
            
            if (data.success) {
                console.log("🎉 Cálculo exitoso");
                this.showSuccess(data, expression);
                
                // Actualizar el dashboard después de un cálculo exitoso
                setTimeout(() => {
                    console.log("🔄 Actualizando dashboard...");
                    if (window.dashboard) {
                        window.dashboard.loadAllData();
                    } else {
                        console.error("❌ dashboard no está disponible");
                    }
                }, 1500);
            } else {
                console.error("❌ Error del servidor:", data.error);
                this.showError(data.error || "Error desconocido del servidor");
            }
            
        } catch (error) {
            this.hideLoading();
            console.error("💥 Error de conexión:", error);
            this.showError(`Error de conexión: ${error.message}`);
        }
    }
    
    showSuccess(data, expression) {
        console.log("📊 Mostrando resultado exitoso");
        
        document.getElementById('resultText').textContent = 
            `${expression} = ${data.result}`;
        document.getElementById('explanationText').textContent = 
            data.ai_explanation || "Explicación no disponible";
        document.getElementById('locationText').textContent = 
            `Desde: ${data.city || 'Desconocida'}, ${data.country || 'Desconocido'} (IP: ${data.ip || 'N/A'})`;
        
        this.resultDiv.style.display = 'block';
        
        // Efecto de aparición
        this.resultDiv.style.animation = 'none';
        setTimeout(() => {
            this.resultDiv.style.animation = 'slideInUp 0.5s ease';
        }, 10);
    }
    
    showError(message) {
        console.error("❌ Mostrando error:", message);
        
        document.getElementById('errorText').textContent = message;
        this.errorDiv.style.display = 'block';
        
        // Efecto de vibración en el input
        const input = document.getElementById('expression');
        if (input) {
            input.style.animation = 'shake 0.5s ease';
            setTimeout(() => {
                input.style.animation = '';
            }, 500);
        }
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            this.hideAllMessages();
        }, 5000);
    }
    
    showLoading() {
        console.log("⏳ Mostrando loading...");
        this.loadingDiv.style.display = 'block';
    }
    
    hideLoading() {
        console.log("✅ Ocultando loading");
        this.loadingDiv.style.display = 'none';
    }
    
    hideAllMessages() {
        this.resultDiv.style.display = 'none';
        this.errorDiv.style.display = 'none';
        this.loadingDiv.style.display = 'none';
    }
}

class Dashboard {
    constructor() {
        console.log("🔄 Inicializando Dashboard...");
        this.isLoading = false;
        this.init();
        console.log("✅ Dashboard inicializado correctamente");
    }

    init() {
        this.loadAllData();
        // Actualizar cada 30 segundos
        setInterval(() => {
            if (!this.isLoading) {
                console.log("🔄 Actualización automática del dashboard");
                this.loadAllData();
            }
        }, 30000);
    }

    async fetchAPI(endpoint) {
        try {
            console.log(`🌐 Fetching: ${API_BASE}${endpoint}`);
            const response = await fetch(`${API_BASE}${endpoint}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log(`✅ Response from ${endpoint}:`, data);
            return data;
        } catch (error) {
            console.error(`❌ Error fetching ${endpoint}:`, error);
            return null;
        }
    }

    async loadAllData() {
        if (this.isLoading) {
            console.log("⏳ Dashboard ya está cargando, omitiendo...");
            return;
        }
        
        this.isLoading = true;
        console.log("🔄 Cargando todos los datos del dashboard...");
        
        try {
            await Promise.allSettled([
                this.loadStats(),
                this.loadLatestOperation(),
                this.loadRecentOperations()
            ]);
            console.log("✅ Todos los datos del dashboard cargados");
        } catch (error) {
            console.error("❌ Error cargando datos del dashboard:", error);
        } finally {
            this.isLoading = false;
        }
    }

    async loadStats() {
        console.log("📊 Cargando estadísticas...");
        const data = await this.fetchAPI('/api/stats');
        const statsContent = document.getElementById('statsContent');
        
        if (!statsContent) {
            console.error("❌ No se encuentra statsContent en el DOM");
            return;
        }
        
        if (data && data.success) {
            const stats = data.stats;
            statsContent.innerHTML = `
                <div class="text-center">
                    <div class="stats-number">${stats.total_operaciones || 0}</div>
                    <div class="stats-label">Operaciones Totales</div>
                    
                    <div class="mt-3">
                        <div class="stats-number">${stats.usuarios_unicos || 0}</div>
                        <div class="stats-label">Usuarios Únicos</div>
                    </div>
                    
                    <div class="mt-2">
                        <small class="text-light opacity-75">
                            <i class="fas fa-sync-alt me-1"></i>
                            Actualizado ahora
                        </small>
                    </div>
                </div>
            `;
            console.log("✅ Estadísticas cargadas correctamente");
        } else {
            statsContent.innerHTML = '<div class="text-center text-muted">Error cargando estadísticas</div>';
            console.error("❌ Error cargando estadísticas");
        }
    }

    async loadLatestOperation() {
        console.log("⭐ Cargando última operación...");
        const data = await this.fetchAPI('/api/operations/latest');
        const latestOperation = document.getElementById('latestOperation');
        
        if (!latestOperation) {
            console.error("❌ No se encuentra latestOperation en el DOM");
            return;
        }
        
        if (data && data.success && data.operation) {
            const op = data.operation;
            const fecha = new Date(op.fecha_hora);
            const ahora = new Date();
            const diffMinutos = Math.floor((ahora - fecha) / (1000 * 60));
            
            let tiempoTexto = 'Hace un momento';
            if (diffMinutos > 0) {
                tiempoTexto = `Hace ${diffMinutos} minuto${diffMinutos > 1 ? 's' : ''}`;
            }
            
            latestOperation.innerHTML = `
                <div class="operation-item">
                    <div class="operation-expression">${op.operacion}</div>
                    <div class="operation-result">= ${op.resultado}</div>
                    <div class="operation-location">
                        <i class="fas fa-map-marker-alt me-1"></i>
                        ${op.ciudad || 'Desconocida'}, ${op.pais || 'Desconocido'}
                    </div>
                    <div class="operation-location">
                        <i class="fas fa-clock me-1"></i>
                        ${tiempoTexto}
                    </div>
                </div>
            `;
            console.log("✅ Última operación cargada correctamente");
        } else {
            latestOperation.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calculator"></i>
                    <p>No hay operaciones recientes</p>
                </div>
            `;
            console.log("ℹ️ No hay operaciones recientes");
        }
    }

    async loadRecentOperations() {
        console.log("📋 Cargando operaciones recientes...");
        const data = await this.fetchAPI('/api/operations/recent');
        const recentOperations = document.getElementById('recentOperations');
        
        if (!recentOperations) {
            console.error("❌ No se encuentra recentOperations en el DOM");
            return;
        }
        
        if (data && data.success && data.operations && data.operations.length > 0) {
            let html = '';
            data.operations.forEach((op, index) => {
                const fecha = new Date(op.fecha_hora);
                html += `
                    <div class="operation-item">
                        <div class="operation-expression">${op.operacion}</div>
                        <div class="operation-result">= ${op.resultado}</div>
                        <div class="operation-location">
                            <i class="fas fa-map-marker-alt me-1"></i>
                            ${op.ciudad || 'Desconocida'}, ${op.pais || 'Desconocido'} 
                            <span class="ms-2">
                                <i class="fas fa-clock me-1"></i>
                                ${fecha.toLocaleString()}
                            </span>
                        </div>
                    </div>
                `;
            });
            recentOperations.innerHTML = html;
            console.log(`✅ ${data.operations.length} operaciones recientes cargadas`);
        } else {
            recentOperations.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No hay operaciones recientes</p>
                    <small>Realiza tu primer cálculo para verlo aquí</small>
                </div>
            `;
            console.log("ℹ️ No hay operaciones recientes para mostrar");
        }
    }
}

// DIAGNÓSTICO DEL DOM
console.log("🔍 Verificando elementos del DOM...");
console.log("   calculatorForm:", !!document.getElementById('calculatorForm'));
console.log("   expression:", !!document.getElementById('expression'));
console.log("   result:", !!document.getElementById('result'));
console.log("   error:", !!document.getElementById('error'));
console.log("   loading:", !!document.getElementById('loading'));
console.log("   statsContent:", !!document.getElementById('statsContent'));
console.log("   latestOperation:", !!document.getElementById('latestOperation'));
console.log("   recentOperations:", !!document.getElementById('recentOperations'));

// Inicializar ambas aplicaciones cuando el DOM esté listo
let dashboard;
let calculatorApp;

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 DOM completamente cargado - Inicializando aplicaciones...");
    
    try {
        calculatorApp = new CalculatorApp();
        window.calculatorApp = calculatorApp;
    } catch (error) {
        console.error("💥 Error crítico inicializando CalculatorApp:", error);
    }
    
    try {
        dashboard = new Dashboard();
        window.dashboard = dashboard;
    } catch (error) {
        console.error("💥 Error crítico inicializando Dashboard:", error);
    }
    
    console.log("🎉 Aplicaciones inicializadas");
});

// Agregar animación de shake
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    .form-control.focus {
        transform: scale(1.02);
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);