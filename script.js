import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDjzmlKtVLNes-gQT4OpU7cvKcu8Cce_Sk",
    authDomain: "lc-academy-890df.firebaseapp.com",
    projectId: "lc-academy-890df",
    storageBucket: "lc-academy-890df.firebasestorage.app",
    messagingSenderId: "186139500601",
    appId: "1:186139500601:web:79004b1edcc767ac6bade8"
};

// 1. Inicialización de los servicios de Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Referencias a elementos del DOM
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const regBtn = document.getElementById('reg-btn');
const backBtn = document.getElementById('back-btn');
const nextStepBtn = document.getElementById('next-step-btn');
const prevStepBtn = document.getElementById('prev-step-btn');
const genPassBtn = document.getElementById('gen-pass-btn');

const modalNotification = document.getElementById('modal-notification');
const modalIcon = document.getElementById('modal-icon');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const modalCloseBtn = document.getElementById('modal-close-btn');

// Funciones Auxiliares seguras
const getVal = (id) => document.getElementById(id)?.value?.trim() || "";
const getChecked = (id) => !!document.getElementById(id)?.checked;

// Funciones Globales para el HTML
window.showPremiumAlert = (icon, title, text, callback = null) => {
    if (!modalNotification) return alert(`${title}: ${text}`);
    modalIcon.innerText = icon;
    modalTitle.innerText = title;
    modalText.innerText = text;
    modalNotification.classList.add('active');

    modalCloseBtn.onclick = () => {
        modalNotification.classList.remove('active');
        if (callback) callback();
    };
};

window.generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let retVal = "";
    for (let i = 0; i < 16; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return retVal;
};

window.calculateFinalGrade = () => {
    const t1 = parseFloat(getVal('gradeT1')) || 0;
    const t2 = parseFloat(getVal('gradeT2')) || 0;
    const t3 = parseFloat(getVal('gradeT3')) || 0;
    const avg = (t1 + t2 + t3) / 3;
    const finalInput = document.getElementById('finalGrade');
    if (finalInput) finalInput.value = avg.toFixed(2);
};

window.toggleDisabilityDetail = () => {
    const hasDisability = getVal('hasDisability');
    document.getElementById('disability-detail-block')?.classList.toggle('hidden', hasDisability !== 'Sí');
};

window.toggleWorkDetails = () => {
    const didWork = getVal('didWork');
    document.getElementById('work-details-block')?.classList.toggle('hidden', didWork !== 'Sí');
};

window.toggleTransportOther = () => {
    const method = getVal('transportMethod');
    document.getElementById('transport-other-block')?.classList.toggle('hidden', method !== 'Otro');
};

window.toggleAbandonReasons = () => {
    const didAbandon = getVal('didAbandon');
    document.getElementById('abandon-reasons-block')?.classList.toggle('hidden', didAbandon !== 'Sí');
};

window.toggleTutorSecondary = () => {
    const relation = getVal('tutorRelation');
    document.getElementById('tutor-secondary-block')?.classList.toggle('hidden', relation !== 'Ambos (Padre y Madre)');
};

window.togglePass = (id, el) => {
    const input = document.getElementById(id);
    if (!input) return;
    if (input.type === "password") {
        input.type = "text";
        el.innerHTML = '<i class="fas fa-eye-slash"></i>'; 
    } else {
        input.type = "password";
        el.innerHTML = "<i class='fas fa-eye'></i>";
    }
};

const coursesMap = {
    kinder: ["Kinder 1", "Kinder 2", "Pre-Primaria"],
    primaria: ["1er Año Primaria", "2do Año Primaria", "3er Año Primaria", "4to Año Primaria", "5to Año Primaria", "6to Año Primaria"],
    secundaria: ["1er Año Secundaria", "2do Año Secundaria", "3er Año Secundaria", "4to Año Secundaria", "5to Año Secundaria", "6to Año Secundaria"]
};

window.updateCourseList = () => {
    const level = getVal('eduLevel');
    const courseSelect = document.getElementById('userCourse');
    if (!courseSelect) return;
    courseSelect.innerHTML = '<option value="">-- Seleccione Curso --</option>';
    if (level && coursesMap[level]) {
        coursesMap[level].forEach(course => {
            const option = document.createElement('option');
            option.value = course;
            option.textContent = course;
            courseSelect.appendChild(option);
        });
    }
};

// Lógica del Stepper (Pasos del formulario de estudiante)
let currentStep = 1;
const totalSteps = 5;

window.selectRole = (role, el) => {
    document.querySelectorAll('.role-option').forEach(opt => opt.classList.remove('active'));
    if (el) el.classList.add('active');
    
    const roleInput = document.getElementById('userRole');
    if (roleInput) roleInput.value = role;

    document.getElementById('role-selection-step')?.classList.add('hidden');
    const form = document.getElementById('user-form');
    form?.classList.remove('hidden');

    updateFormLayout(role);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
};

