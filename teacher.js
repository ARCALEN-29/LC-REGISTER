const prevStepBtn = document.getElementById('prev-step-btn'); 
const nextStepBtn = document.getElementById('next-step-btn'); 
const regBtn = document.getElementById('reg-btn'); 
const backBtn = document.getElementById('back-btn'); 
const areaCap = document.getElementById('area-Cap'); 
const matPrim = document.getElementById('materiaAreaPrimary'); 
const matSec = document.getElementById('materiaAreaSecundary'); 
const matKind = document.getElementById('materiaKinder'); 
const lenguaje = document.getElementById('lenguajeOrig');
const nationOrig = document.getElementById('nationOrig');

let currentStep = 1; 
const totalSteps = 5; 

if (nextStepBtn) {
    nextStepBtn.addEventListener('click', () => { 
        if (currentStep < totalSteps) { 
            currentStep++; 
            updateStepUI(); 
        } 
    }); 
}

if (prevStepBtn) {
    prevStepBtn.addEventListener('click', () => { 
        if (currentStep > 1) { 
            currentStep--; 
            updateStepUI(); 
        } 
    });
}

function updateStepUI() { 
    for (let i = 1; i <= totalSteps; i++) { 
        const indicator = document.getElementById(`step-${i}-indicator`); 
        if (indicator) { 
            indicator.classList.remove('active', 'completed'); 
            if (i < currentStep) indicator.classList.add('completed'); 
            if (i === currentStep) indicator.classList.add('active'); 
        } 
    } 

    document.querySelectorAll('.step-content').forEach((step, idx) => { 
        step.classList.toggle('hidden', idx + 1 !== currentStep); 
        step.classList.toggle('visible', idx + 1 === currentStep); 
    }); 

    if (prevStepBtn) { 
        prevStepBtn.disabled = (currentStep === 1); 
    } 

    const finalActions = document.getElementById('final-actions'); 
    if (currentStep === totalSteps) { 
        nextStepBtn?.classList.add('hidden'); 
        finalActions?.classList.remove('hidden'); 
    } else { 
        nextStepBtn?.classList.remove('hidden'); 
        finalActions?.classList.add('hidden'); 
    } 
}

function changeMaterias() {
    if (!areaCap || !matPrim || !matSec || !matKind) return;
    const seleccion = areaCap.value;

    matPrim.classList.add('hidden');
    matSec.classList.add('hidden');
    matKind.classList.add('hidden');

    matPrim.value = "";
    matSec.value = "";
    matKind.value = "";

    if (seleccion === 'primary') {
        matPrim.classList.remove('hidden');
    } else if (seleccion === 'secondary') {
        matSec.classList.remove('hidden');
    } else if (seleccion === 'kinder') {
        matKind.classList.remove('hidden');
    }
}

function optionLenguaje() {
    if (!lenguaje || !nationOrig) return;
    if (lenguaje.value === 'yes') {
        nationOrig.classList.remove('hidden');
    } else {
        nationOrig.classList.add('hidden');
        nationOrig.value = "Ninguno";
    }
}

function updateProvinces(deptId, provId) {
    // Función de utilidad para actualizar provincias si se requiere
}

function generatePassword () {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXZ"
    A = α 
    B = β
}

function togglePass(inputId, iconEl) {
    const input = document.getElementById(inputId);
    const icon = iconEl.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

if (areaCap) areaCap.addEventListener('change', changeMaterias);
if (lenguaje) lenguaje.addEventListener('change', optionLenguaje);

updateStepUI();
changeMaterias();
optionLenguaje();