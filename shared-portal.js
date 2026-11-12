    const NATO_ALPHABET = {
        A: 'Alfa', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo',
        F: 'Foxtrot', G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliett',
        K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November', O: 'Oscar',
        P: 'Papa', Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango',
        U: 'Uniform', V: 'Victor', W: 'Whiskey', X: 'X-ray', Y: 'Yankee',
        Z: 'Zulu'
    };
    const SPECIAL_CHARACTERS = {
        '!': 'Exclamación', '@': 'Arroba', '#': 'Numeral', '$': 'Dólar',
        '%': 'Porcentaje', '&': 'Ampersand', '*': 'Asterisco'
    };
    const NUMBERS = ['Cero', 'Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve'];
    const OPTIONAL_FIELD_IDS = new Set(['teacherCIComp', 'studentCIComp']);

    function translateNATO(password) {
        return [...password].map((character) => {
            const upperCharacter = character.toUpperCase();
            return NATO_ALPHABET[upperCharacter]
                || (/\d/.test(character) ? NUMBERS[Number(character)] : SPECIAL_CHARACTERS[character] || character);
        }).join(' - ');
    }

    function generateSecurePassword(length = 16) {
        if (!Number.isInteger(length) || length < 1) {
            throw new RangeError('La longitud de la contraseña debe ser un entero positivo.');
        }

        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
        const randomValues = new Uint32Array(length);
        const maxAcceptedValue = Math.floor(0x100000000 / characters.length) * characters.length;
        let password = '';

        while (password.length < length) {
            crypto.getRandomValues(randomValues);
            for (const value of randomValues) {
                if (value < maxAcceptedValue) {
                    password += characters[value % characters.length];
                    if (password.length === length) break;
                }
            }
        }

        return password;
    }

    function getAlert() {
        let alert = document.getElementById('portal-alert');
        if (!alert) {
            alert = document.createElement('div');
            alert.id = 'portal-alert';
            alert.className = 'portal-alert';
            alert.setAttribute('role', 'alert');
            alert.setAttribute('aria-live', 'assertive');
            document.body.append(alert);
        }
        return alert;
    }

    function showPortalAlert(message) {
        const alert = getAlert();
        alert.textContent = message;
        alert.classList.add('visible');
    }

    function clearPortalAlert() {
        const alert = document.getElementById('portal-alert');
        if (!alert) return;
        alert.textContent = '';
        alert.classList.remove('visible');
    }

    function showSuccessModal() {
        let modal = document.getElementById('success-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'success-modal';
            modal.className = 'portal-modal';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'success-modal-title');
            modal.innerHTML = `
                <div class="portal-modal__panel">
                    <div class="portal-modal__icon" aria-hidden="true"><i class="fas fa-check-circle"></i></div>
                    <h2 class="portal-modal__title" id="success-modal-title">¡Registro exitoso!</h2>
                    <p class="portal-modal__message">¡Felicidades! Tus credenciales están completas. Usuario registrado exitosamente.</p>
                    <button type="button" class="btn-premium portal-modal__button">Aceptar</button>
                </div>`;
            document.body.append(modal);
            modal.querySelector('button')?.addEventListener('click', () => {
                window.location.href = 'selection_role.html';
            });
        }

        modal.hidden = false;
        modal.querySelector('button')?.focus();
    }

    function togglePassword(inputId, iconElement) {
        const input = document.getElementById(inputId);
        const icon = iconElement?.querySelector('i');
        if (!input || !icon) return;

        const revealPassword = input.type === 'password';
        input.type = revealPassword ? 'text' : 'password';
        icon.classList.toggle('fa-eye', !revealPassword);
        icon.classList.toggle('fa-eye-slash', revealPassword);
    }

    async function copyNatoTranslation() {
        const translation = document.getElementById('nato-translation')?.textContent || '';
        if (!translation || !navigator.clipboard?.writeText) {
            showPortalAlert('No fue posible copiar la traducción en este navegador.');
            return;
        }

        try {
            await navigator.clipboard.writeText(translation);
            showPortalAlert('Traducción OTAN copiada correctamente.');
        } catch {
            showPortalAlert('No se pudo copiar la traducción. Verifica los permisos del navegador.');
        }
    }

    function initializePortal({ onRegister }) {
        const form = document.getElementById('user-form');
        const previousButton = document.getElementById('prev-step-btn');
        const nextButton = document.getElementById('next-step-btn');
        const registerButton = document.getElementById('reg-btn');
        const finalActions = document.getElementById('final-actions');
        const passwordInput = document.getElementById('userGeneratedPass');
        const steps = Array.from(document.querySelectorAll('.step-content'));
        const stepCount = steps.length;
        let currentStep = Math.max(0, steps.findIndex((step) => !step.classList.contains('hidden')));
        if (!stepCount) return;

        const isVisible = (control) => !control.disabled
            && control.type !== 'hidden'
            && !control.closest('.hidden:not(.step-content), [hidden]');
        const getFields = (root = form) => Array.from(root.querySelectorAll('input, select, textarea'))
            .filter(isVisible);

        function synchronizeRequiredFields() {
            for (const control of form.querySelectorAll('.step-content input, .step-content select, .step-content textarea')) {
                const visible = isVisible(control);
                control.required = visible && !OPTIONAL_FIELD_IDS.has(control.id) && control.type !== 'checkbox';
                const empty = typeof control.value === 'string' && control.value.trim() === '';
                control.setCustomValidity(control.required && empty ? 'Completa este campo obligatorio.' : '');
            }

            for (const group of form.querySelectorAll('.grid-services')) {
                const checkboxes = Array.from(group.querySelectorAll('input[type="checkbox"]')).filter(isVisible);
                for (const checkbox of checkboxes) checkbox.required = false;
                if (checkboxes.length) checkboxes[0].required = true;
            }
        }

        function controlIsValid(control) {
            if (control.type === 'checkbox' && control.closest('.grid-services')) {
                const group = control.closest('.grid-services');
                return Array.from(group.querySelectorAll('input[type="checkbox"]')).some((checkbox) => checkbox.checked);
            }
            if (control.required && typeof control.value === 'string' && control.value.trim() === '') return false;
            return control.checkValidity();
        }

        function setInvalidState(control, invalid) {
            if (control.type === 'checkbox' && control.closest('.grid-services')) {
                for (const checkbox of control.closest('.grid-services').querySelectorAll('input[type="checkbox"]')) {
                    if (invalid) checkbox.setAttribute('aria-invalid', 'true');
                    else checkbox.removeAttribute('aria-invalid');
                }
                return;
            }
            if (invalid) control.setAttribute('aria-invalid', 'true');
            else control.removeAttribute('aria-invalid');
        }

        function updateStepUI() {
            steps.forEach((step, index) => {
                step.classList.toggle('hidden', index !== currentStep);
                step.classList.toggle('visible', index === currentStep);
                const indicator = document.getElementById(`step-${index + 1}-indicator`);
                indicator?.classList.toggle('active', index === currentStep);
                indicator?.classList.toggle('completed', index < currentStep);
            });

            if (previousButton) previousButton.disabled = currentStep === 0;
            nextButton?.classList.toggle('hidden', currentStep === stepCount - 1);
            finalActions?.classList.toggle('hidden', currentStep !== stepCount - 1);
        }

        function validateControls(controls) {
            synchronizeRequiredFields();
            const visibleControls = controls.filter(isVisible);
            const invalidControl = visibleControls.find((control) => !controlIsValid(control));
            for (const control of visibleControls) {
                setInvalidState(control, !controlIsValid(control));
            }
            if (!invalidControl) return true;

            showPortalAlert('¡Faltan llenar inputs! La mayoría son obligatorios, por favor completa los campos requeridos');
            invalidControl.focus();
            return false;
        }

        function updateInvalidState(event) {
            const control = event.target;
            if (!(control instanceof HTMLInputElement
                || control instanceof HTMLSelectElement
                || control instanceof HTMLTextAreaElement)) return;

            synchronizeRequiredFields();
            const wasInvalid = control.hasAttribute('aria-invalid')
                || Boolean(control.closest('.grid-services')?.querySelector('[aria-invalid="true"]'));
            if (controlIsValid(control) || wasInvalid) {
                setInvalidState(control, !controlIsValid(control));
            }
            const stepControls = getFields(steps[currentStep]);
            if (stepControls.every(controlIsValid)) clearPortalAlert();
        }

        async function register() {
            if (passwordInput && !passwordInput.value) {
                passwordInput.value = generateSecurePassword(16);
                const translation = document.getElementById('nato-translation');
                const result = document.getElementById('nato-result');
                if (translation) translation.textContent = translateNATO(passwordInput.value);
                if (result) result.style.display = 'block';
            }

            if (!validateControls(getFields())) {
                const firstInvalid = getFields().find((control) => !controlIsValid(control));
                const containingStep = firstInvalid?.closest('.step-content');
                const index = steps.indexOf(containingStep);
                if (index >= 0) {
                    currentStep = index;
                    updateStepUI();
                    firstInvalid.focus();
                }
                return;
            }

            const printWindow = window.open('about:blank', '_blank');
            if (!printWindow) {
                showPortalAlert('El navegador bloqueó la nueva pestaña. Permite ventanas emergentes para continuar.');
                return;
            }

            const originalButtonText = registerButton?.textContent;
            if (registerButton) {
                registerButton.disabled = true;
                registerButton.setAttribute('aria-busy', 'true');
                registerButton.textContent = 'REGISTRANDO EN FIREBASE...';
            }

            try {
                clearPortalAlert();
                const registered = await onRegister();
                if (registered !== true) {
                    printWindow.close();
                    return;
                }

                const printableData = sessionStorage.getItem('datosFichaImpresion');
                if (!printableData) {
                    throw new Error('No se encontraron los datos temporales para generar la ficha.');
                }
                printWindow.sessionStorage.setItem('datosFichaImpresion', printableData);
                sessionStorage.removeItem('datosFichaImpresion');
                printWindow.location.replace('ficha_impresion.html');
                showSuccessModal();
            } catch (error) {
                printWindow.close();
                console.error('Falló el registro del usuario.', error);
                showPortalAlert(error instanceof Error
                    ? error.message
                    : 'No se pudo completar el registro. Inténtalo nuevamente.');
            } finally {
                if (registerButton) {
                    registerButton.disabled = false;
                    registerButton.removeAttribute('aria-busy');
                    registerButton.textContent = originalButtonText;
                }
            }
        }

        form.addEventListener('input', updateInvalidState);
        form.addEventListener('change', updateInvalidState);

        nextButton?.addEventListener('click', () => {
            if (!validateControls(getFields(steps[currentStep]))) return;
            clearPortalAlert();
            if (currentStep < stepCount - 1) currentStep += 1;
            updateStepUI();
        });

        previousButton?.addEventListener('click', () => {
            clearPortalAlert();
            if (currentStep > 0) currentStep -= 1;
            updateStepUI();
        });

        registerButton?.addEventListener('click', register);
        document.getElementById('back-btn')?.addEventListener('click', () => {
            window.location.href = 'selection_role.html';
        });
        if (passwordInput) {
            passwordInput.readOnly = true;
            passwordInput.value = generateSecurePassword(16);
            const translation = document.getElementById('nato-translation');
            const result = document.getElementById('nato-result');
            if (translation) translation.textContent = translateNATO(passwordInput.value);
            if (result) result.style.display = 'block';
        }

        document.getElementById('gen-pass-btn')?.addEventListener('click', () => {
            if (!passwordInput) return;
            passwordInput.value = generateSecurePassword(16);
            const translation = document.getElementById('nato-translation');
            const result = document.getElementById('nato-result');
            if (translation) translation.textContent = translateNATO(passwordInput.value);
            if (result) result.style.display = 'block';
        });

        synchronizeRequiredFields();
        updateStepUI();
    }

export {
    clearPortalAlert,
    copyNatoTranslation,
    generateSecurePassword,
    initializePortal,
    showPortalAlert,
    togglePassword,
    translateNATO
};

window.LCAcademyPortal = {
    clearPortalAlert,
    copyNatoTranslation,
    generateSecurePassword,
    initializePortal,
    showPortalAlert,
    togglePassword,
    translateNATO
};
window.copyNatoTranslation = copyNatoTranslation;
window.togglePass = togglePassword;