function updateFormLayout(role) {
    const simpleForm = document.getElementById('simple-form-container');
    const stepperForm = document.getElementById('student-stepper-container');
    const teacherFields = document.getElementById('teacher-fields');
    const finalActions = document.getElementById('final-actions');

    simpleForm?.classList.add('hidden');
    stepperForm?.classList.add('hidden');
    teacherFields?.classList.add('hidden');
    finalActions?.classList.add('hidden');

    if (role === 'student') {
        stepperForm?.classList.remove('hidden');
        setupStepper();
    } else {
        simpleForm?.classList.remove('hidden');
        if (role === 'teacher') {
            teacherFields?.classList.remove('hidden');
        }
        finalActions?.classList.remove('hidden');
    }
}

function setupStepper() {
    currentStep = 1;
    updateStepUI();
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

    if (prevStepBtn) prevStepBtn.disabled = (currentStep === 1);

    const finalActions = document.getElementById('final-actions');
    if (currentStep === totalSteps) {
        nextStepBtn?.classList.add('hidden');
        finalActions?.classList.remove('hidden');
    } else {
        nextStepBtn?.classList.remove('hidden');
        finalActions?.classList.add('hidden');
    }
}

// Event Listeners principales
genPassBtn?.addEventListener('click', () => {
    const pass = window.generatePassword();
    const passInput = document.getElementById('userGeneratedPass');
    if (passInput) passInput.value = pass;
});

nextStepBtn?.addEventListener('click', () => {
    if (currentStep < totalSteps) {
        currentStep++;
        updateStepUI();
    }
});

prevStepBtn?.addEventListener('click', () => {
    if (currentStep > 1) {
        currentStep--;
        updateStepUI();
    }
});

