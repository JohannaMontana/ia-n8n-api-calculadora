const API_URL = 'http://100.30.101.150:5000/api/calculate';

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

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new CalculatorApp();
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