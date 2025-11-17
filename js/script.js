const API_URL = 'http://100.30.101.150:5000/api/calculate';
const API_BASE = 'http://100.30.101.150:5000';

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
        this.form = document.getElementById('calculatorForm');
        this.resultDiv = document.getElementById('result');
        this.errorDiv = document.getElementById('error');
        this.loadingDiv = document.getElementById('loading');
        
        this.initEvents();
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
        
        const expression = document.getElementById('expression').value.trim();
        
        // Ocultar mensajes anteriores
        this.hideAllMessages();
        
        // Mostrar loading
        this.showLoading();
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ expression: expression })
            });
            
            const data = await response.json();
            
            this.hideLoading();
            
            if (data.success) {
                this.showSuccess(data, expression);
                // Actualizar el dashboard después de un cálculo exitoso
                setTimeout(() => dashboard.loadAllData(), 1000);
            } else {
                this.showError(data.error);
            }
            
        } catch (error) {
            this.hideLoading();
            this.showError(`Error de conexión: ${error.message}`);
        }
    }
    
    showSuccess(data, expression) {
        document.getElementById('resultText').textContent = 
            `${expression} = ${data.result}`;
        document.getElementById('explanationText').textContent = 
            data.ai_explanation;
        document.getElementById('locationText').textContent = 
            `Desde: ${data.city}, ${data.country} (IP: ${data.ip})`;
        
        this.resultDiv.style.display = 'block';
        
        // Efecto de aparición
        this.resultDiv.style.animation = 'none';
        setTimeout(() => {
            this.resultDiv.style.animation = 'slideInUp 0.5s ease';
        }, 10);
    }
    
    showError(message) {
        document.getElementById('errorText').textContent = message;
        this.errorDiv.style.display = 'block';
        
        // Efecto de vibración en el input
        const input = document.getElementById('expression');
        input.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            input.style.animation = '';
        }, 500);
    }
    
    showLoading() {
        this.loadingDiv.style.display = 'block';
    }
    
    hideLoading() {
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
        this.init();
    }

    init() {
        this.loadAllData();
        // Actualizar cada 30 segundos
        setInterval(() => this.loadAllData(), 30000);
    }

    async fetchAPI(endpoint) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`);
            if (!response.ok) throw new Error('Error en la API');
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            return null;
        }
    }

    async loadAllData() {
        await Promise.all([
            this.loadStats(),
            this.loadLatestOperation(),
            this.loadRecentOperations()
        ]);
    }

    async loadStats() {
        const data = await this.fetchAPI('/api/stats');
        const statsContent = document.getElementById('statsContent');
        
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
        } else {
            statsContent.innerHTML = '<div class="text-center text-muted">Error cargando estadísticas</div>';
        }
    }

    async loadLatestOperation() {
        const data = await this.fetchAPI('/api/operations/latest');
        const latestOperation = document.getElementById('latestOperation');
        
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
        } else {
            latestOperation.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calculator"></i>
                    <p>No hay operaciones recientes</p>
                </div>
            `;
        }
    }

    async loadRecentOperations() {
        const data = await this.fetchAPI('/api/operations/recent');
        const recentOperations = document.getElementById('recentOperations');
        
        if (data && data.success && data.operations.length > 0) {
            let html = '';
            data.operations.forEach(op => {
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
        } else {
            recentOperations.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No hay operaciones recientes</p>
                    <small>Realiza tu primer cálculo para verlo aquí</small>
                </div>
            `;
        }
    }
}

// Inicializar ambas aplicaciones cuando el DOM esté listo
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    new CalculatorApp();
    dashboard = new Dashboard();
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
`;
document.head.appendChild(style);