backBtn?.addEventListener('click', () => {
    document.getElementById('user-form')?.classList.add('hidden');
    document.getElementById('role-selection-step')?.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

loginBtn?.addEventListener('click', async () => {
    const email = getVal('admin-email');
    const pass = getVal('admin-pass');
    if (!email || !pass) return alert("Por favor ingresa tus credenciales");
    
    loginBtn.innerText = "VALIDANDO...";
    loginBtn.disabled = true;
    
    try {
        // 1. Configurar la persistencia para que recuerde el dispositivo
        await setPersistence(auth, browserLocalPersistence);

        // 2. Iniciar sesión normalmente
        await signInWithEmailAndPassword(auth, email, pass);

        document.getElementById('login-section')?.classList.add('hidden');
        document.getElementById('admin-panel')?.classList.remove('hidden');
    } catch (e) {
        alert("Error de acceso: " + e.message);
    } finally {
        loginBtn.innerText = "INGRESAR AL SISTEMA";
        loginBtn.disabled = false;
    }
});
logoutBtn?.addEventListener('click', async () => {
    await signOut(auth);
    location.reload();
});

regBtn?.addEventListener('click', async () => {
    const role = getVal('userRole');
    let userData = {
        createdAt: new Date(),
        activo: true,
        role: role
    };

    if (role === 'student') {
        userData.personal_info = {
            rude: getVal('rudeCode'),
            ci: getVal('studentCI'),
            ciComp: getVal('studentCIComp'),
            ciExp: getVal('studentCIExp'),
            names: getVal('studentNames'),
            firstLast: getVal('studentFirstLast'),
            secondLast: getVal('studentSecondLast'),
            birthDate: getVal('studentBirth'),
            sex: getVal('studentSex'),
            cert: {
                oficialia: getVal('certOficialia'),
                libro: getVal('certLibro'),
                partida: getVal('certPartida'),
                folio: getVal('certFolio')
            },
            birthPlace: {
                dept: getVal('birthDept'),
                prov: getVal('birthProv'),
                muni: getVal('birthMuni'),
                loc: getVal('birthLoc')
            }
        };
        userData.address = {
            dept: getVal('addrDept'),
            prov: getVal('addrProv'),
            muni: getVal('addrMuni'),
            loc: getVal('addrLoc'),
            zona: getVal('addrZona'),
            calle: getVal('addrCalle'),
            num: getVal('addrNum'),
            phone: getVal('addrPhone')
        };
        userData.socioeconomic = {
            langChildhood: getVal('langChildhood'),
            langFrequent: getVal('langFrequent'),
            nation: getVal('nationOrigin'),
            health: {
                hasHealthCenter: getVal('hasHealthCenter'),
                carePlace: getVal('healthCarePlace'),
                visits: getVal('healthCenterVisits'),
                hasInsurance: getVal('hasInsurance')
            },
            disability: {
                hasDisability: getVal('hasDisability'),
                type: getVal('disabilityType'),
                hasDisorder: getVal('hasDisorder')
            },
            hasTalentReport: getVal('hasTalentReport'),
            services: {
                water: getChecked('svcWater'),
                sewage: getChecked('svcSewage'),
                electric: getChecked('svcElectric'),
                gas: getChecked('svcGas'),
                trash: getChecked('svcTrash')
            },
            internet: {
                hasInternet: getVal('hasInternet'),
                devices: getVal('techDevices')
            },
            labor: {
                didWork: getVal('didWork'),
                months: getVal('workMonths'),
                activity: getVal('workActivity'),
                shift: getVal('workShift'),
                payment: getVal('workPayment')
            },
            transport: {
                method: getVal('transportMethod'),
                other: getVal('transportOther'),
                time: getVal('transportTime')
            },
            abandonment: {
                didAbandon: getVal('didAbandon'),
                reasons: getVal('abandonReasons')
            }
        };
        userData.tutor = {
            relation: getVal('tutorRelation'),
            tutor1: {
                ci: getVal('tutorCI'),
                ciExp: getVal('tutorCIExp'),
                fullName: getVal('tutorFullName'),
                phone: getVal('tutorPhone')
            },
            tutor2: getVal('tutorRelation') === 'Ambos (Padre y Madre)' ? {
                ci: getVal('tutor2CI'),
                ciExp: getVal('tutor2CIExp'),
                fullName: getVal('tutor2FullName'),
                phone: getVal('tutor2Phone')
            } : null,
            lang: getVal('tutorLang'),
            job: getVal('tutorJob'),
            edu: getVal('tutorEdu')
        };
        userData.academic_info = {
            level: "ESPERA",
            course: "ESPERA",
            parallel: "ESPERA",
            schedule: "ESPERA",
            lastYearGrades: {
                t1: getVal('gradeT1'),
                t2: getVal('gradeT2'),
                t3: getVal('gradeT3'),
                final: getVal('finalGrade')
            }
        };
        userData.credentials = {
            email: getVal('userEmailStudent'),
            password: getVal('userGeneratedPass')
        };

        if (!userData.personal_info.names || !userData.personal_info.firstLast) {
            return alert("Por favor complete los datos básicos de identidad");
        }
    } else {
        userData.name = getVal('userName');
        userData.email = getVal('userEmail');
        userData.password = getVal('userPass') || "Temp123!";
        userData.observaciones = getVal('userNotes');

        if (role === 'teacher') {
            userData.teacher_info = {
                phone: getVal('teacherPhone'),
                level: getVal('teacherLevel'),
                course: getVal('teacherCourse'),
                subject: getVal('teacherSubject'),
                hours: getVal('teacherHours'),
                title: getVal('teacherTitle'),
                reg: getVal('teacherReg'),
                exp: getVal('teacherExp')
            };
        }
        if (!userData.name || !userData.email) return alert("Por favor complete nombre y email");
    }

    regBtn.innerText = "REGISTRANDO...";
    regBtn.disabled = true;

    try {
        await addDoc(collection(db, "students"), userData);
        preparePrintSheet(userData);
        window.showPremiumAlert("✅", "¡Registro Exitoso!", "El estudiante ha sido registrado correctamente. Puede imprimir la Ficha RUDE ahora.", () => {
            window.print();
            location.reload();
        });
    } catch (e) {
        window.showPremiumAlert("❌", "Error de Registro", "Hubo un problema al guardar los datos: " + e.message);
    } finally {
        regBtn.innerText = "REGISTRAR ESTUDIANTE Y GENERAR FICHA RUDE";
        regBtn.disabled = false;
    }
});

function preparePrintSheet(data) {
    const content = document.getElementById('print-content');
    if (!content) return;
    content.innerHTML = '';

    if (data.role === 'student') {
        const p = data.personal_info;
        const creds = data.credentials;

        const fields = {
            "Nombre de Usuario": `${p.names} ${p.firstLast} ${p.secondLast}`.trim(),
            "Contraseña": creds?.password || 'N/A',
            "Email Registrado": creds?.email || 'N/A',
            "Tipo de Usuario": "Estudiante",
            "C.I.": `${p.ci} ${p.ciComp} ${p.ciExp}`.trim(),
            "Código RUDE": p.rude || 'N/A'
        };

        for (const [label, value] of Object.entries(fields)) {
            content.innerHTML += `
                <div class="print-item">
                    <span class="badge-hex"></span>
                    <span class="print-label">${label}</span>
                    <span>${value}</span>
                </div>`;
        }
    } else {
        const fields = {
            "Nombre de Usuario": data.name,
            "Contraseña": data.password,
            "Email Registrado": data.email,
            "Tipo de Usuario": data.role === 'teacher' ? 'Maestro' : 'Padre de Familia'
        };

        for (const [label, value] of Object.entries(fields)) {
            content.innerHTML += `
                <div class="print-item">
                    <span class="badge-hex"></span>
                    <span class="print-label">${label}</span>
                    <span>${value}</span>
                </div>`;
        }
    }
}